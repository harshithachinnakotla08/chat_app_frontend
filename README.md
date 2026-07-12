# NOTE
```
The backend is hosted on render which will stop after inactive if any of team members are running
please click on below link to start the backend server or else the user cant login please open this link if ur
not running backend locally
```
https://chat-app-backend-mr9a.onrender.com/api/health

# Chat App - React Native & Expo Frontend

A premium real-time chat application frontend built with **React Native**, **Expo SDK 54**, and **Socket.io-client**. This app communicates with a Node.js/Socket.io backend (either running locally or hosted on Render) to deliver instant messaging, real-time online status indicators, and custom overlays.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [Git](https://git-scm.com/)
* **Expo Go** app installed on your physical mobile device (available on Google Play Store and iOS App Store) OR a mobile emulator (Android Studio / Xcode).

### 2. Install Dependencies
In the root directory of the project, run:
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root of the project (this is ignored by Git to protect local configurations). Add your backend's API endpoint:

```env
# URL of your backend (hosted on Render or running locally)
EXPO_PUBLIC_API_URL=https://chat-app-backend-mr9a.onrender.com
EXPO_PUBLIC_API_URL=http://192.168.0.103:5000  # for locally running the backend
```


### 4. Start the Application
Start the Metro bundler with cache clearing:
```bash
npx expo start -c
```
* **To run on Android**: Press `a` or scan the terminal QR code using the **Expo Go** app.
* **To run on iOS**: Press `i` (or scan the QR code with the iOS Camera app).
* **To clear Metro cache manually** (always do this if you edit `.env`): Use the `-c` flag.

---

## 🏛️ Mobile Architecture & Directory Structure

The project follows a modular, feature-oriented structure inside the `src` folder:

```
chat-app/
├── .expo/                 # Expo system and cache files
├── assets/                # Images, icons, and fonts
├── src/
│   ├── components/        # Reusable presentation components
│   │   ├── MessageBubble.js
│   │   └── TypingIndicator.js
│   ├── config/            # App-wide constants (theme, fonts, sizes)
│   │   └── constants.js
│   ├── context/           # React Context for global state management
│   │   ├── AuthContext.js   # Handles user auth state (login/logout/token storage)
│   │   └── SocketContext.js # Handles persistent Socket.io connection & events
│   ├── navigation/        # Screen routing and navigation stack definitions
│   │   └── AppNavigator.js  # Separates AuthStack (login/signup) and MainStack (chats)
│   ├── screens/           # Main screen UI layouts and page logic
│   │   ├── ChatListScreen.js # Conversation list and premium user selection modal
│   │   ├── ChatScreen.js     # Direct messages view and typing indications
│   │   ├── LoginScreen.js
│   │   └── SignupScreen.js
│   ├── services/          # Network communication services
│   │   └── api.js         # Custom Axios client with request/response interceptors for Auth
│   └── utils/             # Reusable helper functions
│       └── helpers.js     # Timestamp formatting, string truncation helpers
├── .env                   # Local configuration (API URLs) - Ignored by Git
├── .gitignore             # Git ignored files & folders
├── App.js                 # App Entry Point (wraps app in Context Providers)
├── app.json               # Expo configuration file
└── package.json           # Node project dependencies and run scripts
```

---

## 🔑 Key Features Implemented

1. **Dynamic Authentication State**: Seamless login and signup forms powered by `AuthContext`. Keeps users logged in by persisting tokens using `@react-native-async-storage/async-storage`.
2. **Real-time Messaging**: Handled asynchronously via Socket.io. Includes message delivery receipts, unread message badges, and typing indicators.
3. **Status Indicators**: Instantly propagates user online/offline status changes across the UI.
4. **Premium Bottom Sheet Modal**: A scrollable user-lookup drawer that slides up from the bottom (with custom visual design and a close `✕` button) replacing basic browser/OS alert boxes.
5. **Configurable Environment**: Metro server-backed environment injection with fallback variables.
