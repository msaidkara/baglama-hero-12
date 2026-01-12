export type FeedbackType = "PERFECT" | "GOOD" | "EARLY" | "LATE" | "WRONG_NOTE" | "MISS";

export interface EvaluationResult {
  status: FeedbackType;
  scoreDelta: number; // e.g., +100 for perfect, -10 for wrong
  message: string; // User facing text like "Harika!", "Biraz Geç", "Yanlış Perde"
}

export class PerformanceEvaluator {
  // Tolerance in Hz or Cents (adjust as needed for Baglama)
  private readonly PITCH_TOLERANCE_HZ = 5;
  private readonly TIMING_WINDOW_MS = 200; // 200ms window for "Perfect"

  evaluate(
    targetFreq: number,
    detectedFreq: number | null,
    targetTime: number,
    playedTime: number
  ): EvaluationResult {

    // 1. Check if user played anything
    if (!detectedFreq || detectedFreq <= 0) {
      return { status: "MISS", scoreDelta: 0, message: "Ses Yok" };
    }

    // 2. Check Pitch Accuracy
    const frequencyDifference = Math.abs(detectedFreq - targetFreq);
    if (frequencyDifference > this.PITCH_TOLERANCE_HZ) {
      return {
        status: "WRONG_NOTE",
        scoreDelta: 0,
        message: "Yanlış Nota" // Maybe suggest higher/lower later
      };
    }

    // 3. Check Timing Accuracy
    const timeDiff = playedTime - targetTime; // Negative = Early, Positive = Late
    const absDiff = Math.abs(timeDiff);

    if (absDiff < 50) { // Super precise
       return { status: "PERFECT", scoreDelta: 100, message: "Mükemmel!" };
    } else if (absDiff < this.TIMING_WINDOW_MS) {
       // Within acceptible window but not perfect
       const status = timeDiff < 0 ? "EARLY" : "LATE";
       const msg = timeDiff < 0 ? "Erken Bastın" : "Geç Kaldın";
       return { status: status, scoreDelta: 50, message: msg };
    } else {
       // Right note, but way too off tempo
       return { status: "MISS", scoreDelta: 10, message: "Ritim Kaçtı" };
    }
  }
}
