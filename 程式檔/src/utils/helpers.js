import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("讀取 LocalStorage 發生錯誤:", error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        alert('⚠️ 儲存空間已滿！請嘗試刪除一些舊的專案或庫存，或使用較小的圖片。');
      }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '未知';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '剛剛更新';
  if (minutes < 60) return `${minutes} 分鐘前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小時前`;
  return `${Math.floor(hours / 24)} 天前`;
};

export const formatTime = (totalSeconds) => {
  if (!totalSeconds) return '00:00:00';
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export const playAudioFeedback = (freq = 440, type = 'sine', duration = 0.1) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (error) { }
};

export const playTargetReachedSound = () => {
  playAudioFeedback(523.25, 'sine', 0.15);
  setTimeout(() => playAudioFeedback(659.25, 'sine', 0.3), 100);
};

export const createDefaultCounter = (name, value = 0) => ({
  name, value, target: null, autoReset: false, linkAction: 0, autoAdvance: false
});

export const getLapProgress = (value, target) => {
  if (!target) return 0;
  const progress = value % target;
  return (progress === 0 && value > 0) ? target : progress;
};
