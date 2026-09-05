# MOUAU FreshStart 🌿

A complete student navigation and companion system for **Michael Okpara University of Agriculture, Umudike (MOUAU)**.

## Features
- 🗺️ **Campus Map** – Interactive Leaflet map with all campus locations
- 📋 **Registration Guide** – Step-by-step admission checklist with progress tracking
- 📚 **Study Library** – Handouts, past questions, notes & textbooks
- 🤖 **AI Assistant** – OpenRouter-powered chatbot with model fallback
- 💬 **Community Forum** – Student Q&A and knowledge sharing
- 👤 **Student Profile** – Personalized academic profile

## Tech Stack
Next.js 14 · TypeScript · Tailwind CSS · Leaflet · Framer Motion · OpenRouter AI

## Deployment (Vercel)
1. Connect this GitHub repo to Vercel
2. Add `OPENROUTER_API_KEY` in Vercel Environment Variables (optional – fallback key included)
3. Deploy!

## Local Development
```bash
npm install
npm run dev
```

## Environment Variables
```
OPENROUTER_API_KEY=your_openrouter_key_here
```
