import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../config/constants';

export default function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(200),
        ])
      );
    };

    const anim1 = animate(dot1, 0);
    const anim2 = animate(dot2, 150);
    const anim3 = animate(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  const translateY = (dot) =>
    dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -6],
    });

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Animated.View
          style={[
            styles.dot,
            { transform: [{ translateY: translateY(dot1) }] },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            { transform: [{ translateY: translateY(dot2) }] },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            { transform: [{ translateY: translateY(dot3) }] },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: 4,
    paddingBottom: 4,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.receivedBubble,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.textSecondary,
  },
});