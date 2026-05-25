let context: AudioContext | undefined;

function getContext() {
  if (typeof window === "undefined") return undefined;
  context ||= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
}

function tone(frequency: number, duration = 0.08, delay = 0, gainValue = 0.1) {
  const audio = getContext();
  if (!audio) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const start = audio.currentTime + delay;
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function playLike() {
  tone(880, 0.055, 0, 0.1);
  tone(1100, 0.07, 0.035, 0.08);
}

export function playRepost() {
  tone(660, 0.055, 0, 0.09);
  tone(880, 0.06, 0.075, 0.09);
}

export function playBookmark() {
  tone(440, 0.12, 0, 0.08);
}

export function playPostCreated() {
  [440, 550, 660, 880].forEach((frequency, index) => tone(frequency, 0.055, index * 0.055, 0.075));
}

export function playNotification() {
  tone(880, 0.1, 0, 0.08);
  tone(1100, 0.1, 0, 0.07);
}
