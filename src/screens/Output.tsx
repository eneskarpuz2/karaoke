// Output.js
import React, { useRef, useState } from 'react';
import { View, Text, Button } from 'react-native';
import Sound from 'react-native-nitro-sound';
import Share from 'react-native-share';
import { toFileUri } from '../utils/audioUtils';
import AppButton from '../components/AppButton';

export default function Output({ route, navigation }) {
  const { recordedPath, mergedPath } = route.params || {};

  const currentSourceRef = useRef(null); // 'recorded' | 'merged' | null
  const [currentSource, setCurrentSource] = useState(null);

  const stopPlayer = async () => {
    try {
      await Sound.stopPlayer();
    } catch {}
    currentSourceRef.current = null;
    setCurrentSource(null);
  };

  const togglePlay = async (source, path) => {
    if (!path) return;

    try {
      if (currentSourceRef.current === source) {
        await stopPlayer();
        return;
      }

      await stopPlayer();
      await Sound.startPlayer(toFileUri(path));
      currentSourceRef.current = source;
      setCurrentSource(source);
    } catch (e) {
      console.warn('Playback error:', e);
    }
  };

  const shareAudio = async (source: string) => {
    const path = source === 'merged' ? mergedPath : recordedPath;

    try {
      await Share.open({
        title: 'Share audio',
        url: toFileUri(path),
        type: 'audio/wav',
        failOnCancel: false,
      });
    } catch (e) {
      console.warn('Share failed:', e);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 16, justifyContent: 'center' }}>
      <AppButton
        title={
          currentSource === 'recorded' ? 'Stop User Voice' : 'Play User Voice'
        }
        onPress={() => togglePlay('recorded', recordedPath)}
        disabled={!recordedPath}
        style={{ width: '100%', marginVertical: 0, borderRadius: 12 }}
      />

      <AppButton
        title="Share User Voice"
        onPress={() => shareAudio('recorded')}
        disabled={!recordedPath}
        variant="secondary"
        style={{ width: '100%', marginVertical: 0, borderRadius: 12 }}
      />

      <AppButton
        title={currentSource === 'merged' ? 'Stop Mix' : 'Play Mix'}
        onPress={() => togglePlay('merged', mergedPath)}
        disabled={!mergedPath}
        style={{ width: '100%', marginVertical: 0, borderRadius: 12 }}
      />

      <AppButton
        title="Share mix"
        onPress={() => shareAudio('merged')}
        disabled={!mergedPath}
        variant="secondary"
        style={{ width: '100%', marginVertical: 0, borderRadius: 12 }}
      />

      <AppButton
        title="Back to Home"
        onPress={async () => {
          await stopPlayer();
          navigation.goBack();
        }}
        variant="ghost"
        style={{ width: '100%', marginVertical: 0, borderRadius: 12 }}
      />

      <View style={{ marginTop: 16 }}>
        <Text>Recorded: {toFileUri(recordedPath) || '-'}</Text>
        <Text>Merged: {toFileUri(mergedPath) || '-'}</Text>
      </View>
    </View>
  );
}
