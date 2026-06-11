# Personal Finance Tracker

A React Native app built with Expo, TypeScript, and SQLite. It stores your finance data locally on the device.

This guide is written for beginners on macOS. The normal Android APK build path uses Expo EAS Build in the cloud, so you do not need to install Android Studio just to create an APK.

## Version 3 Highlights

- Practical offline multi-currency ledger with editable transactions, soft delete/restore, transfers, exchange, loans, fees, tax, losses, compensation, refunds, interest, and investments.
- Custom categories with more line icons, color accents, and safe remove behavior that preserves transaction history.
- Manage wallets and currencies, including additional fiat and crypto defaults plus custom currency definitions.
- Reports with date presets, custom date ranges, charts, wallet distribution, loan/debt, tax/fee, interest, loss, compensation, and top expense views.
- Budgets and goals for monthly planning, over-budget tracking, savings targets, emergency funds, and debt payoff targets.
- Theme presets plus a custom theme builder, scalable language metadata, and English/Burmese/Thai/Chinese Simplified language options.
- Full JSON backup/import and CSV exports. Google backup screens are scaffolded but require manual OAuth setup before sign-in can work.

## Before Upgrading From An Older APK

Version 3 includes a safe SQLite migration to `PRAGMA user_version = 3`. It adds currencies, budgets, goals, backup metadata, custom theme support, and remove timestamps without wiping existing wallets, categories, or transactions.

Before installing a test APK over an older APK, open Settings and create a full JSON backup if the old app version supports it. If not, keep a copy of the old APK installed on one device until you confirm the upgraded ledger opens correctly.

## Fastest path for beginners

1. Push this code to GitHub.
2. Add `EXPO_TOKEN` to GitHub Secrets.
3. Run the GitHub Actions workflow named `Build Android APK`.
4. Download the APK from Expo.

## What You Need

- A Mac with macOS.
- A free Expo account.
- A GitHub repository for this project.
- An Android phone for installing the APK.

You do not need Android Studio for the normal cloud APK build path.

## 1. Install Homebrew

Homebrew helps install developer tools on macOS.

Open the macOS Terminal app and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

When Homebrew finishes, it may print one or two commands under `Next steps`. Copy and run those commands in Terminal.

Check that Homebrew works:

```bash
brew --version
```

## 2. Install Node.js

Node.js runs the JavaScript tools used by Expo.

```bash
brew install node
```

Check that Node.js and npm work:

```bash
node --version
npm --version
```

Use Node.js 20 or newer. Node.js 22 is a good choice for this project.

## 3. Install Git

Git lets you download, save, and push code to GitHub.

```bash
brew install git
```

Check that Git works:

```bash
git --version
```

## 4. Install EAS CLI

EAS CLI sends your app to Expo's cloud build service.

```bash
npm install -g eas-cli
```

Check that EAS CLI works:

```bash
eas --version
```

## 5. Create Or Log In To An Expo Account

Create a free Expo account at [expo.dev/signup](https://expo.dev/signup), or log in at [expo.dev/login](https://expo.dev/login).

Then log in from Terminal:

```bash
eas login
```

Check that you are logged in:

```bash
eas whoami
```

## 6. Install Project Dependencies

From the project folder, run:

```bash
npm install
```

This installs the app's JavaScript dependencies.

## 7. Run The App Locally

Start Expo:

```bash
npx expo start
```

Then install the Expo Go app on your phone and scan the QR code shown in Terminal or in the browser window.

For Android:

```bash
npm run android
```

This opens the Android target if you have an Android emulator connected. For beginners, using Expo Go on a real phone is usually easier.

## 8. Build An Android APK With EAS Build

The project includes `eas.json` with a `preview` profile that builds an APK, not an AAB.

Run:

```bash
npm run build:android:preview
```

This is the same as:

```bash
eas build --platform android --profile preview
```

The first build may ask Expo to create Android credentials. Let Expo manage the credentials when it asks.

When the build starts, Expo prints a link to the build page. You can close Terminal after the build is safely queued because the build runs in the cloud.

## 9. Download The APK From Expo

1. Go to [expo.dev](https://expo.dev).
2. Log in with the same Expo account.
3. Open your project.
4. Open the latest Android build.
5. Download the `.apk` file.

## 10. Install The APK On An Android Phone

1. Send the APK to your Android phone, or open the Expo build link on the phone.
2. Tap the APK file.
3. If Android blocks it, allow installs from that app when prompted.
4. Tap `Install`.
5. Open Personal Finance Tracker from your app list.

Android may show a warning because this APK is not from the Play Store. That is normal for a private test APK.

## GitHub Actions APK Build

This repository includes a manually triggered GitHub Actions workflow:

```text
.github/workflows/android-apk.yml
```

The workflow:

- Runs only when you start it manually with `workflow_dispatch`.
- Installs Node.js.
- Installs project dependencies with `npm ci`.
- Runs TypeScript checking.
- Starts an Android APK build on Expo EAS.
- Uses `EXPO_TOKEN` from GitHub Secrets.

The EAS preview profile remains configured for APK output in `eas.json`:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## Create EXPO_TOKEN

1. Log in to [expo.dev](https://expo.dev).
2. Open your account settings.
3. Go to `Access Tokens`.
4. Create a new token.
5. Copy the token. Treat it like a password.

## Add EXPO_TOKEN To GitHub Secrets

1. Open your GitHub repository in a browser.
2. Go to `Settings`.
3. Go to `Secrets and variables`.
4. Go to `Actions`.
5. Click `New repository secret`.
6. Name the secret exactly:

```text
EXPO_TOKEN
```

7. Paste your Expo access token as the value.
8. Click `Add secret`.

## Run The GitHub Actions Build

1. Push your code to GitHub.
2. Open your GitHub repository.
3. Click `Actions`.
4. Click `Build Android APK`.
5. Click `Run workflow`.
6. Choose the branch.
7. Click the green `Run workflow` button.
8. Wait for the workflow to finish.
9. Open the Expo dashboard link printed in the workflow logs.
10. Download the APK from Expo.

Important: EAS Build needs the Expo project to be linked to your Expo account. If GitHub Actions says the EAS project is not configured, run this locally once, commit the app config change that Expo creates, push it, and run the workflow again:

```bash
eas project:init
```

## Google Backup Status

Version 3 includes the local database tables and app screens for Google backup metadata, Google Sheets backup, Google Drive JSON backup, restore preview, and automatic backup preference.

The actual Google sign-in and cloud write integration is intentionally not enabled yet. To finish it:

1. Create a Google Cloud project.
2. Enable the Google Drive API and Google Sheets API.
3. Configure OAuth consent and create OAuth client IDs for Expo/Android.
4. Add the client IDs through a safe app config or secret-based build setup.
5. Implement the sign-in and upload/download calls behind the existing Google Backup screen.

Do not commit Google client secrets or private tokens to this repository.

## Available Scripts

```bash
npm run start
npm run android
npm run typecheck
npm run test
npm run build:android:preview
```

`npm run test` runs the ledger logic tests, including transaction balance rules, report summaries, category and wallet remove decisions, date ranges, budgets, and goals.

## Troubleshooting

### npm command not found

Node.js is not installed, or Terminal cannot find it.

Try:

```bash
brew install node
node --version
npm --version
```

If Homebrew printed `Next steps` after installation, make sure you ran those commands too.

### eas command not found

EAS CLI is not installed.

```bash
npm install -g eas-cli
eas --version
```

If it still fails, close Terminal, open a new Terminal window, and try again.

### Permission denied

This can happen when npm global packages were installed with the wrong permissions.

Try installing EAS CLI again:

```bash
npm install -g eas-cli
```

If npm tells you to use `sudo`, you can run:

```bash
sudo npm install -g eas-cli
```

Type your Mac password when prompted. Terminal will not show the password while you type.

### EXPO_TOKEN missing

GitHub Actions cannot log in to Expo.

Check that:

- The secret is named exactly `EXPO_TOKEN`.
- The secret is in `GitHub Repository -> Settings -> Secrets and variables -> Actions`.
- You added it as a repository secret, not an environment secret.
- You copied the full Expo access token.

### Build failed

Open the failed build in the Expo dashboard and read the first red error.

Common fixes:

- Run `npm install` locally and commit `package-lock.json` if dependencies changed.
- Run `npm run typecheck` locally and fix TypeScript errors.
- Make sure `app.json` has a valid Android package name.
- Make sure you are logged in with `eas login`.
- Run `eas project:init` once if the project is not linked to Expo.

### APK cannot install

Try these checks:

- Make sure you downloaded the `.apk` file, not an `.aab` file.
- Delete any older version of the app from the phone, then install again.
- Allow installs from your browser or file app when Android asks.
- Make sure the APK finished downloading before opening it.
- Build again if the APK file seems corrupted.

### Expo account not logged in

Run:

```bash
eas login
eas whoami
```

If the wrong account appears:

```bash
eas logout
eas login
```

### Wrong Node version

Use Node.js 20 or newer. Node.js 22 is recommended.

Check your version:

```bash
node --version
```

If your version is too old:

```bash
brew update
brew upgrade node
node --version
```

## Project Notes

- App framework: React Native with Expo.
- Language: TypeScript.
- Local database: SQLite through `expo-sqlite`.
- Android cloud builds: EAS Build.
- Normal APK path: cloud build, no Android Studio required.

## Useful Links

- [Expo](https://expo.dev)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [Build APKs with EAS](https://docs.expo.dev/build-reference/apk/)
- [GitHub Actions](https://docs.github.com/actions)
