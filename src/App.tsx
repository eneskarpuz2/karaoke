import { verifyInstallation } from "nativewind";
import "../global.css"
import RootNavigation from './navigation/Navigation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function App() {
  return (
    <>
      {/* <ErrorBoundary
        </ErrorBoundary> */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootNavigation />
      </GestureHandlerRootView>
    </>
  );
}

export default App;
