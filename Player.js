import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Button } from 'react-native';
import Slider from '@react-native-community/slider';

import Sound from 'react-native-nitro-sound';
import { parseSrt } from './srt';

import {
  requestMicPermissionIfNeeded,
  resolvePlayableUri,
  getMusicDiskPathForMerge,
  mergeAudio,
} from './src/utils/audioUtils';

const findCueAt = (cues, posMs, lastIndexRef) => {
  let i = lastIndexRef.current ?? 0;
  if (!cues.length) return null;

  while (i < cues.length && posMs > cues[i].endMs) i++;
  while (i > 0 && posMs < cues[i].startMs) i--;

  lastIndexRef.current = i;

  const cue = cues[i];
  if (!cue) return null;
  if (posMs >= cue.startMs && posMs <= cue.endMs) return cue;
  return null;
};

const formatTime = (sec = 0) => {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

export default function HomeScreen({ navigation, route }) {
  // Pass these from parent or hardcode for now:
  const mp3Uri = route?.params?.mp3Uri; // could be require(...) or path/url
  const srtText = route?.params?.srtText; // optional

  const cues = useMemo(() => parseSrt(srtText || ''), [srtText]);

  const [activeText, setActiveText] = useState('');
  const lastIndexRef = useRef(0);

  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const [isMerging, setIsMerging] = useState(false);
  const [mergeError, setMergeError] = useState(null);

  const playableUriRef = useRef(null);

  const isPlayingRef = useRef(false);
  const isLoadedRef = useRef(false);

  const isRecordingRef = useRef(false);
  const recordedPathRef = useRef(null);

  const didSetupRef = useRef(false);
  const didStopRef = useRef(false);

  useEffect(() => {
    lastIndexRef.current = 0;
    setActiveText('');
  }, [cues]);

  useEffect(() => {
    (async () => {
      const ok = await requestMicPermissionIfNeeded();
      if (!ok) console.warn('Mic permission denied');
    })();
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const playable = await resolvePlayableUri(mp3Uri);
        playableUriRef.current = playable;

        // reset playback UI
        isPlayingRef.current = false;
        isLoadedRef.current = false;
        didStopRef.current = false;
        setPosition(0);
        setDuration(0);

        if (!mounted) return;

        if (!didSetupRef.current) {
          Sound.addPlayBackListener(e => {
            const posMs = Math.floor(e.currentPosition || 0);
            const durMs = Math.floor(e.duration || 0);

            if (!isSeeking) setPosition(posMs / 1000);
            setDuration(durMs > 0 ? durMs / 1000 : 0);

            const cue = findCueAt(cues, posMs, lastIndexRef);
            setActiveText(cue?.text ?? '');
          });

          Sound.addPlaybackEndListener(() => {
            isPlayingRef.current = false;
            isLoadedRef.current = false;
            // If playback ends naturally while recording, stop+merge
            if (!didStopRef.current && isRecordingRef.current) {
              didStopRef.current = true;
              onStop();
            }
          });

          didSetupRef.current = true;
        }
      } catch (e) {
        console.warn('Init error:', e);
      }
    })();

    return () => {
      mounted = false;

      (async () => {
        try {
          if (isRecordingRef.current) {
            await Sound.stopRecorder();
            Sound.removeRecordBackListener?.();
            isRecordingRef.current = false;
          }
        } catch {}

        try {
          await Sound.stopPlayer();
        } catch {}

        try {
          Sound.removePlayBackListener?.();
          Sound.removePlaybackEndListener?.();
        } catch {}
      })();
    };
  }, [mp3Uri, cues, isSeeking]);

  const startRecording = async () => {
    if (isRecordingRef.current) return;
    const path = await Sound.startRecorder();
    recordedPathRef.current = path;
    isRecordingRef.current = true;
    Sound.addRecordBackListener?.(() => {});
  };

  const startPlayback = async playable => {
    if (!isLoadedRef.current) {
      await Sound.startPlayer(playable);
      isLoadedRef.current = true;
    } else {
      await Sound.resumePlayer();
    }
    isPlayingRef.current = true;
  };

  // ✅ Start = play + record together
  const onStart = async () => {
    try {
      setMergeError(null);
      didStopRef.current = false;

      const playable =
        playableUriRef.current || (await resolvePlayableUri(mp3Uri));
      playableUriRef.current = playable;

      await Promise.all([startPlayback(playable), startRecording()]);
    } catch (e) {
      console.warn('Start error:', e);
      setMergeError(String(e?.message || e));
    }
  };

  // ✅ Stop = stop recording -> merge -> navigate Output
  const onStop = async () => {
    if (!isRecordingRef.current) return;

    setIsMerging(true);
    setMergeError(null);

    try {
      // stop player (optional but usually expected when user hits stop)
      try {
        await Sound.pausePlayer();
        isPlayingRef.current = false;
      } catch {}

      const recordedPath = await Sound.stopRecorder();
      Sound.removeRecordBackListener?.();

      isRecordingRef.current = false;
      recordedPathRef.current = recordedPath;

      const musicDiskPath = await getMusicDiskPathForMerge(mp3Uri);
      const mergedPath = await mergeAudio(musicDiskPath, recordedPath);

      // go Output
      navigation.navigate('Output', {
        recordedPath,
        mergedPath,
      });
    } catch (e) {
      console.warn('Stop/merge error:', e);
      setMergeError(String(e?.message || e));
    } finally {
      setIsMerging(false);
    }
  };

  const max = Math.max(0, duration || 0);

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
      <Button
        title="Start Recording + Play"
        onPress={onStart}
        disabled={isMerging || isRecordingRef.current}
      />
      <View style={{ height: 12 }} />
      <Button
        title="Stop Recording"
        onPress={onStop}
        disabled={isMerging || !isRecordingRef.current}
      />

      {/* Progress + subtitles (optional, kept from your original) */}
      <View style={{ marginTop: 18 }}>
        <Slider
          value={isSeeking ? seekValue : position}
          minimumValue={0}
          maximumValue={max > 0 ? max : 1}
          onSlidingStart={() => {
            setIsSeeking(true);
            setSeekValue(position);
          }}
          onValueChange={v => setSeekValue(v)}
          onSlidingComplete={async v => {
            try {
              await Sound.seekToPlayer(Math.floor(v * 1000));
              setPosition(v);
            } catch (e) {
              console.warn('Seek error:', e);
            } finally {
              setIsSeeking(false);
            }
          }}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text>{formatTime(isSeeking ? seekValue : position)}</Text>
          <Text>{formatTime(duration)}</Text>
        </View>
      </View>

      <View
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 12,
          backgroundColor: '#111',
        }}
      >
        <Text style={{ color: 'white', fontSize: 18, textAlign: 'center' }}>
          {activeText || ' '}
        </Text>
      </View>

      {!!mergeError && (
        <Text style={{ marginTop: 12, color: 'red' }} numberOfLines={10}>
          {mergeError}
        </Text>
      )}

      {/* ✅ Fullscreen merging overlay */}
      {isMerging && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '600' }}>
            Merging…
          </Text>
        </View>
      )}
    </View>
  );
}
