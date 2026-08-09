import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const theme = 'light';

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.classList.remove('dark');
    root.classList.add('light');
    body.classList.remove('dark');
    body.classList.add('light');
    
    localStorage.setItem('spendpilot_theme', 'light');
  }, []);

  const toggleTheme = () => {
    // Permanent light theme
  };

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

