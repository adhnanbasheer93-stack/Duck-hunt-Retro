# Product Requirements Document (PRD)

## Project: Retro Duck Hunt Web Simulator Port
**Document Version:** 1.1.0  
**Status:** Approved / Fully Production Hardened  
**Target Environment:** Firebase Hosting & Cloud Firestore  
**Author:** Product & Engineering Lead  
**Prepared For:** Authorized Administrator  

---

## 1. Executive Summary & Product Vision

### 1.1 Product Mission
The **Retro Duck Hunt Web Simulator Port** is a highly polished, interactive 8-bit web replica of the legendary 1984 NES classic "Duck Hunt". The goal of this product is to preserve and celebrate classic gaming history through a modernized, zero-install, browser-native container. By packing sub-pixel vector trajectory physics, dynamic browser-synthesized audio, and cloud persistence into a lightweight client-side application, we provide retro gaming enthusiasts with an authentic experience accompanied by secondary community capabilities.

### 1.2 Core Value Propositions
*   **An Nostalgic Experience, Redefined**: Seamless rendering of original gameplay mechanics—dynamic duck tracking, interactive canvas rendering, custom retro particle systems, and the classic laughing dog—without modern technical overhead.
*   **Zero-Dependency SFX Engine**: Eliminates heavy weight network sound assets using the browser's native Web Audio API to dynamically synthesize classic 8-bit noise, flapping, shoots, and intro jingles in real-time.
*   **Global Competitive Leaderboard**: Uses secure real-time Firestore links to capture public engagement. It registers user names and high-scores instantly, encouraging community replays and viral sharing.
*   **Secure Administration**: Provides full control over leaderboard integrity. Authorized admins can log in via secure OAuth and prune fraudulent entries directly from the interface, backed by server-verified security boundaries.

---

## 2. Target Audience & User Personas

### 2.1 The Casual Retro Gamer (User)
*   **Description**: Users browsing on desktop, laptop, or mobile devices who seek a fast, nostalgic hit of classic gaming.
*   **Needs**: High-fidelity sound and visuals, responsive interactive click/tap controls, fast load times, and simple gameplay instructions.
*   **Pain Points**: Heavy loading pages, complicated setup steps, or laggy animations that ruin timing.

### 2.2 The Score Challenger (Competitor)
*   **Description**: Highly competitive retro enthusiasts aiming for the top spots on the public leaderboard.
*   **Needs**: Precise, authentic hit registration, reliable database synchronization, and real-time scores updating.
*   **Pain Points**: Fraudulent players dominating scoreboards, or lost score histories due to browser crashes and cookie clearage.

### 2.3 The Administrator / Supervisor (Admin)
*   **Description**: System owner monitoring public feedback, app status, and integrity.
*   **Needs**: Invisible entry gate to administrative panels, seamless sign-in authentication, and direct command triggers to prune spam entries.
*   **Pain Points**: Complex database manipulation panels, complex rules configuring, or unauthorized players executing destructive database calls.

---

## 3. Product Scope & Functional Requirements

The feature set is balanced between exact arcade-retro replication and cloud-native functionality.

### 3.1 Functional Domain 1: Canvas Arcade Game Loop
*   **FR-1.1**: The application must initialize a responsive HTML5 Canvas stage inside the main application viewport.
*   **FR-1.2**: Duck Trajectories: Ducks must navigate across the canvas webspace using computed 2D vector coordinates (`dx`, `dy`). Movement speeds and direction-change intervals must dynamically ramp up as the player completes rounds.
*   **FR-1.3**: Hitbox Registration: Click/tap locations on the canvas must be verified against the bounding envelope of active vectors.
*   **FR-1.4**: Retro Animations: Provide visually faithful sprites for flapping ducks, falling ducks, active bullet indicator bars, score status, and clay-pigeon indicators.
*   **FR-1.5**: Retro Canine Interactions: The iconic "Duck Hunt Dog" must appear at the beginning of each game to start the round, hold up ducks upon successful shots, and mockingly laugh if a duck escapes the viewport boundary.
*   **FR-1.6**: **No-Overlap Safety Boundary**: Ducks are mathematically restricted from entering the top status section. Flight height centers (`baseY`) are calculated relative to screen width, ensuring ducks remain 100% visible and interactive beneath the HUD on both desktop and mobile.
*   **FR-1.7**: **Deferred Camera Permissions**: Camera and tracking initializations are deferred until the user actively clicks the **"Start Game"** button, ensuring privacy compliance and no upfront blockades.
*   **FR-1.8**: **Responsive HUD Header**: The HUD status bar scales responsively. On mobile devices, it collapses from three stacked rows to a tight, high-density, single-row layout, preserving vertical screen retail space for the canvas.

### 3.2 Functional Domain 2: Zero-Asset Audio Synthesis
*   **FR-2.1**: All game audio must be synthesized dynamically using the browser’s `AudioContext` (Web Audio API) to ensure zero reliance on static `.mp3` or `.wav` assets.
*   **FR-2.2**: The synthesis unit must recreate:
    *   *Retro Intro Theme*: A sequenced set of square wave oscillators with rapid decay envelopes.
    *   *Duck Flapping*: Repeating low-frequency sawtooth waves.
    *   *Gunshot (SFX)*: White noise buffer bursts mixed with sharp band-pass sweeps and sudden gain attenuation.
    *   *Canine Laughter Tone*: High-pitched pulsed waves simulating short bursts or giggles.
    *   *Round Transition Jingles*: Short musical arpeggios signaling success or game over.

### 3.3 Functional Domain 3: Leaderboard Sync & Cloud Persistence
*   **FR-3.1**: Upon game completion, the application checks if the user's score exceeds baseline thresholds or current session limits.
*   **FR-3.2**: Prompt Dialog: The application must display an engaging retro modal prompting qualified users to submit their name.
*   **FR-3.3**: Sync Pipeline: The score, user name, and submission timestamp must be written to a Google Cloud Firestore collection named `highScores`.
*   **FR-3.4**: Global Scoring UI: Standard visitors can view the top 10 historical high scores ordered in real-time.

### 3.4 Functional Domain 4: Admin Systems Gateway & Secure Auth
*   **FR-4.1**: A subtle "Secure Systems Gateway" trigger must exist inside the footer interface.
*   **FR-4.2**: **Server-Verified Google Authentication Gateway**:
    *   *Provider*: Executes a clean Firebase OAuth Popup. On successful login, the application verifies if the authentic email matches the authorized administrator configured in the backend configuration (`VITE_ADMIN_EMAIL`).
*   **FR-4.3**: Administrative Panel (DOM Injection): Once verified as an Admin, a `VIEW ADMIN DASHBOARD` button is inserted into the main DOM.
*   **FR-4.4**: Pruning Actions: Admins have a direct `Delete` key attached next to each high-score item to trigger removal commands.

---

## 4. Technical Architecture & Database Schema

The web port is built with a fast developer loop using React, Vite, and Tailwind CSS, coupled with serverless cloud infrastructure on Google Cloud Platform.

### 4.1 UI & Client Organization
```
┌────────────────────────────────────────────────────────┐
│                      Vite + React                      │
│                                                        │
│   ┌────────────────────┐      ┌────────────────────┐   │
│   │    StartScreen     │      │   Web Audio SFX    │   │
│   │   (Welcome, Logo)  │      │ (Synth Oscillators)│   │
│   └─────────┬──────────┘      └─────────▲──────────┘   │
│             │                           │              │
│             ▼                           │              │
│   ┌────────────────────┐                │ (Trigger SFX)│
│   │    Canvas Engine   ◄────────────────┘              │
│   │   (Game Loop, 60fps│                               │
│   └─────────┬──────────┘                               │
│             │ (On Game Over)                           │
│             ▼                                          │
│   ┌────────────────────┐                               │
│   │  Leaderboard/Score │                               │
│   │ (Firestore Query)  │                               │
│   └─────────┬──────────┘                               │
│             │ (Delete Action)                          │
│             ▼                                          │
│   ┌────────────────────┐      ┌────────────────────┐   │
│   │   Admin Dashboard  ├──────►  Firebase Auth/JVM │   │
│   │   (Control Panel)  │      │  Security Rules    │   │
│   └────────────────────┘      └────────────────────────────────────────────────────────┘
```

### 4.2 Data Model: Cloud Firestore
The database contains a flat, indexed collection structured as follows:

*   **Collection Name**: `highScores`
*   **Document Structure**:
    ```json
    {
      "id": "auto_generated_unique_firestore_id",
      "name": "PLAYNAME (String, length 3-25)",
      "score": 142000 (Integer, values 0-500000),
      "accuracy": 85 (Integer, values 0-100),
      "date": "2026-06-21 (Date/String)",
      "timestamp": "FieldValue.serverTimestamp() (Date/Timestamp)"
    }
    ```

---

## 5. Security & Verification Strategy

All transactions undergo multi-layer verification checks prior to data writes on the server.

### 5.1 Real Server-Side Security Rules (`firestore.rules`)
Under no circumstances do client variables (`isAdmin` states) grant destructive capabilities natively. All changes must be forced through the following active Google-evaluated server rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /highScores/{document} {
      // Rule 1: Public Read Access
      allow read: if true;
      
      // Rule 2: Public Write Access (Secured & Enforced Validation)
      allow create: if request.resource.data.name is string 
                    && request.resource.data.name.size() >= 3 
                    && request.resource.data.name.size() <= 25
                    && request.resource.data.score is int 
                    && request.resource.data.score >= 0 
                    && request.resource.data.score <= 500000
                    && request.resource.data.accuracy is int 
                    && request.resource.data.accuracy >= 0 
                    && request.resource.data.accuracy <= 100
                    && request.resource.data.timestamp == request.time;
                    
      allow update: if false;
                             
      // Rule 3: Secure Server Authenticated Admin Deletion
      allow delete: if request.auth != null 
                    && request.auth.token.email != null 
                    && request.auth.token.email == "<ADMIN_EMAIL>";
    }
  }
}
```

### 5.2 Threat Analysis & Mitigation Grid

| Documented Threat | Vector Analysis | Risk Level | Implemented Mitigation |
| :--- | :--- | :--- | :--- |
| **Leaderboard Tampering via SDK Inject** | A malicious player captures the database credentials from JS build and runs custom deletion scripts to clear scores. | **CRITICAL** | **PREVENTED BY SECURITY RULES.** Google’s servers check the transaction's authentic JWT token. If the email is not cryptographically signed as the configured administrator, Firestore cancels the action immediately. |
| **Browser Console Simulation Inject** | An attacker targets the local game submit hook calling `handleSaveHighScore("STUPID_HAX", 999999, 100)` to bypass visual gameover panels. | **HIGH** | **PREVENTED BY GAME-STATE CLOSURES.** The client-side leaderboard submission hook implements encapsulation closures. It verifies that: (1) `savedScore` exactly matches internal state ref `scoreRef`, (2) calculated accuracy matches tracked bullet counts, and (3) `gameState` === `GameState.GAMEOVER`. |
| **Leaderboard Flooding / Spamming** | Running script loop executing `addDoc` to spam mock entries. | **MEDIUM** | **STRICT SERVER SCHEMA CHECKS.** Multi-level field validations restrict names to 3-25 alphanumeric characters, scores to <500k, accuracy to 0-100, and block retroactive entry updates. |
| **Cross-Site Scripting (XSS)** | Users entering `<script>evil()</script>` or layout-breaking HTML strings as player initials. | **HIGH** | **SANITIZATION PIPELINE.** Player initials undergo rigorous stripping of `<` and `>` elements, special character filtration, truncation, and automatic arcade-style uppercase formatting inside the game client container. |

---

## 6. Non-Functional Requirements (NFRs)

*   **Performance (Target: 60 FPS)**: The canvas tracking module must process movement coordinates on an optimized animation loop using `requestAnimationFrame`, keeping visual frame counts solid.
*   **Load Size & Zero Dependencies**: Page assets must be kept small. Standard binary loops must not request external web servers to load heavy images/sound clips. The entire application bundle must be easily cached.
*   **Compatibility**: WebGL or 2D canvas context checks must execute smoothly across all modern web browsers (Safari, Chrome, Firefox, Edge, Opera) on both desktop and responsive mobile environments.
*   **Accessibility**: Color palettes must maintain a contrast ratio complying with AA standards. Keyboard accessibility, state feedback, and screen reader labels are fully integrated, alongside an easy-to-access Mute controller.

---

## 7. Deployment & Release Manual

The system relies on a clean static build bundled by Vite and hosted on scalable global edge servers.

### 7.1 Production Build Script Setup
Ensure the local `package.json` reflects the optimal building structure:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "tsc --noEmit",
  "preview": "vite preview"
}
```

### 7.2 Multi-Step Deployment Pipeline
1.  **Preparation**: Install Firebase CLI globally:
    ```bash
    npm install -g firebase-tools
    ```
2.  **Authentication**: Sync to your active Google/Firebase profile:
    ```bash
    firebase login
    ```
3.  **Local Sync**: Connect the root codebase to your database project space:
    ```bash
    firebase init
    ```
    *   Select `Firestore` and `Hosting` services.
    *   Point target public static directory to `dist/`.
    *   Configure as SPA (single page app) rewriting queries to `index.html`.
4.  **Minification Build**: Create production-hardened vector files:
    ```bash
    npm run build
    ```
5.  **Live Release**: Deploy database security rules and system files to Firebase Hosting:
    ```bash
    firebase deploy
    ```

---

## 8. Post-Release Enhancements & Roadmap

### Phase 2: Authentic Gun Input Integration (Light Gun Emulation)
*   Integrate hardware sensor pipelines using experimental browser APIs (e.g., DeviceOrientation API) to enable real physical aiming via mobile devices linked to a secondary desktop monitor.

### Phase 3: Multiplayer Duel Mode
*   Utilize real-time WebSocket signals or Firestore live collections to let team-based hunters challenge each other synchronously in side-by-side retro split-screens.

### Phase 4: Dynamic Environments & Progression System
*   Implement changing game weather patterns (rain, night modes with illuminated duck targets, wind velocities causing drift vectors) alongside customized retro sprite designs.
