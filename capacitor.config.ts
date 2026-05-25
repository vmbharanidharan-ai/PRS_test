import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.genescreen.app",
  appName: "GeneScope",
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
