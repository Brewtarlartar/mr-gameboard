import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mrgameboard.app',
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
      group: 'MrGameBoardPrefs',
    },
  },
};

export default config;
