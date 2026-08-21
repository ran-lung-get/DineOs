import { useState, useCallback } from "react";
import { playNotificationSound, playSuccessSound, playClickSound } from "../lib/sound";

export function useSoundEffects(initialEnabled: boolean = true) {
  const [soundEnabled, setSoundEnabled] = useState(initialEnabled);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const playAlert = useCallback(() => {
    if (soundEnabled) {
      playNotificationSound();
    }
  }, [soundEnabled]);

  const playSuccess = useCallback(() => {
    if (soundEnabled) {
      playSuccessSound();
    }
  }, [soundEnabled]);

  const playClick = useCallback(() => {
    if (soundEnabled) {
      playClickSound();
    }
  }, [soundEnabled]);

  return {
    soundEnabled,
    setSoundEnabled,
    toggleSound,
    playAlert,
    playSuccess,
    playClick,
  };
}
