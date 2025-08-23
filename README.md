# Speak Easy – AI Conversation Practice

Speak Easy is a full‑stack, production‑deployable web app that lets you practice realistic conversations in a safe environment. You pick a scenario (job interview, networking, first date, difficult conversation, etc.), choose an AI personality (tough, friendly, skeptical, empathetic, and more), select your difficulty level (beginner, intermediate, advanced), and then chat. While you talk, you get real‑time feedback on confidence, filler words, structure, strengths, and areas to improve. The app uses a secure serverless proxy so your Groq API key never touches the browser.

This README is a complete, copy‑paste friendly guide that takes you from zero to deployed on Vercel. It includes setup, commands for Windows/macOS/Linux, deployment, environment variables, file structure, customization, and troubleshooting.

---

## Table of Contents

1. Overview and Architecture  
2. Prerequisites  
3. Project Structure  
4. Quick Start (Local Development)  
5. Environment Variables  
6. API Proxy (Serverless)  
7. Frontend AI Engine  
8. Build for Production (Local)  
9. Deploy to Vercel (Step‑by‑Step)  
10. Post‑Deploy Checks  
11. Troubleshooting and Common Errors  
12. Customization (Scenarios, Personalities, Difficulty, Theme, Title)  
13. Git and Windows CRLF Notes  
14. Security Notes  
15. FAQ  
16. License

---

## 1) Overview and Architecture

- Frontend: React (Create React App). All UI, conversation flow, feedback panels, selectors, and theming live under `src/`.
- Backend: Vercel Serverless Function under `api/chat.js`. It proxies requests to the Groq Chat Completions API so your API key remains private.
- Communication: Frontend calls `POST /api/chat` with `messages`. The serverless function reads `GROQ_API_KEY` from environment variables on Vercel, calls Groq, returns the response to the browser.
- Deployment: Vercel builds the React app, deploys static assets from `build/`, and serves serverless functions from `/api/*`.

---

## 2) Prerequisites

- Node.js v18+ and npm (https://nodejs.org/)
- Git (https://git-scm.com/)
- A GitHub account
- A Vercel account (https://vercel.com/)
- A Groq API key (starts with `gsk_...`) from https://console.groq.com/

---

## 3) Project Structure

ai-conversation-practice/
│
├── api/
│   └── chat.js
│
├── public/
│   └── index.html
│
├── src/
│   ├── components/
│   │   ├── ScenarioSelector.js
│   │   ├── ConversationInterface.js
│   │   ├── FeedbackPanel.js
│   │   ├── ProgressTracker.js
│   │   └── ...
│   │
│   ├── styles/
│   │   └── components.css
│   │
│   ├── utils/
│   │   └── aiEngine.js
│   │
│   ├── App.js
│   ├── index.js
│   └── index.css
│
├── vercel.json
├── package.json
├── package-lock.json
└── README.md




Important: `api/chat.js` must be at the repository root inside `/api`. Do not put it under `src/`.

---

## 4) Quick Start (Local Development)

Clone the repository and install dependencies.

Windows PowerShell / Command Prompt:
```bat
git clone https://github.com/<your-username>/ai-conversation-practice.git
cd ai-conversation-practice
npm install

macOS/Linux:

git clone https://github.com/<your-username>/ai-conversation-practice.git
cd ai-conversation-practice
npm install

Create a local environment file (optional for local if you directly call Groq via the serverless function; the serverless function can read the key from your shell if you run through a serverless emulator. For simplicity, local development usually mocks responses or you run without a key and test UI only. Production will use Vercel env vars.)

Start the dev server:

npm start

Open http://localhost:3000

6) API Proxy (Serverless)

File: api/chat.js (exactly this path)

// api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',    // You may switch to a different Groq model
        messages,                   // [{ role: 'system'|'user'|'assistant', content: '...' }, ...]
        temperature: 0.7
      })
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).send(text);
    }

    const data = await r.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}


Key points:

Do not import this file from the client. The browser calls it as an HTTP endpoint at /api/chat.

The function reads process.env.GROQ_API_KEY on Vercel. Do not hardcode secrets.

7) Frontend AI Engine

File: src/utils/aiEngine.js (example call shape; your project may already include a richer engine with real‑time feedback and fallbacks)

export async function getAIResponse(messages) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json(); // { choices: [{ message: { role: 'assistant', content: '...' } }] }
}


Typical usage from a component:

import { getAIResponse } from '../utils/aiEngine';

async function askAssistant(userText, history) {
  const messages = [
    { role: 'system', content: 'You are a helpful conversation coach...' },
    ...history,                         // array of { role, content }
    { role: 'user', content: userText }
  ];
  const data = await getAIResponse(messages);
  const reply = data?.choices?.[0]?.message?.content ?? 'Sorry, no reply.';
  return reply;
}

8) Build for Production (Local)

This step is optional but useful for verifying a production build locally.

npm run build


This creates a build/ folder. You can serve it locally with a static server:

npx serve -s build


Open the printed URL to test the static build.

9) Deploy to Vercel (Step‑by‑Step)

A) Push code to GitHub:

git add .
git commit -m "Initial commit: Speak Easy"
git branch -M main
git push -u origin main


B) Import the repository into Vercel:

Go to https://vercel.com/dashboard

Click “New Project”

Choose the ai-conversation-practice repository to import

C) Configure Build & Output:

Framework Preset: Create React App

Build Command: npm run build

Output Directory: build

Root Directory: / (repo root)

D) Add environment variable on Vercel:

Go to Project → Settings → Environment Variables

Add:

Name: GROQ_API_KEY

Value: your key starting with gsk_...

Environments: Production and Preview

Save

E) Add SPA rewrites (prevents 404 on refresh):
Create vercel.json at the repo root:

{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}


Commit and push:

git add vercel.json
git commit -m "Add SPA rewrites"
git push


F) Trigger deploy:

Vercel will automatically build and deploy on push

Or open project in Vercel → Deployments → Redeploy latest

10) Post‑Deploy Checks

Open the Vercel URL shown on the deployment page. You should see your app’s home screen (not a 404 page).

Open the browser DevTools → Network tab → start a conversation in the app → confirm there is a call to /api/chat.

If the call fails:

Open Vercel → Project → Deployments → select the deployment → Functions tab → check the serverless logs for the error (most common: missing GROQ_API_KEY).

11) Troubleshooting and Common Errors

404 NOT_FOUND page after deploy
Causes:

vercel.json is missing or not included in the latest build

Wrong “Root Directory” or wrong “Output Directory” in Vercel settings

Fix:

Ensure vercel.json is at repo root, committed, and deployed

Framework Preset: Create React App

Build Command: npm run build

Output Directory: build

Root Directory: /

API 401/403/500 errors
Causes:

GROQ_API_KEY not set or incorrect in Vercel env vars

api/chat.js not at repoRoot/api/chat.js

Request payload malformed

Fix:

Set GROQ_API_KEY in Vercel (Production + Preview)

Move api/chat.js to the correct location

Inspect Vercel “Functions” logs

Git push rejected (remote contains work you do not have)
Fix options:

Merge:

git pull origin main --allow-unrelated-histories
git push -u origin main


Replace remote contents (force):

git push -u origin main --force


Windows CRLF warnings
Harmless. To silence:

git config core.autocrlf true

12) Customization

A) Change the app title

public/index.html → <title>Speak Easy</title>

If you display a header title in App.js, update it there too.

B) Scenarios and personalities

Found in your src/data/scenarios.js or src/styles/scenarios.js depending on your file layout.

You can add new scenarios by extending the scenarios object:

export const scenarios = {
  jobInterview: { title: "Job Interview", description: "...", questions: [ ... ] },
  // Add your own
  salesCall: { title: "Sales Call", description: "...", questions: [ ... ] }
};


Add new personalities by extending personalities similarly.

C) Difficulty levels

The selector is in ScenarioSelector.js (or in your updated selector file). Each level can influence:

System prompt in aiEngine.js

UI microcopy, time pressure, evaluation thresholds

D) Show selected level in conversation header

In ConversationInterface.js header section, ensure you display a “Level: Beginner/Intermediate/Advanced” badge if you haven’t already.

E) Theme (black + pink)

Styles live in src/styles/components.css. If your version has CSS variables at the top, you can quickly retheme by updating variables:

:root {
  --bg: #0c0c0f;
  --panel: #121217;
  --text: #f5f5f7;
  --accent: #ff2d89;
  --accent-2: #ff6fb1;
  --muted: #a3a3ad;
}


Search for accent color usages and adjust as needed.

F) Retry vs Next logic

The FeedbackPanel can show “Retry” if score < 90; “Next” if score ≥ 90.

Implement the callback props from FeedbackPanel to ConversationInterface to handle reset or advance to next scenario.

13) Git and Windows CRLF Notes

Line ending warnings are normal when switching between Windows and Unix environments.

Recommended:

git config --global core.autocrlf true


Ensure .gitignore includes:

node_modules/
build/
.env
.env.*
.vercel/


If you see “remote origin already exists,” update the URL:

git remote set-url origin https://github.com/<your-username>/ai-conversation-practice.git

14) Security Notes

Never expose GROQ_API_KEY in the frontend. Only the serverless function should access it via environment variables.

Never commit .env* files.

If you suspect your key leaked, regenerate it in the Groq console.
