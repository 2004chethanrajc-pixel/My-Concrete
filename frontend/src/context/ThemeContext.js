import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DARK_MODE_KEY = '@dark_mode';

export const lightColors = {
  background: '#F7F9FC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textLight: '#999999',
  border: '#E0E0E0',
  inputBg: '#FFFFFF',
  cardBg: '#FFFFFF',
  headerBg: '#FFFFFF',
  modalBg: '#FFFFFF',
  toolbarBg: '#FFFFFF',
  sectionBg: '#F8F9FA',
  placeholderText: '#9CA3AF',
  iconColor: '#1A1A1A',
  subText: '#6B7280',
  divider: '#E2E8F0',
};

export const darkColors = {
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceSecondary: '#222222',
  textPrimary: '#F0F0F0',
  textSecondary: '#AAAAAA',
  textLight: '#777777',
  border: '#333333',
  inputBg: '#1E1E1E',
  cardBg: '#1A1A1A',
  headerBg: '#111111',
  modalBg: '#1A1A1A',
  toolbarBg: '#111111',
  sectionBg: '#161616',
  placeholderText: '#666666',
  iconColor: '#F0F0F0',
  subText: '#AAAAAA',
  divider: '#2A2A2A',
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DARK_MODE_KEY).then((val) => {
      if (val !== null) setIsDarkMode(val === 'true');
    });
  }, []);

  const toggleDarkMode = async () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    await AsyncStorage.setItem(DARK_MODE_KEY, String(next));
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
