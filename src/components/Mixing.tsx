import { ActivityIndicator, Text, View } from 'react-native';

const Mixing = () => {
  return (
    <View
      style={{
        zIndex: 1000,
        elevation: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
      }}
    >
      <ActivityIndicator color={'white'} size={'large'} />
      <Text style={{ color: 'white', fontSize: 20, fontWeight: '600' }}>
        Mixing
      </Text>
    </View>
  );
};

export default Mixing;
