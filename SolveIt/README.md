<<<<<<< HEAD
# SolveIt 🖋️🤖

**SolveIt** is a cutting-edge, full-stack "Ink-to-Intelligence" application. It transforms a high-performance digital canvas into a powerful mathematical engine, bridging hand-drawn gestures with generative AI to solve complex equations and follow natural language instructions in real-time.

---

## 🚀 Features

* **Multimodal Math OCR:** Leverages **Gemini 1.5 Flash** to analyze drawings and handwriting, converting "ink" into structured mathematical data.
* **Infinite Skia Canvas:** Powered by **@shopify/react-native-skia** for low-latency, fluid drawing experiences that feel natural on mobile devices.
* **Context-Aware Intelligence:** Beyond a simple calculator, SolveIt understands natural language instructions. Ask it to *"Write a table of 12"* or *"Explain Pythagoras Theorem"* for a complete breakdown.
* **Dynamic UI Gestures:** Fully interactive workspace using **Reanimated 3**. Pinch to zoom, rotate the board, and reposition AI-generated results anywhere on your canvas via intuitive gestures.
* **LaTeX Rendering:** Beautifully formatted mathematical steps and final answers for professional-grade clarity.

---

## 🛠️ Tech Stack

### **Frontend (Mobile)**
* **React Native / Expo** - Cross-platform core.
* **Shopify Skia** - High-performance 2D graphics engine.
* **Reanimated 3 & Gesture Handler** - Native-thread animations and complex gesture orchestration.
* **Zustand** - Lightweight, scalable state management.

### **Backend (Intelligence)**
* **Java / Spring Boot** - Robust REST API architecture.
* **Google Gemini AI** - Multimodal vision and reasoning engine.
* **Maven** - Dependency management and build automation.

---

## 🏗️ Architecture

The application follows a modern decoupled architecture to ensure smooth UI performance:

1.  **Capture:** The frontend takes a snapshot of the Skia Canvas using `makeImageSnapshot`.
2.  **Analyze:** The Spring Boot backend receives the image and prompts the Gemini API with specific constraints for JSON output.
3.  **Resolve:** The AI returns a structured JSON containing the parsed equation, logical steps, and the final result.
4.  **Render:** The frontend updates the shared values, rendering the LaTeX result at the relative touch position without triggering heavy React re-renders.

---

## 🏁 Getting Started

### **Prerequisites**
* Node.js & npm/yarn
* JDK 17 or higher
* Gemini API Key (Google AI Studio)

### **Installation**

1.  **Clone the Repo**
    ```bash
    git clone [https://github.com/Devang559/SolveIt.git](https://github.com/Devang559/SolveIt.git)
    ```

2.  **Backend Setup**
    * Navigate to `SolveIt_backend/`
    * Add your Gemini API Key to `src/main/resources/application.properties`.
    * Run the server:
    ```bash
    ./mvnw spring-boot:run
    ```

3.  **Frontend Setup**
    * Navigate to `SolveIt/`
    * Install dependencies:
    ```bash
    npm install
    ```
    * Start the project:
    ```bash
    npx react-native run android
    ```

---

## 🤝 Contributing
Contributions are welcome! If you have ideas for new features—such as Mermaid diagram support, graph plotting, or history tracking—feel free to fork the repo and submit a PR.

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

**Developed with ❤️ by Devang Sharma**
=======
This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
>>>>>>> 35c7ee2 (Initial commit)
