import { ref, watch } from 'vue';

const THEME_KEY = 'app-theme';

function getStoredTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === 'dark' || t === 'light' ? t : 'light';
  } catch {
    return 'light';
  }
}

function applyToDOM(isDark) {
  const html = document.documentElement;
  if (isDark) {
    html.classList.add('dark');
    html.setAttribute('color-scheme', 'dark');
  } else {
    html.classList.remove('dark');
    html.setAttribute('color-scheme', 'light');
  }
}

/** 在 main.js 中调用，用于首屏前应用主题，避免闪烁 */
export function initTheme() {
  const theme = getStoredTheme();
  applyToDOM(theme === 'dark');
}

/**
 * 主题 composable：响应式 isDark + 切换方法
 */
export function useTheme() {
  const isDark = ref(getStoredTheme() === 'dark');

  watch(
    isDark,
    (v) => {
      localStorage.setItem(THEME_KEY, v ? 'dark' : 'light');
      applyToDOM(v);
    },
    { immediate: true }
  );

  function toggleTheme() {
    isDark.value = !isDark.value;
  }

  function setTheme(theme) {
    isDark.value = theme === 'dark';
  }

  return { isDark, toggleTheme, setTheme };
}
