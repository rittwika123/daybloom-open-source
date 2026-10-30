# DayBloom 🌷

A gentle task planner with tasks, notes, calendar, activity timer, statistics, and reminders. DayBloom stores your data on your device and does not require an account or DayBloom server.

## Install DayBloom

### Android app (APK)

1. Open [DayBloom Releases](https://github.com/rittwika123/daybloom-open-source/releases/latest).
2. Under **Assets**, download the latest file named `DayBloom-Android.apk`.
3. Open the downloaded APK and tap **Install**.
4. If Android asks, allow your browser or file manager to install apps from that source. The exact prompt can vary by Android version.
5. Open DayBloom and allow notifications if you want reminders.

Only install APKs from the DayBloom Releases page linked above. GitHub Releases will contain an APK after an Android release has been published. The repository's source code and ZIP download are not installable apps.

For an update, download the newer APK from Releases and install it over the existing version. DayBloom updates must be signed with the same release key. Back up your tasks before uninstalling the app or changing devices.

### iPhone and iPad

A GitHub APK cannot be installed on iPhone or iPad. A native iOS release is not currently available for direct download from this repository.

To use DayBloom on iPhone or iPad now, open the hosted DayBloom website in **Safari**, tap **Share**, choose **Add to Home Screen**, turn on **Open as Web App** if shown, then tap **Add**. This requires DayBloom to be published at an HTTPS website address. [Apple's instructions](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/27/ios/27)

A native iOS version can be distributed later through TestFlight or the App Store. The iOS project is included below for developers who want to build it.

### Use DayBloom in a browser

DayBloom can also run as a website or be installed as a Progressive Web App (PWA). The website must be hosted over HTTPS for phone installation. Browser reminders appear only while the browser version is open. Native Android and iOS apps schedule reminders with the device operating system.

## Your data and reminders

- Tasks, notes, reminders, and subtasks are stored locally on the current device.
- DayBloom does not sync data between devices. Use **Download a backup** and **Restore a backup** in the profile screen to move your data.
- Browser data may be cleared by the browser or device. Keep backups somewhere private.
- Existing task lists saved locally by older DayBloom versions are carried forward. Tasks stored only in an old Supabase account are not imported.
- Native reminders are scheduled on the device and can arrive while the native app is closed, if notifications are allowed.
- Browser reminders need DayBloom to remain open. The browser version does not schedule reminders on a server.

## Run the web app from source

Requirements: Node.js 20.19+ or 22.12+ and npm.

~~~bash
npm install
npm run dev
~~~

Open the local URL printed by Vite.

To create and preview a production web build:

~~~bash
npm run build
npm run preview
~~~

To publish the web version, deploy the generated `dist` folder to a static host that supports HTTPS.

## Build the Android app from source

Requirements: Node.js 20.19+ or 22.12+, npm, Android Studio, and the Android SDK.

~~~bash
npm install
npm run mobile:sync
npm run mobile:android
~~~

Android Studio opens the Android project. Select a phone or emulator and run the app.

To create an APK for other people, use Android Studio's **Build > Generate Signed Bundle / APK** and choose **APK**. Select the **release** build type. Keep the signing keystore and passwords private, back them up securely, and never commit them to GitHub. You must use the same signing key for future APK updates. Upload the signed release APK as an asset on a GitHub Release. [Android app signing guide](https://developer.android.com/studio/publish/app-signing)

## Build the iOS app from source

Requirements: a Mac with Xcode, Node.js 20.19+ or 22.12+, and npm. iOS apps cannot be built with Xcode on Windows.

~~~bash
npm install
npm run mobile:sync
npm run mobile:ios
~~~

In Xcode, select a simulator or connected iPhone and run the app. Installing on a personal device requires signing with an Apple account. Distributing a native iOS app to other users requires preparing an App Store or TestFlight release through Apple.

## Commands

~~~bash
npm run dev          # Start the web development server
npm run typecheck    # Check TypeScript
npm run build        # Build the web app
npm run preview      # Preview the production web build
npm run mobile:sync  # Build web assets and sync Android/iOS projects
npm run mobile:android
npm run mobile:ios
~~~

## Privacy

DayBloom does not send task data to a DayBloom server. The app loads its fonts from Google Fonts when an internet connection is available. Anyone with access to your device or browser profile may be able to access its local DayBloom data.

## Contributing

Bug reports and pull requests are welcome. Please include steps to reproduce bugs and the device/browser details when reporting a problem.

## License

DayBloom is released under the MIT License. See [LICENSE](LICENSE).


