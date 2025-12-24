import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useDerivedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import SwiperDot from './SwiperDot';

const { width } = Dimensions.get('window');

const steps = [
  {
    title: 'Yapay Zeka ile Sihirli Karaoke',
    subtitle: 'İstediğin her şarkıyı söyle!',
    description:
      'Beatify’in yapay zekâsı, sevdiğin şarkıları saniyeler içinde karaoke formatına dönüştürür. Favori parçalarından birini seç ve anında söylemeye başla.',
  },
  {
    title: 'Stüdyo Kalitesinde Ses Efektleri',
    subtitle: 'Bir profesyonel gibi söyle!',
    description:
      'Gelişmiş ses efektleriyle (Yankı, Derinlik vb.) performansların stüdyo kaydı hissi verir.',
  },
  {
    title: 'Sınırsız Şarkı Kütüphanesi',
    subtitle: 'Bitmeyen eğlence!',
    description:
      'Çeşitli türlerde ve dillerde sınırsız şarkıyı karaokeye çevirip, söyle!',
  },
];

export default function Onboarding() {
  const currentIndex = useSharedValue(0);

  const translateX = useDerivedValue(() => {
    return withSpring(-currentIndex.value * width);
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleNext = () => {
    if (currentIndex.value < steps.length - 1) {
      currentIndex.value += 1;
    } else {
      // onboarding finished
      // navigate to main screen
    }
  };


  const panGesture = Gesture.Pan().onEnd(e => {
    if (e.translationX < -50 && currentIndex.value < steps.length - 1) {
      currentIndex.value += 1;
    }

    if (e.translationX > 50 && currentIndex.value > 0) {
      currentIndex.value -= 1;
    }
  });

  return (
    <LinearGradient
      colors={['#000000', '#083344']}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 5 }} />

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.container, animatedStyle]}>
          {steps.map((screen, index) => (
            <View key={index} style={{ width, paddingHorizontal: 20 }}>
              <Text style={styles.title}>{screen.title}</Text>
              <Text style={styles.subtitle}>{screen.subtitle}</Text>
              <Text style={styles.description}>{screen.description}</Text>
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      <View style={styles.bottom}>
        <View style={styles.center}>
          <TouchableOpacity onPress={handleNext}>
            <Text style={{ color: 'white' }}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.center}>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextIcon}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dots}>
          {steps.map((_, i) => (
                <SwiperDot key={i} index={i} currentIndex={currentIndex} />
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: width * steps.length,
  },
  title: {
    fontSize: 25,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  bottom: {
    flex: 1,
    flexDirection: 'row',
    marginBottom: 50,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtn: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'white',
    justifyContent:'center',
    alignItems:'center',
    aspectRatio:1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    transform: [{ rotate: '45deg' }],
  },
  nextIcon: {
    color: 'white',
    fontSize: 18,
    transform: [{ rotate: '-45deg' }],
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 5,
    borderRadius: 10,
    backgroundColor: 'white',
    marginRight: 5,
  },
});
