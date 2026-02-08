
# Indi-क (Wispr Flow)

**Indi-क** is the fastest and most seamless way to write in Hinglish. Powered by Sarvam AI, it provides state-of-the-art speech-to-text capabilities tailored specifically for Indian languages.

## Features

- **Hinglish First**: Optimized for code-mixing (Hinglish), handling both English and Hindi naturally.
- **Multi-Language Support**: Supports 10+ Indian languages including Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and Odia.
- **Auto-Detection**: Automatically detects the language you are speaking.
- **Privacy Focused**: Your API key and transcription history are stored locally on your device.
- **Minimalist Design**: A clean, distraction-free interface with dark mode support.
- **Local History**: Persistent history of your recent transcriptions with clear/copy functionality.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion for animations
- **Icons**: Lucide React
- **AI Services**: Sarvam AI (Speech-to-Text & Transliteration APIs)

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/manideep123ma/indi-ka.git
    cd indi-ka
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**:
    Create a `.env.local` file in the root directory and add your Sarvam AI API key:
    ```bash
    SARVAM_API_KEY=your_api_key_here
    ```
    Alternatively, you can enter the API key directly in the application settings.

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## License

This project is open-source and available under the [MIT License](LICENSE).

## Author

Created by [Manideep](https://github.com/manideep123ma).
