Perfect — your thinking is sharp and forward-looking. You’re not just building a sync tool but a production-ready stage timer with real-time control, modular design, and solid state management. Here’s a refined, production-grade spec in Markdown format with your points fully integrated.

⸻

# 🎯 StageTimer App — Monorepo Migration & Redesign Specification

We are rebuilding a React + Firestore timer app into a **monorepo project** with:

- ✅ A custom **Node.js + socket.io backend**
- ✅ **PostgreSQL (via Drizzle ORM)** for configuration persistence
- ✅ A **modular React frontend** hosted on **Vercel**
- ✅ Real-time sync via socket.io
- ✅ Proper separation of UI state and DB sync logic

---

## 🧱 Project Overview

### 🎯 Goals

- Replace Firebase with a Render-hosted backend and Postgres DB
- Retain and refactor the current Vite + React frontend
- Use `socket.io` for all real-time updates
- Maintain a clear separation between:
  - DB state
  - UI display state
  - Real-time ephemeral state

---

## 🗂 Monorepo Structure

stagetimer/
├── apps/
│ ├── frontend/ # React + Vite client
│ └── backend/ # Express + socket.io + Drizzle
│     └── drizzle.config.ts
├── packages/
│ └── db/ # Shared schema (Drizzle ORM)
├── turbo.json (optional)
└── README.md

---

## 🧠 App Design Principles

### 🧩 Granular Components (Frontend)

- TimerPreview
- TimerList
- MessagePanel
- RoomSettings
- TimerConfigurator
- CountdownRenderer
- RoomSelector

Each component should:

- Be decoupled
- Manage only its own logic
- Subscribe/react to relevant socket.io events
- Allow the `TimerPreview` to operate independently of the `TimerList`

> E.g. if the controller panel adjusts the duration of the timer (10:00 → 11:00), the countdown view showing 04:55 should become 05:55 — both influenced, but **not directly coupled**.

---

## 📊 State Management

We should consider:

| Tool               | Usage Purpose                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------- |
| **Zustand**        | Local UI state (e.g. left panel, active tab, countdown sync)                             |
| **TanStack Query** | Cached async state for timers, messages, rooms from backend (REST or socket.io fallback) |
| **Socket.io**      | Real-time syncing across all devices                                                     |

This combo gives:

- Instant user feedback (Zustand)
- Persistent fetch + caching (TanStack)
- Live push updates (socket.io)

> This is **not overkill** — it’s what allows us to avoid prop-drilling, tightly coupled lists, or flickering countdowns.

---

## 🧩 Database Schema (Drizzle ORM — PostgreSQL)

### `rooms` Table

```ts
{
  id: serial
  slug: string (unique)
  name: string
  createdAt: timestamp
}

timers Table

{
  id: serial
  roomId: FK → rooms.id
  name: string
  notes: string
  extra: string
  appearance: enum('TOD', 'COUNTDOWN', 'COUNTUP', 'HIDDEN')
  type: enum('DURATION', 'FIXED_TIME')
  trigger: enum('MANUAL', 'SCHEDULED')
  durationMs: integer
  yellowWarningMs: integer
  redWarningMs: integer
  index: integer
  showName: boolean
  showNotes: boolean
  showExtra: boolean
  startTime: timestamp (optional)
  startDate: boolean
  finishTime: timestamp (optional)
  finishDate: boolean
  createdAt: timestamp
  updatedAt: timestamp
}

timer_sessions Table (Live tracking)

{
  id: serial
  timerId: FK → timers.id
  kickoff: bigint
  deadline: bigint
  lastStop: bigint
  status: enum('running', 'paused', 'stopped')
}

messages Table

{
  id: serial
  timerId: FK → timers.id
  text: string
  color: string
  bold: boolean
  uppercase: boolean
  index: integer
  createdAt: timestamp
  updatedAt: timestamp
}


⸻

🧠 Display-Controller Relationship Logic

The controller’s left panel manages all timers and affects:

	•	Timer definition (e.g. changing timer duration from 10:00 to 11:00)
	•	Real-time display (e.g. add +1min on the fly)

The display’s TimerPreview renders:

	•	A running countdown
	•	Based on a local kickoff + duration, not a live feed of ticks
	•	Time is adjusted only via socket.io event (e.g. add-time, sync-time)

This means:
	•	The TimerList (controller) manages the “source of truth”
	•	The TimerPreview (display) derives current time from shared kickoff, duration, now

⸻

🔐 Backend (Express + socket.io)
	•	WebSocket rooms: one per roomId
	•	Events:
	•	join-room
	•	start-timer, pause-timer, reset-timer
	•	update-timer, add-time, rename-timer
	•	show-message, hide-message
	•	REST fallback:
	•	GET /room/:id
	•	POST /room/:id/timer
	•	GET /ping

⸻

✅ Deployment Plan

Part	Host	Notes
Frontend	Vercel	React + Vite SPA
Backend	Render	Node.js socket.io + REST
Database	Render PG	Free-tier PostgreSQL instance


⸻

🔧 AI Implementation Notes
	•	Keep components granular and isolated
	•	Use Zustand for non-persistent, reactive state (e.g. timer ticking, left panel open)
	•	Use TanStack Query for loading and caching timers/messages
	•	Backend should broadcast timer updates with timestamps, not state diffs
	•	Think in “source of time” → “rendered time” — don’t push tick counts

```
