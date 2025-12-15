import React, { memo, useMemo } from 'react';
import { View, Text, ViewStyle, StyleProp } from 'react-native';
import Slider from '@react-native-community/slider';

type Props = {
  position: number; // seconds
  duration: number; // seconds
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

const formatTime = (sec: number = 0) => {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

function PlaybackSlider({
  position,
  duration,
  disabled = true,
  containerStyle,
}: Props) {
  const max = useMemo(() => Math.max(1, duration || 0), [duration]);

  return (
    <View style={[{ marginTop: 18 }, containerStyle]}>
      <Slider
        value={position}
        minimumValue={0}
        maximumValue={max}
        disabled={disabled}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text>{formatTime(position)}</Text>
        <Text>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

export default memo(PlaybackSlider);
