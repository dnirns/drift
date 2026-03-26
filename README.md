# Drift

> **Work in progress** -- this app is under active development and not yet ready for release.

Drift is a sleep aid that generates procedural white noise to help you fall and stay asleep. Instead of looping static audio files, it produces infinite noise in real-time and lets you shape the tone across a full spectrum (brown, pink, white, blue). Audio continues playing in the background when the app is minimized or the screen is locked.

## Tech Stack

- **React Native** (Expo, custom dev client)
- **react-native-audio-api** -- native Web Audio API implementation in C++
- **Zustand** -- global state management
- **React Native Reanimated** -- smooth slider animations
- **AsyncStorage** -- preset persistence
