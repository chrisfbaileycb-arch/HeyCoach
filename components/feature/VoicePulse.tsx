import React, { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

interface VoicePulseProps {
  personaColor: string;
  initial: string;
  isActive?: boolean;
  size?: number;
}

export function VoicePulse({
  personaColor,
  initial,
  isActive = false,
  size = 72,
}: VoicePulseProps) {
  const progress1 = useSharedValue(0);
  const progress2 = useSharedValue(0);
  const timer2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isActive) {
      progress1.value = withRepeat(withTiming(1, { duration: 1000 }), -1, false);
      timer2.current = setTimeout(() => {
        progress2.value = withRepeat(withTiming(1, { duration: 1000 }), -1, false);
      }, 420);
    } else {
      if (timer2.current) clearTimeout(timer2.current);
      cancelAnimation(progress1);
      cancelAnimation(progress2);
      progress1.value = 0;
      progress2.value = 0;
    }
    return () => {
      if (timer2.current) clearTimeout(timer2.current);
    };
  }, [isActive]);

  const ring1Style = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - progress1.value),
    transform: [{ scale: 1 + progress1.value * 1.4 }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - progress2.value),
    transform: [{ scale: 1 + progress2.value * 2 }],
  }));

  const outerSize = size * 3.4;

  return (
    <View
      style={{
        width: outerSize,
        height: outerSize,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: personaColor,
          },
          ring2Style,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: personaColor,
          },
          ring1Style,
        ]}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: personaColor + '18',
          borderWidth: 2,
          borderColor: personaColor,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <Text
          style={{
            color: personaColor,
            fontSize: Math.round(size * 0.38),
            fontWeight: '800',
          }}
        >
          {initial}
        </Text>
      </View>
    </View>
  );
}
