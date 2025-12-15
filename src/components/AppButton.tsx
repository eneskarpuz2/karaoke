// src/components/AppButton.tsx
import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

export type AppButtonProps = {
  title: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

export default function AppButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  textStyle,
  accessibilityLabel,
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  const spinnerColor =
    variant === 'ghost' ? styles.textGhost.color : styles.textPrimary.color;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text
          style={[styles.textBase, variantTextStyles[variant], textStyle]}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '70%',
    height: 50,
    marginVertical: 20,
    borderRadius: 100,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  },
  textBase: {
    fontSize: 18,
    fontWeight: '600',
  },

  textPrimary: { color: '#fff' },
  textGhost: { color: '#0057e7' },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: '#0057e7' },
  secondary: { backgroundColor: '#222' },
  danger: { backgroundColor: '#d11a2a' },
  ghost: { backgroundColor: 'transparent' },
});

const variantTextStyles = StyleSheet.create({
  primary: styles.textPrimary,
  secondary: styles.textPrimary,
  danger: styles.textPrimary,
  ghost: styles.textGhost,
});
