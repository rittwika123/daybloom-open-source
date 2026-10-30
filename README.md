# DayBloom 🌷

An original, pastel-inspired productivity app. DayBloom keeps its data in the browser and does not need an account or database.

## Run locally

Requirements: Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Features

- Create, edit, complete, search, filter, and delete tasks
- Calendar, progress statistics, task notes, subtasks, and an activity timer
- In-app reminders while the browser version is open
- Native Android/iOS reminders scheduled with the device operating system
- Installable PWA support
- Download and restore a JSON backup from the profile screen
- Install DayBloom on a phone as a Progressive Web App (PWA)

Tasks, notes, reminders, and subtasks are stored locally on the current device. Existing task lists saved locally by older DayBloom versions are carried forward, but tasks stored only in a Supabase project are not imported. Data does not sync to other devices. Export a backup before clearing browser data or moving to another device. Browser reminders only show while the browser version is open; native app reminders are scheduled by the operating system.

## Use DayBloom on a phone

Publish the production `dist` folder to a static web host that serves the site over HTTPS. Open that HTTPS address on the phone. On Android, choose **Install DayBloom** from the profile screen or accept the browser's install prompt. On iPhone or iPad, open the site in Safari, tap **Share**, then **Add to Home Screen**. DayBloom then opens in its own app-like window. This installs the PWA; it does not publish DayBloom to an app store.

## Build the native mobile app

The Capacitor Android and iOS projects are included. Native builds use device-local notifications, so reminders can arrive after DayBloom is closed without a reminder server or server credentials. Task data remains on that device and does not sync to the PWA or another device; use the backup and restore options to move data.

On Windows or macOS, install Android Studio and its Android SDK, then run:

```bash
npm install
npm run mobile:sync
npm run mobile:android
```

In Android Studio, select a device or emulator and run the app. Android asks users to allow notifications; recent Android versions may also show an **Alarms & reminders** setting so reminder times can be exact.

To build the iOS app, use a Mac with Xcode installed, run `npm run mobile:sync`, then `npm run mobile:ios`. Capacitor's iOS project cannot be built with Xcode on Windows.

## Commands

```bash
npm run dev       # development server
npm run typecheck # TypeScript checks
npm run build     # production build
npm run preview   # preview production build
```

## Security and privacy

DayBloom does not send task data to a DayBloom server. Anyone with access to this browser profile can access its local data, and browser storage can be cleared by the browser or device owner. Keep exported backups somewhere private.

## Contributing

Issues and pull requests are welcome. See the license file for license terms.
