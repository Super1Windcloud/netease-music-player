import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { playbackService } from "@/constants/playbackService";
import { useLogTrackPlayerState } from "@/hooks/useLogTrackPlayerState";
import { usePlaybackIntegrations } from "@/hooks/usePlaybackIntegrations";
import { useSetupTrackPlayer } from "@/hooks/useSetupTrackPlayer";
import { useTheme } from "@/hooks/useTheme";
import TrackPlayer from "@/lib/expo-track-player";

SplashScreen.preventAutoHideAsync();

TrackPlayer.registerPlaybackService(playbackService);

const App = () => {
	const { theme } = useTheme();
	const handleTrackPlayerLoaded = useCallback(() => {
		SplashScreen.hideAsync();
	}, []);

	useSetupTrackPlayer({
		onLoad: handleTrackPlayerLoaded,
	});

	useLogTrackPlayerState();
	usePlaybackIntegrations();

	return (
		<SafeAreaProvider>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<RootNavigation />

				<StatusBar style={theme === "dark" ? "light" : "dark"} />
			</GestureHandlerRootView>
		</SafeAreaProvider>
	);
};

const RootNavigation = () => {
	return (
		<Stack>
			<Stack.Screen name="(tabs)" options={{ headerShown: false }} />

			<Stack.Screen
				name="player"
				options={{
					presentation: "card",
					gestureEnabled: true,
					gestureDirection: "horizontal",
					fullScreenGestureEnabled: true,
					animationDuration: 400,
					headerShown: false,
				}}
			/>
		</Stack>
	);
};

export default App;
