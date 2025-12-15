import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, Text, Platform, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import Sound from 'react-native-nitro-sound';
import {
  check,
  request,
  openSettings,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';

import PlaybackSlider from '../components/Slider';
import { parseSrt, loadSrt, findCueAt } from '../utils/subtitleUtils';
import {
  ensureSongOnDisk,
  resolvePlayableUri,
  mergeAudio,
  convertToWav,
} from '../utils/audioUtils';
import Mixing from '../components/Mixing';
import AppButton from '../components/AppButton';

type HomeProps = { navigation: any };
type PlaybackEvent = { currentPosition?: number; duration?: number };

const mp3: number = require('../../assets/song.mp3');

export default function Home({ navigation }: HomeProps) {
  const mp3Uri = mp3;

  const [srt, setSrt] = useState<string | null>(null);
  const cues = useMemo(() => parseSrt(srt || ''), [srt]);

  const cuesRef = useRef<any[]>([]);
  const lastIndexRef = useRef(0);

  const playableRef = useRef<string | null>(null);
  const isRunningRef = useRef(false);
  const isRecordingRef = useRef(false);
  const stopGuardRef = useRef(false);

  const [isRunningUI, setIsRunningUI] = useState(false);
  const [activeText, setActiveText] = useState('');
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMerging, setIsMerging] = useState(false);

  const ensureMicPermission = useCallback(async () => {
    const perm =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.MICROPHONE
        : PERMISSIONS.ANDROID.RECORD_AUDIO;

    const s = await check(perm);
    if (s === RESULTS.GRANTED) return true;

    const r = await request(perm);
    if (r === RESULTS.GRANTED) return true;

    if (r === RESULTS.BLOCKED) {
      Alert.alert(
        'Microphone permission needed',
        'Enable microphone permission in Settings to record.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openSettings() },
        ],
      );
    }
    return false;
  }, []);

  useEffect(() => {
    ensureMicPermission().catch(() => {});
  }, [ensureMicPermission]);

  useEffect(() => {
    loadSrt().then(setSrt).catch(console.error);
  }, []);

  useEffect(() => {
    cuesRef.current = cues;
    lastIndexRef.current = 0;
    setActiveText('');
  }, [cues]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureSongOnDisk(mp3Uri);
        const playable = await resolvePlayableUri(mp3Uri);
        if (!cancelled) playableRef.current = playable;
      } catch (e) {
        console.warn('Preload playable uri failed:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mp3Uri]);

  const resolveMusicDiskPath = useCallback(
    async () => ensureSongOnDisk(mp3Uri),
    [mp3Uri],
  );

  const stopAndMix = useCallback(async () => {
    if (stopGuardRef.current) return;
    stopGuardRef.current = true;

    setIsRunningUI(false);
    isRunningRef.current = false;

    setPosition(0);
    setDuration(0);
    setActiveText('');
    lastIndexRef.current = 0;

    setIsMerging(true);

    try {
      try {
        await Sound.stopPlayer();
      } catch {}
      try {
        await (Sound as any).seekToPlayer?.(0);
      } catch {}

      let recorded: string | null = null;
      if (isRecordingRef.current) {
        try {
          recorded = await Sound.stopRecorder();
        } finally {
          Sound.removeRecordBackListener?.();
          isRecordingRef.current = false;
        }
      }

      if (!recorded) throw new Error('No mic recording found.');

      const voiceWavPath = `${RNFS.CachesDirectoryPath}/Voice.wav`;
      const voiceWav = await convertToWav(recorded, voiceWavPath, {
        channels: 1,
        sampleRate: 44100,
      });

      const musicDiskPath = await resolveMusicDiskPath();
      const mixOutPath = `${RNFS.CachesDirectoryPath}/karaoke_mix.wav`;

      const merged = await mergeAudio(musicDiskPath, voiceWav, {
        outputPath: mixOutPath,
        musicGain: 0.9,
        micGain: 1.5,
        sampleRate: 44100,
      });

      navigation.navigate('Output', {
        recordedPath: voiceWav,
        mergedPath: merged,
      });
    } catch (e) {
      console.warn('Stop/mix failed:', e);
    } finally {
      setIsMerging(false);
    }
  }, [navigation, resolveMusicDiskPath]);

  const start = useCallback(async () => {
    if (isRunningRef.current || isMerging) return;

    stopGuardRef.current = false;
    lastIndexRef.current = 0;
    setActiveText('');
    setPosition(0);
    setDuration(0);

    const ok = await ensureMicPermission();
    if (!ok) return;

    const playable = playableRef.current || (await resolvePlayableUri(mp3Uri));
    if (!playable) return;

    try {
      await Sound.stopPlayer();
    } catch {}
    try {
      await (Sound as any).seekToPlayer?.(0);
    } catch {}

    await Promise.all([
      (async () => {
        await Sound.startPlayer(playable);
        isRunningRef.current = true;
        setIsRunningUI(true);
      })(),
      (async () => {
        await Sound.startRecorder();
        isRecordingRef.current = true;
        Sound.addRecordBackListener?.(() => {});
      })(),
    ]);
  }, [ensureMicPermission, isMerging, mp3Uri]);

  const onPressMain = useCallback(() => {
    if (isRunningRef.current) stopAndMix();
    else start();
  }, [start, stopAndMix]);

  useEffect(() => {
    Sound.addPlayBackListener((e: PlaybackEvent) => {
      if (!isRunningRef.current) return;

      const posMs = Math.floor(e.currentPosition || 0);
      const durMs = Math.floor(e.duration || 0);

      setPosition(posMs / 1000);
      setDuration(durMs > 0 ? durMs / 1000 : 0);

      const cue = findCueAt(cuesRef.current, posMs, lastIndexRef);
      setActiveText(cue?.text ?? '');

      if (
        isRunningRef.current &&
        isRecordingRef.current &&
        durMs > 0 &&
        posMs >= durMs - 250
      ) {
        stopAndMix();
      }
    });

    Sound.addPlaybackEndListener(() => {
      if (isRunningRef.current) stopAndMix();
    });

    return () => {
      (async () => {
        try {
          if (isRecordingRef.current) await Sound.stopRecorder();
        } catch {}
        try {
          await Sound.stopPlayer();
        } catch {}
        try {
          await (Sound as any).seekToPlayer?.(0);
        } catch {}

        isRunningRef.current = false;
        isRecordingRef.current = false;
        setIsRunningUI(false);

        try {
          Sound.removeRecordBackListener?.();
          Sound.removePlayBackListener?.();
          Sound.removePlaybackEndListener?.();
        } catch {}
      })();
    };
  }, [stopAndMix]);

  if (!srt) return null;

  return (
    <View style={{ flex: 1, padding: 25, gap: 15, justifyContent: 'center' }}>
      {isMerging && <Mixing />}

      <View>
        <Text style={{ fontSize: 20, alignSelf: 'center', fontWeight: 'bold' }}>
          Lyrics
        </Text>

        <View
          style={{
            marginTop: 10,
            padding: 16,
            borderRadius: 12,
            backgroundColor: '#111',
          }}
        >
          <Text style={{ color: 'white', fontSize: 18, textAlign: 'center' }}>
            {activeText || '...'}
          </Text>
        </View>
      </View>

      <PlaybackSlider
        position={isRunningUI ? position : 0}
        duration={isRunningUI ? duration : 0}
        disabled
      />

      <AppButton
        title={isRunningUI ? 'Stop and Mix' : 'Play and Record'}
        onPress={onPressMain}
        disabled={isMerging}
      />
    </View>
  );
}
