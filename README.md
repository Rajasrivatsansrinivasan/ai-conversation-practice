## Speak Easy – AI Conversation Practice

Speak Easy is a full-stack AI-powered conversation practice tool. It helps users improve their communication skills by simulating real-life conversations such as interviews, networking, dating, conflict resolution, and public speaking. Users can select scenarios, choose an AI personality, pick a difficulty level (beginner, intermediate, advanced), and receive real-time feedback on their communication style. Feedback includes confidence scoring, strengths, areas to improve, and retry or next options.

## 1) Features

Scenarios: job interview, networking, first date, family conflict, presentation Q&A, social anxiety practice, and more.

AI Personalities: tough interviewer, friendly colleague, professional, skeptical questioner, supportive mentor, intimidating authority, chatty talker, empathetic listener.

Difficulty Levels: beginner, intermediate, advanced, with different AI strictness.

Real-Time Feedback: confidence level, strengths, areas to improve, retry option if score < 90.

Modern Theming: black and pink theme with responsive design.

Secure API: Groq API key is kept private using a Vercel serverless proxy.

Deployment Ready: built with Create React App and configured for deployment on Vercel.

## 2) Prerequisites

Node.js v18 or later

npm (comes with Node)

Git installed locally

Vercel account (for deployment)

Groq API Key (starts with gsk_)

## 3) Project Structure

ai-conversation-practice/
api/
api/chat.js
public/
public/index.html
src/
src/components/
src/components/ScenarioSelector.js
src/components/ConversationInterface.js
src/components/FeedbackPanel.js
src/components/ProgressTracker.js
src/components/... (other component files)
src/styles/
src/styles/components.css
src/utils/
src/utils/aiEngine.js
src/App.js
src/index.js
src/index.css
vercel.json
package.json
package-lock.json
README.md

Important: api/chat.js must be at the repository root inside api. Do not put it under src/.

## 4) Setup and Installation

Clone the repository from GitHub
git clone https://github.com/
<your-username>/ai-conversation-practice.git
cd ai-conversation-practice

Install dependencies
npm install

Create a local environment file

In the project root, create a file named .env.local

Add the following line
REACT_APP_GROQ_API_KEY=your_groq_api_key_here

Start the development server
npm start
This will run the project locally at http://localhost:3000

## 5) API Proxy

The app does not expose your Groq API key directly to the browser. Instead, it uses a serverless function in Vercel.

api/chat.js

This file handles POST requests, sends them to the Groq API using your private key, and returns the response back to the frontend.

Important: This file must always be under the root-level api/ folder so Vercel can recognize it as a serverless function.

## 6) Frontend AI Engine

The frontend does not call Groq directly. Instead, it sends the conversation messages to /api/chat, which securely proxies the request.

src/utils/aiEngine.js is responsible for making this call.

## 7) Deployment on Vercel

Step 1: Push to GitHub

git add .

git commit -m "Initial commit"

git branch -M main

git push -u origin main

Step 2: Import into Vercel

Go to https://vercel.com/dashboard

Click New Project

Import your GitHub repository ai-conversation-practice

Step 3: Configure build settings

Framework preset: Create React App

Build command: npm run build

Output directory: build

Step 4: Add environment variables
In Vercel, go to your project → Settings → Environment Variables
Add:
GROQ_API_KEY=your_groq_api_key

Apply this variable to Production and Preview.

Step 5: Configure SPA routing
Create a file named vercel.json in the root of your project and add:
{
"rewrites": [
{ "source": "/api/(.)", "destination": "/api/$1" },
{ "source": "/(.)", "destination": "/index.html" }
]
}

This ensures React single-page app routes work correctly.

Step 6: Deploy

Click Deploy in Vercel

After build completes, you will get a live URL such as https://ai-conversation-practice.vercel.app

## 8) Troubleshooting

404 not found after deployment: check that vercel.json exists and Output Directory is set to build.

API errors (401 or 500): make sure GROQ_API_KEY is added in Vercel environment variables.

Blank page: confirm Root Directory in Vercel is set to the project root, not src.

Local works but production does not: redeploy after adding environment variables.

Git push errors: if your GitHub repo was created with a README, use git push -u origin main --force to overwrite.

## 9) Future Improvements

Add more conversation scenarios such as customer support, sales, and debates.

Store user progress in a backend database (Firebase, Postgres, or MongoDB).

Add speech-to-text and text-to-speech for voice practice.

Implement adaptive scoring that adjusts difficulty automatically.

## 10) License

MIT License © 2025 Rajasrivatsan Srinivasan
