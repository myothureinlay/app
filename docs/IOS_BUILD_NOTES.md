# iOS Build Notes

Mobile V7 includes Expo iOS metadata in `app.json`:

- `ios.bundleIdentifier`: `com.myoe.financetracker`
- `ios.buildNumber`: `7`
- `ios.supportsTablet`: `true`
- `userInterfaceStyle`: `automatic`

Local validation commands:

```sh
npx expo config --type public --json
npx expo prebuild --platform ios --no-install
```

If `ios/` is generated only for validation, remove it before committing unless native project files are intentionally adopted.

Apple account limitation:

- Running an iOS simulator build can be done locally on macOS with Xcode.
- Installing on a physical iPhone, TestFlight distribution, App Store upload, signing certificates, provisioning profiles, and bundle ID registration require an Apple Developer account.
- EAS iOS cloud builds also require Apple authentication for signed device/TestFlight/App Store artifacts.

Recommended EAS command after Apple setup:

```sh
eas build --platform ios --profile preview
```
