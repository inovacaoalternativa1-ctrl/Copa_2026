const SOUND_URL = '/sounds/brasil-sil-sil.mp3';
let audio = null;

export const playBrasilSound = () => {
  try {
    if (!audio) audio = new Audio(SOUND_URL);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch { /* ignora se o navegador bloquear autoplay */ }
};
