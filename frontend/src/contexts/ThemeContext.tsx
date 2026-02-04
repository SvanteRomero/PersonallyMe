import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ThemeName, ThemeMode } from '../types';
import { THEME_KEY, THEME_MODE_KEY, DEFAULT_THEME, DEFAULT_THEME_MODE, THEMES } from '../utils/constants';

interface ThemeContextType {
    theme: ThemeName;
    mode: ThemeMode;
    setTheme: (theme: ThemeName) => void;
    setMode: (mode: ThemeMode) => void;
    toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeName>(() => {
        const stored = localStorage.getItem(THEME_KEY) as ThemeName;
        // Validate that the stored theme actually exists in our THEMES definition
        if (stored && THEMES[stored]) {
            return stored;
        }
        return DEFAULT_THEME;
    });

    const [mode, setModeState] = useState<ThemeMode>(() => {
        const stored = localStorage.getItem(THEME_MODE_KEY);
        if (stored) return stored as ThemeMode;

        // Check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return DEFAULT_THEME_MODE;
    });

    // Apply theme classes to document
    useEffect(() => {
        const root = document.documentElement;

        // Remove all theme classes
        root.classList.remove('theme-amber', 'theme-terracotta', 'theme-gold', 'light', 'dark');

        // Add current theme class (amber is default, so no class needed)
        if (theme !== 'amber') {
            root.classList.add(`theme-${theme}`);
        }

        // Add mode class
        root.classList.add(mode);

        // Update meta theme-color
        const themeColors: Record<ThemeName, Record<ThemeMode, string>> = {
            amber: { light: '#F59E0B', dark: '#D97706' },
            terracotta: { light: '#E07A5F', dark: '#DC2626' },
            gold: { light: '#B8860B', dark: '#A16207' },
        };

        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', themeColors[theme][mode]);
        }
    }, [theme, mode]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            // Only auto-switch if user hasn't manually set a preference
            const storedMode = localStorage.getItem(THEME_MODE_KEY);
            if (!storedMode) {
                setModeState(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const setTheme = useCallback((newTheme: ThemeName) => {
        if (THEMES[newTheme]) {
            localStorage.setItem(THEME_KEY, newTheme);
            setThemeState(newTheme);
        } else {
            console.warn(`Attempted to set invalid theme: ${newTheme}`);
            localStorage.setItem(THEME_KEY, DEFAULT_THEME);
            setThemeState(DEFAULT_THEME);
        }
    }, []);

    const setMode = useCallback((newMode: ThemeMode) => {
        localStorage.setItem(THEME_MODE_KEY, newMode);
        setModeState(newMode);
    }, []);

    const toggleMode = useCallback(() => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
    }, [mode, setMode]);

    const value: ThemeContextType = {
        theme,
        mode,
        setTheme,
        setMode,
        toggleMode,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export default ThemeContext;
