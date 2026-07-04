# LedgerQuest

Bridging real-world financial discipline with an immersive retro RPG adventure.

## Project Overview: Dual-World Architecture
LedgerQuest integrates your financial life directly into a fantasy realm. The application is split into two primary modes:
1. **Finance Office (Host):** Manage expenses, calibrate monthly budgets, and inscribed daily feats.
2. **Adventure World (RAE):** A native **React Adventure Engine** that visualizes your journey on an old-school TV console. Spend "Action Points" (AP) earned from financial discipline to explore, talk, and battle.

## Key Features
- **React Adventure Engine (RAE):** High-fidelity RPG layer with interactive SVG maps, zoomed town scenes, and turn-based combat.
- **Budget Calibration:** Set your monthly allowance in the Grand Archive and track your "Remaining Safe" balance.
- **Dynamic Reward Loop:** Earn +5 AP for logging expenses, with a **+3 AP Bonus** for staying within your monthly budget.
- **Quest System:** Progress through main and side stories with sub-missions. Claim your rewards manually once all objectives are met.
- **Party Management:** Recruit and organize your tactical formation in the War Room.

## Technical Stack
- **Frontend:** React (TypeScript) + Vite + Tailwind CSS.
- **Persistence:** Firebase Firestore (Real-time sync) / LocalStorage.
- **Logic Engines:** Specialized evaluation and difficulty adjustment scripts.
- **Infrastructure:** Dockerized Nginx optimized for Google Cloud Run.

## CI/CD Workflow
The project uses a fully automated deployment pipeline:
1. **Source Control:** All changes are pushed to the `main` branch of the [GitHub Repository](https://github.com/nerdykitten-cto/LedgerQuest-FinJourney.git).
2. **Build Automation:** Google Cloud Build detects the push and executes the `Dockerfile` build.
3. **Deployment:** The production-ready container is deployed to Google Cloud Run, serving assets via Nginx on a dynamic port assigned by the platform.

## How to Develop Locally
1. `cd APP`
2. `npm install`
3. `npm run dev`
4. Access the local server at `http://localhost:5173`.
