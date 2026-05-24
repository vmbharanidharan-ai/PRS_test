import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.prsscreen.app",
  appName: "PRS Screen",
  webDir: "out",
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: "automatic",
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
