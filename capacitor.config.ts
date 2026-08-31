import type { CapacitorConfig } from '@capacitor/cli';

// appId is PERMANENT once submitted to either store — never change it.
// The WebView origins (capacitor://localhost on iOS, https://localhost on
// Android) are derived from the default schemes; changing schemes later wipes
// stored auth/localStorage, so leave them at their defaults forever.
const config: CapacitorConfig = {
  appId: 'com.javiermacias.thetome',
  appName: 'The Tome',
  webDir: 'out',
  backgroundColor: '#1c1917',
  ios: {
    contentInset: 'always',
    backgroundColor: '#1c1917',
  },
  android: {
    backgroundColor: '#1c1917',
  },
  plugins: {
    Haptics: {},
    Preferences: {
      group: 'TheTomePrefs',
    },
    SplashScreen: {
      backgroundColor: '#1c1917',
      launchAutoHide: true,
      launchShowDuration: 800,
    },
  },
};

export default config;
