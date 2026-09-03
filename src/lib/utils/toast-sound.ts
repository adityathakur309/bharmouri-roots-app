/** Soft notification sound for toasts — fails silently if blocked by the browser. */

const NOTIFICATION_SRC = "/audio/br-audio.wav";

let sharedAudio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudio) {
    sharedAudio = new Audio(NOTIFICATION_SRC);
    sharedAudio.preload = "auto";
    sharedAudio.volume = 0.55;
  }
  return sharedAudio;
}

export function playToastNotificationSound(): void {
  try {
    const audio = getAudio();
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Autoplay may be blocked until a user gesture — ignore.
    });
  } catch {
    // Never break toast UX over audio
  }
}
