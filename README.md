# FinJourney (Personal Finance RPG)

Bridging real-world financial discipline with an immersive text-based RPG adventure. Built for the Google Challenge.

## Current State: Dual-World Architecture
The application is split into two primary modes:
1. **Finance Office:** Management of expenses, subscriptions, and daily commitments.
2. **Adventure World:** A narrative-driven RPG campaign driven by "Action Points" (AP) earned in the Finance Office.

## Core Technology
- **React (TS) + Vite:** Frontend.
- **Logic Engines:** Specialized `APEvaluator` and `ValueAdjuster` scripts manage the habit-reward loop.
- **Firebase Firestore:** Persistent data sync (with LocalStorage fallback).

## How to Play (Dev Mode)
1. `cd APP`
2. `npm install`
3. `npm run dev`
4. **Earn AP:** Complete tasks in the "Finance" tab.
5. **Adventure:** Switch to the "RPG" tab and use your AP to travel and talk to NPCs.
6. **Audit:** Review the "Logic Engine Traces" at the bottom of the screen to see how rewards were calculated.
