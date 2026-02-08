
# Wispr Flow - Hinglish Edition

A premium voice dictation app powered by Sarvam AI, designed for seamless Hinglish transcription.

## Features

- **Hinglish First**: Built with Hinglish as the default language.
- **Sarvam AI Integration**: Uses Sarvam's Speech-to-Text and Transliteration APIs for high accuracy.
- **Premium Design**: Modern, dark-mode focused UI with glassmorphism and smooth animations.
- **Real-time Feedback**: Visual feedback during recording and processing.

## Setup

1.  **Clone the repository** (if you haven't already).
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run the development server**:
    ```bash
    npm run dev
    ```
4.  **Open the app**: Navigate to [http://localhost:3000](http://localhost:3000).

## Configuration

To use the transcription features, you need a **Sarvam AI API Key**.
-   When you first open the app, you will be prompted to enter your API key.
-   The key is stored securely in your browser's local storage.
-   You can update it anytime by clicking the Settings icon.

## Tech Stack

-   **Frontend**: Next.js 15 (App Router), React, Tailwind CSS v4, Framer Motion.
-   **Icons**: Lucide React.
-   **Backend**: Next.js API Routes (Serverless functions).

## License

MIT
