# Speak Easy – AI Conversation Practice

Speak Easy is a full-stack AI-powered conversation practice tool. It helps users improve their communication skills by simulating real-life conversations (interviews, networking, dating, public speaking, etc.) with customizable AI personalities and difficulty levels. Users receive real-time feedback on confidence, filler words, sentence structure, and areas to improve.

---

## Features

- Scenarios – Job interview, networking, dating, conflict resolution, public speaking, etc.  
- AI Personalities – Tough interviewer, friendly colleague, skeptical questioner, empathetic listener, and more.  
- Difficulty Levels – Beginner, Intermediate, Advanced (affects AI strictness and prompts).  
- Real-Time Feedback – Confidence score, strengths, and areas to improve.  
- Retry / Next Options – Encourage reattempts if score < 90, otherwise move forward.  
- Theming – Dark theme with pink accents for a modern look.  
- Deployment Ready – Built with Create React App, serverless API proxy via Vercel.

---

## Project Structure

ai-conversation-practice/
│
├── api/
│ └── chat.js # Vercel serverless function (proxy to Groq API)
│
├── public/
│ └── index.html # CRA entrypoint
│
├── src/
│ ├── components/ # React components
│ │ ├── ScenarioSelector.js
│ │ ├── ConversationInterface.js
│ │ ├── FeedbackPanel.js
│ │ ├── ProgressTracker.js
│ │ └── ...
│ ├── styles/
│ │ └── components.css # Global + component styles
│ ├── utils/
│ │ └── aiEngine.js # Calls /api/chat
│ ├── App.js # Main app component
│ ├── index.js # React entrypoint
│ └── index.css
│
├── package.json
├── package-lock.json
├── vercel.json # SPA rewrites for Vercel
└── README.md


---

## Prerequisites

- Node.js v18 or later  
- npm (comes with Node)  
- Git  
- Vercel account (for deployment)  
- Groq API Key (starts with gsk_...)

---

## Setup and Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/<your-username>/ai-conversation-practice.git
   cd ai-conversation-practice
npm install
2. Install dependencies:

    npm install

3. Environment variables:

    Create a .env.local file at project root for local dev:

        REACT_APP_GROQ_API_KEY=your_groq_api_key_here


    In production, only GROQ_API_KEY will be used in serverless function.

4. Run locally:

    npm start

# Deployment on Vercel
Step 1: Push to GitHub
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main

Step 2: Import Repo into Vercel

Go to https://vercel.com/dashboard

Click New Project → Import GitHub repository

Choose ai-conversation-practice

Step 3: Configure Build Settings

Framework Preset: Create React App

Build Command: npm run build

Output Directory: build

Step 4: Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

GROQ_API_KEY=your_groq_api_key


Apply to Production and Preview environments.

Step 5: Add SPA Rewrite Rules

Create vercel.json in repo root:

{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}


Commit and push this file to GitHub.

Step 6: Deploy

Click Deploy in Vercel

When complete, you will get a live URL such as:
https://ai-conversation-practice.vercel.app

# Future Improvements

Add more scenarios (customer support, sales calls, debates).

Store user progress with a backend database.

Voice input/output integration with speech-to-text and text-to-speech.

Adaptive scoring system for personalized learning.
