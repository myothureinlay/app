# Android Distribution Notes

## Play Protect warnings on sideloaded APKs

Google Play Protect may show warnings such as "App blocked to protect your device" or "Play Protect has not seen an app from this developer before" when an APK is installed manually outside Google Play.

This warning is expected for unknown or sideloaded developer builds. It is not something the app UI can fully remove by code. Google Play distribution, Play App Signing, and developer/app reputation are the normal path to reducing this warning.

## Recommended distribution path

- Use Google Play Console internal testing for trusted testers.
- Use closed testing for a broader private group.
- Use production AAB distribution when the app is ready for public release.
- Enable Play App Signing in Google Play Console.
- Keep the Android package unchanged: `com.personalfinancetracker.app`.

## EAS build commands

Preview APK for personal testing:

```bash
eas build --platform android --profile preview --clear-cache
```

Production AAB for Google Play:

```bash
eas build --platform android --profile production --clear-cache
```

## Personal testing workaround

If you trust your own build, Android may allow you to continue with an "Install anyway" style action. Use the correct build from the Expo/EAS build link, and avoid installing APKs from unknown or modified sources.

## App safety posture

Finance Tracker remains offline-first. It should not request SMS, calls, contacts, location, background services, or other dangerous permissions unless a future feature has a clear need and the user explicitly accepts it. Current finance data is stored locally on the device, and backups/exports are controlled by the user.

Do not promise users that Play Protect warnings can be removed 100% by app code. The reliable path is recognized Google Play distribution.
