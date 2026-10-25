import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "so.diyaar.store",
  appName: "Diyaar Store",
  webDir: "dist",
  server: {
    iosScheme: "https",
    androidScheme: "https",
  },
  ios: {
    contentInset: "never",
    // The page scrolls itself; native bounce would show a blank strip.
    scrollEnabled: false,
  },
  android: {
    backgroundColor: "#f9fafb",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: false,
      backgroundColor: "#219186",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      overlaysWebView: true,
      style: "LIGHT",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
