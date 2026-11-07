'use client';

import { useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

const modes: ThemeMode[] = ['light', 'dark', 'system'];

function readSavedMode(): ThemeMode {
  try {
    const saved = window.localStorage.getItem('portfolio-theme');
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
}

function applyMode(mode: ThemeMode) {
  if (mode === 'system') {
    delete document.documentElement.dataset.theme;
    return;
  }

  document.documentElement.dataset.theme = mode;
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    const savedMode = readSavedMode();
    setMode(savedMode);
    applyMode(savedMode);
  }, []);

  function cycleMode() {
    const nextMode = modes[(modes.indexOf(mode) + 1) % modes.length];
    setMode(nextMode);
    applyMode(nextMode);

    try {
      if (nextMode === 'system') {
        window.localStorage.removeItem('portfolio-theme');
      } else {
        window.localStorage.setItem('portfolio-theme', nextMode);
      }
    } catch {
      // The theme still changes for this visit when storage is unavailable.
    }
  }

  return (
    <button
      aria-label={`Theme preference: ${mode}. Activate to change theme.`}
      className="theme-toggle"
      onClick={cycleMode}
      title="Cycle light, dark, and system themes"
      type="button"
    >
      <span aria-hidden="true" className="theme-toggle__icon">
        ◐
      </span>
      <span>Theme: {mode}</span>
    </button>
  );
}
