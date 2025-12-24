import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import FirstScreen from './FirstScreen';
import SecondScreen from './SecondScreen';
import ThirdScreen from './ThirdScren';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const steps = [
  {
    layout: 0,
    title: 'Yapay Zeka ile Sihirli Karaoke',
    subtitle: 'İstediğin her şarkıyı söyle!',
    description:
      'Beatify’in yapay zekâsı, sevdiğin şarkıları saniyeler içinde karaoke formatına dönüştürür. Favori parçalarından birini seç ve anında söylemeye başla.',
    image:
      'https://lottie.host/e71af491-ac35-485a-9d1e-4cfd608dc3df/wCu3bMsiY8.lottie',
    loop: false,
  },
  {
    layout: 0,
    title: 'Stüdyo Kalitesinde Ses Efektleri',
    subtitle: 'Bir profesyonel gibi söyle!',
    description:
      'Gelişmiş ses efektleriyle (Yankı, Derinlik vb.) performansların stüdyo kaydı hissi verir. Kayıtlarınız kusursuz ve canlı duyulur.',
    image:
      'https://lottie.host/209cb6aa-6237-4170-b844-fc64602bae57/kRKGf32svA.lottie',
    loop: true,
  },
  {
    layout: 0,
    title: 'Sınırsız Şarkı Kütüphanesi',
    subtitle: 'Bitmeyen eğlence!',
    description:
      'Çeşitli türlerde ve dillerde sınırsız şarkıyı karaokeye çevirip, söyle! Klasiklerden güncel hitlere kadar geniş repertuarda her zaman yeni bir parça bulacaksın.',
    image:
      'https://lottie.host/0a069af1-3bf7-45fc-862a-22f1865a1a2c/m4FRlUX3wE.lottie',
    loop: true,
  },
];

export default function Onboarding() {
  const translateX = useSharedValue(0);
  const currentIndex = useSharedValue(0);

  const handleNext = () => {
  if (currentIndex.value < steps.length - 1) {
    currentIndex.value += 1;
    translateX.value = withSpring(-currentIndex.value * width);
  }else {
    // onboarding finished
    // navigate to main app screen later
  }
};

  const panGesture = Gesture.Pan().onEnd(e => {
    if (e.translationX < -50 && currentIndex.value < steps.length - 1) {
      currentIndex.value += 1;
    }
    if (e.translationX > 50 && currentIndex.value > 0) {
      currentIndex.value -= 1;
    }
    translateX.value = withSpring(-currentIndex.value * width);
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <LinearGradient 
      start={{ x: 0.5, y: 0 }}
  end={{ x: 0.5, y: 1 }}
    style={{ flex: 1 }} colors={['#000000', '#0891b2']}>
      <View style={{ flex: 5, }}></View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.container, animatedStyle]}>
          {steps.map((screen, index) => (
            <View style={{ width,paddingHorizontal:20 }} key={index}>
              <Text className='text-3xl font-bold text-white mb-4'>
                {screen.title}
              </Text>
              <Text style={{ fontSize: 20, color: 'white' }}>
                {screen.subtitle}
              </Text>
              <Text style={{ fontSize: 20, color: 'white' }}>
                {screen.description}
              </Text>
            </View>
          ))}
        </Animated.View>
      </GestureDetector>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
        justifyContent:'center',
          marginBottom: 50,
        }}
      >
        <View style={{flex:1}}>
        <TouchableOpacity style={{flex:1,aspectRatio:1,justifyContent:'center',alignItems:'center'
          }} onPress={handleNext}>
          <Text style={{ color: 'white',fontSize: 15 }}>{"Skip"}</Text>
        </TouchableOpacity>
        </View>
        
        <View style={{}}>
        <TouchableOpacity style={{aspectRatio:1,borderWidth:1,justifyContent:'center',alignItems:'center',borderRadius:20,borderColor:'white',padding:20,
          transform:[{rotate:'45deg'}]}} onPress={handleNext}>
          <Text style={{ color: 'white',transform:[{rotate:'-45deg'}],fontSize: 18 }}>{">"}</Text>
        </TouchableOpacity>
        </View>
           <View style={{flex:1}}>

        <View className='flex-row border'>
          <View style={{backgroundColor:'white',borderRadius:10,height:5,width:5,marginRight:5}}></View>
          <View style={{backgroundColor:'white',borderRadius:10,height:5,width:5,marginRight:5}}></View>
          <View style={{backgroundColor:'white',borderRadius:10,height:5,width:5,marginRight:5}}></View>
        </View>
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
  page: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
