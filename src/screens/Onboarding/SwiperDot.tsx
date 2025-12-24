import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { StyleSheet } from 'react-native';

const SwiperDot = ({ index, currentIndex }: any) => {
  const dotStyles = useAnimatedStyle(() => {
    const isActive = currentIndex.value === index;

    return {
      backgroundColor: withTiming(
        isActive ? 'white' : 'rgba(255,255,255,0.3)',
        { duration: 200 }
      ),
      width: withTiming(isActive ? 10 : 5, { duration: 200 }),
    };
  });
  return <Animated.View style={[styles.dot, dotStyles]} />;
};

export default SwiperDot;

const styles = StyleSheet.create({
  dot: {
    height: 5,
    borderRadius: 10,
    marginRight: 5,
  },
});
