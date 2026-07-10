# Inbox Sales Copilot - Frontend Workspace

This repository contains the frontend applications for the Inbox Sales Copilot project. It is structured as a **Monorepo** using [NPM Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces) to efficiently manage dependencies and share code between different applications.

## 🏗️ Repository Structure

```text
frontend-repo/
├── package.json          # Root workspace configuration
├── apps/
│   ├── dashboard/        # Admin Dashboard (Vite + React + TS)
│   └── extension/        # Gmail Chrome Extension (Vite + React + TS + CRXJS)
└── packages/
    └── shared/           # Shared libraries and contracts
        └── src/
            └── api-client.ts # The single source of truth for API calls (Mocks & Real)
```

## 🛠️ Tech Stack

- **Framework:** React + TypeScript
- **Build Tool:** Vite (for fast HMR and optimized builds)
- **Styling:** Tailwind CSS v4
- **Routing:** React Router DOM (in Dashboard)
- **Icons:** Lucide React
- **Extension Bundler:** `@crxjs/vite-plugin` (allows building Manifest V3 extensions seamlessly with Vite)

## (Mock-First Philosophy)

The project currently operates on a **Mock-First** basis to unblock frontend development while the backend is being finalized. 

All API calls across **both** the Dashboard and the Extension **MUST** go through `packages/shared/src/api-client.ts`. This file currently returns mock data structured exactly according to the backend's `CONTRACTS.md`. When the real API is ready, we will only need to update the logic inside `api-client.ts`, and the rest of the components will continue to work without modification.

---

## 🚀 Getting Started

### 1. Install Dependencies
Run the following command at the **root** of the repository (`frontend-repo/`). Because we are using workspaces, npm will automatically link `packages/shared` to the apps that need it.

```bash
npm install
```

### 2. Admin Dashboard
To start the Admin Dashboard in development mode with Hot Module Replacement (HMR):

```bash
npm run dev -w apps/dashboard
```
*The dashboard will be available at `http://localhost:5173` (or similar).*

### 3. Gmail Extension 
Because Chrome Extensions cannot use standard HMR easily for content scripts, you should run the build command. The CRXJS plugin supports watching for changes.

```bash
# To build the extension
npm run build -w apps/extension
```

**To load the extension in Chrome:**
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top right corner).
3. Click **Load unpacked**.
4. Select the `apps/extension/dist` folder.
5. The extension will now be active when you open `https://mail.google.com/`.

---

## 🎨 Design Tokens & Tailwind CSS
We are using **Tailwind CSS v4**. 
- The CSS configuration and base theme are located in `src/index.css` inside each app.
- No `tailwind.config.js` is needed for basic usage in v4, everything is configured via CSS `@theme` variables.
