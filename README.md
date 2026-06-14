# Personal Finance Tracker

A React Native app built with Expo, TypeScript, and SQLite. It stores your finance data locally on the device.

This guide is written for beginners on macOS. The normal Android APK build path uses Expo EAS Build in the cloud, so you do not need to install Android Studio just to create an APK.

## Version 7.0 Mobile V7

- Bottom tabs are exactly Dashboard, Records, Reports, and Investments.
- Add and Settings moved out of bottom tabs. Dashboard uses a profile/account button for Settings and account tools.
- Dashboard removes recent transactions and keeps quick add through the floating action button.
- Records adds grouped ledger history with search, filters, sorting, detail navigation, edit, delete, and restore.
- Categories now support parent categories and subcategories. Migration preserves old transaction categories as parent categories.
- Transaction records store original currency, exchange rate at entry time, base amount, parent category, and optional subcategory.
- Transfers and exchanges stay neutral and are not counted as expenses.
- Investments adds user-entered investment records and valuations only. No live market prices or fake investment data are used.
- Reports support parent category and subcategory breakdowns.
- Theme picker uses the requested grid: System spans both columns, Light/Dark share the next row, presets continue in two columns.
- Android preview APK remains the primary build target for this V7 fix.

## Project Structure

```text
src/
  components/      Reusable UI controls, cards, charts, pickers, forms, FAB
  constants/       Build metadata and currency defaults/rates
  context/         App preferences and finance data providers
  database/        SQLite schema, migrations, seed data, repository functions
  i18n/            English, Burmese/Myanmar, Thai, Simplified Chinese
  logic/           Pure finance, report, category, investment, budget, goal logic
  navigation/      Root stack, bottom tabs, route types
  screens/         Dashboard, Records, Reports, Investments, Settings, management screens
  theme/           Light/dark/system theme presets
  utils/           Date, file, icon, ID, and money helpers
```

## Install And Run

```bash
npm install
npm run typecheck
npm test
npx expo start
```

Useful validation:

```bash
npx expo-doctor
npx expo config --type public --json
npx expo prebuild --platform android --no-install
```

If `android/` is generated only for validation, remove it before committing unless native project files are intentionally adopted.

Android preview build command:

```bash
eas build --platform android --profile preview --clear-cache
```

## SQLite Schema Summary

- `wallets`: local accounts such as Binance USDT, Cash MMK, Cash THB, USD Cash, Bank/Other.
- `categories`: parent categories and subcategories through `parent_id`.
- `transactions`: original amount/currency, wallet, destination wallet, exchange rate, base currency amount, parent category, subcategory, soft delete timestamp.
- `currencies`: active fiat/crypto/custom currency definitions.
- `budgets`, `goals`, `goal_contributions`: local planning data.
- `investments`: user-entered buy/sell/income/fee/valuation records with optional current value and P/L fields.
- `backup_metadata`, `app_settings`, `custom_theme_settings`: local app preferences and backup state.

Current database version is `PRAGMA user_version = 4`.

## Version 5.1 UX Refinement

- Removes the dedicated bottom Calendar tab; date selection stays inside the Reports date-range modal.
- Adds safe Dashboard and Reports widget customization with up/down controls and hide/show preferences stored locally.
- Removes automatic sample finance transactions so new installs start with safe defaults and real empty states.
- Adds a Settings User Manual with setup, ledger, reports, backup, theme, language, troubleshooting, and APK notes.
- Tightens picker/filter spacing and adds consistent line icons for currency, category, wallet, and transaction type selectors.
- Keeps the Expo/EAS Android preview APK setup unchanged.

## Version 4 UX Polish

- Replaces many horizontal chip rows with native bottom-sheet pickers and searchable selectors.
- Reports now use a compact date range control and a filters sheet for currency, category, wallet, and transaction type.
- Theme picker uses compact built-in theme previews and recently used themes.
- Dashboard has a more native premium hero area, compact quick actions, a currency picker, and swipeable wallet cards.
- Google Backup now shows honest setup-required states, connection failure messaging when OAuth is missing, local JSON backup export, and last backup display.
- No new large dependencies were added for this V4 pass.

## Version 3 Foundation

- Practical offline multi-currency ledger with editable transactions, soft delete/restore, transfers, exchange, loans, fees, tax, losses, compensation, refunds, interest, and investments.
- Custom categories with more line icons, color accents, and safe remove behavior that preserves transaction history.
- Manage wallets and currencies, including additional fiat and crypto defaults plus custom currency definitions.
- Reports with date presets, custom date ranges, charts, wallet distribution, loan/debt, tax/fee, interest, loss, compensation, and top expense views.
- Budgets and goals for monthly planning, over-budget tracking, savings targets, emergency funds, and debt payoff targets.
- Theme presets, scalable language metadata, and English/Burmese/Thai/Chinese Simplified language options.
- Full JSON backup/import and CSV exports. Google backup screens are scaffolded but require manual OAuth setup before sign-in can work.

## Before Upgrading From An Older APK

Version 3 includes a safe SQLite migration to `PRAGMA user_version = 3`. It adds currencies, budgets, goals, backup metadata, custom theme support, and remove timestamps without wiping existing wallets, categories, or transactions.

Version 4 is a UX polish pass and does not add a new SQLite migration. Version 7 upgrades the database to `user_version = 4` by adding category hierarchy fields and investment records without wiping existing wallets, categories, or transactions. Before installing a test APK over an older APK, open Settings and create a full JSON backup if the old app version supports it. If not, keep a copy of the old APK installed on one device until you confirm the upgraded ledger opens correctly.

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

Version 4 keeps the local database tables and app screens for Google backup metadata, Google Sheets backup, Google Drive JSON backup, restore preview, and automatic backup preference.

Implemented now:

- Clear `Not connected`, `Connecting`, and `Connection failed` UI states.
- Setup-required message when Google OAuth client IDs are missing.
- Local JSON backup export from the Google Backup screen.
- Last local backup date display.
- Automatic backup preference UI, with a note that cloud automation is disabled until Google setup is complete.

The actual Google sign-in and cloud write integration is intentionally not enabled yet. To finish it:

1. Create a Google Cloud project.
2. Enable the Google Drive API and Google Sheets API.
3. Configure OAuth consent and create OAuth client IDs for Expo/Android.
4. Add the client IDs through a safe app config or secret-based build setup.
5. Implement the sign-in and upload/download calls behind the existing Google Backup screen.

Do not commit Google client secrets or private tokens to this repository.

## How To Test V5.1 UX

Reports date range:

1. Open Reports.
2. Tap the date range card at the top.
3. Choose a preset such as `Last month` or `This year`.
4. Choose `Custom date range`, enter start and end dates, then tap `Apply`.
5. Confirm report totals, charts, and transaction history update for the selected range.

Reports filters:

1. Open Reports.
2. Tap `Filters`.
3. Choose currency, category, wallet, or transaction type.
4. Tap `Apply`.
5. Use `Reset filters` to return to all data.

Dashboard and Reports customization:

1. Open Dashboard and tap `Customize`.
2. Move widgets up or down, hide a widget, then show it again.
3. Open Reports and repeat the same flow for report widgets.
4. Restart the app and confirm the widget order/visibility is preserved.

User Manual:

1. Open Settings.
2. Tap `User Manual`.
3. Expand each section and confirm the content is split into readable cards.

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
