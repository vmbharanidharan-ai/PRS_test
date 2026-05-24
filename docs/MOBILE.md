# PRS Screen — iOS & Android (Capacitor)

The web app is wrapped with [Capacitor](https://capacitorjs.com/) so the same on-device PRS pipeline runs in a native shell. DNA still never leaves the device.

## Prerequisites

- Node.js 20+
- **iOS:** macOS, Xcode 15+, CocoaPods (`sudo gem install cocoapods`)
- **Android:** Android Studio, SDK 34+, Java 17

## One-time setup

```bash
cd ~/Projects/app-test
npm install

# Static export + create native projects (first time only)
npm run build:mobile
npx cap add ios
npx cap add android
```

## Develop & run

After code changes:

```bash
npm run cap:sync
npm run cap:ios      # opens Xcode — Run on simulator/device
npm run cap:android  # opens Android Studio — Run
```

`cap:sync` runs `build:mobile` (Next.js static export to `out/`) and copies it into native projects.

## App Store checklist

| Item | Notes |
|------|--------|
| Bundle ID | Change `appId` in `capacitor.config.ts` before release |
| Privacy labels | Declare genetic data processed on-device, not collected |
| Icons & splash | Add in Xcode / Android Studio asset catalogs |
| Terms & Privacy | Host or bundle `/terms` and `/privacy` — included in static export |
| In-app disclaimer | Already shown on launch |
| TestFlight / Internal testing | Upload via Xcode / Play Console |

## Troubleshooting

- **Blank WebView:** Run `npm run cap:sync` again; confirm `out/index.html` exists.
- **File picker on iOS:** Uses system document picker; user must grant file access when selecting raw DNA export.
- **PDF on mobile:** Download PDF uses WebView save — works on iOS/Android 13+; fallback is share sheet from browser if needed.

## Optional: live reload during native dev

```bash
npm run dev
# In capacitor.config.ts temporarily set:
# server: { url: 'http://YOUR_LAN_IP:3000', cleartext: true }
npx cap sync
```

Revert `server.url` before App Store builds.
