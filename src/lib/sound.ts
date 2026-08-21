/**
 * Web Audio API Sound Synthesizer
 * ให้เสียงแจ้งเตือนโดยไม่ต้องโหลดไฟล์เสียงภายนอก
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (err) {
    console.warn("AudioContext init failed:", err);
    return null;
  }
}

/**
 * เล่นเสียงแจ้งเตือนออเดอร์ใหม่เข้าครัว (Double Beep High Pitch)
 */
export function playNotificationSound() {
  const context = getAudioContext();
  if (!context) return;

  try {
    const playTone = (time: number, freq: number) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(time);
      osc.stop(time + 0.15);
    };

    const now = context.currentTime;
    playTone(now, 880);
    playTone(now + 0.15, 1046.5);
  } catch (err) {
    console.warn("Sound play failed:", err);
  }
}

/**
 * เล่นเสียงยืนยันความสำเร็จ (Success Chime)
 */
export function playSuccessSound() {
  const context = getAudioContext();
  if (!context) return;

  try {
    const playTone = (time: number, freq: number) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(time);
      osc.stop(time + 0.25);
    };

    const now = context.currentTime;
    playTone(now, 523.25); // C5
    playTone(now + 0.1, 659.25); // E5
    playTone(now + 0.2, 783.99); // G5
    playTone(now + 0.3, 1046.5); // C6
  } catch (err) {
    console.warn("Success sound failed:", err);
  }
}

/**
 * เล่นเสียงคลิกเบาๆ
 */
export function playClickSound() {
  const context = getAudioContext();
  if (!context) return;

  try {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, context.currentTime);
    gain.gain.setValueAtTime(0.05, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(context.currentTime);
    osc.stop(context.currentTime + 0.05);
  } catch (err) {
    console.warn("Click sound failed:", err);
  }
}
