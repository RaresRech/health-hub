import * as Haptics from 'expo-haptics';

export async function triggerHaptic(intensity = 'light') {
  try {
    if (intensity === 'medium') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }

    if (intensity === 'soft') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      return;
    }

    await Haptics.selectionAsync();
  } catch (error) {
    // Haptics support varies by platform; silent fallback keeps interactions smooth.
  }
}
