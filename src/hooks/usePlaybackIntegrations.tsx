import { useEffect } from "react";
import { useIsPlaying } from "@/lib/expo-track-player";
import { WakelockService } from "@/lib/wake-lock";

export const usePlaybackIntegrations = () => {
	const { playing } = useIsPlaying();

	useEffect(() => {
		return () => {
			void WakelockService.deactivate();
		};
	}, []);

	useEffect(() => {
		const syncSideEffects = async () => {
			if (playing) {
				await WakelockService.activate();
			} else {
				await WakelockService.deactivate();
			}
		};

		syncSideEffects().catch((error) => {
			console.error("Failed to sync playback integrations", error);
		});
	}, [playing]);
};
