# Agent — Market Insight Analysis

Agent is a Next.js application that uses Groq-backed prompts to turn a business description into a collection of market and product-planning analyses.

## Core features

- Guided chatbot or free-form business input, persisted in browser storage.
- Dedicated views for market trends, competitor tracking, ideal customer profiles, journey mapping, SWOT, gap analysis, feedback, feature prioritization, compliance, market assessment, and impact assessment.
- Server-side chat endpoint backed by the Groq OpenAI-compatible API.
- Charts and PDF export in analysis views.
- Responsive interface built from reusable React and Radix UI components.

## Technology stack

- Next.js 15 and React 18
- JavaScript, Tailwind CSS, and Radix UI primitives
- Groq SDK and Groq's OpenAI-compatible HTTP API
- Chart.js/react-chartjs-2, html2canvas, and jsPDF
- Socket.IO client and Vercel Analytics

## Prerequisites

- Node.js and npm
- A Groq API key for AI-backed analysis
- Optional: a compatible Socket.IO service if socket functionality is used

## Local setup

```bash
git clone https://github.com/varunisrani/agent.git
cd agent
npm ci
```

Create `.env.local` with the required configuration names listed below, then start development:

```bash
npm run dev
```

The development server uses Next.js's default address, `http://localhost:3000`.

Production build and start commands:

```bash
npm run build
npm run start
```

The repository also defines `npm run lint`.

## Configuration

| Name | Required | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | Yes | Authenticates the server-side chat route. |
| `GROQ_API_URL` | No | Overrides the Groq-compatible chat-completions endpoint. |
| `NEXT_PUBLIC_SOCKET_URL` | No | Overrides the Socket.IO URL; the source defaults to a local service. |

## Project structure

- `src/app/` — App Router pages and the `/api/chat` route.
- `src/components/` — navigation, chat, dashboard, and UI components.
- `src/config/` — analysis prompt definitions and socket configuration.
- `src/context/` and `src/hooks/` — shared business context and browser-storage state.
- `src/utils/` — Groq request helper.
- `public/` — static assets.

## Status and limitations

This is an application prototype. Analysis quality and availability depend on the configured model endpoint. The repository also contains a browser-side Groq helper with an embedded credential and `dangerouslyAllowBrowser`; do not deploy or use that credential. Remove the embedded credential, rotate it, and route all model calls through the server before production use. No automated test script is defined. The Socket.IO client defaults to a service that is not included in this repository, and the configured legacy model identifiers may need updating for the current Groq catalog.