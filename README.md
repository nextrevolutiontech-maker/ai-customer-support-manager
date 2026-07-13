# NRT AI Customer Support Manager

NRT AI Customer Support Manager is an enterprise-grade, SaaS-ready autonomous customer support employee and CRM. It unifies email, WhatsApp, and live chat into a single dashboard, powered by Google Gemini 2.5 Flash for autonomous ticket classification, context-aware summaries, sentiment analysis, and smart suggested replies.

Built following Clean Architecture, Domain-Driven Design (DDD), and SOLID principles, this monorepo is fully type-safe and designed for low-latency support operations.

---

## Technical Stack

*   **Frontend**: Next.js 16 (App Router, Turbopack), React, Tailwind CSS (v4), GSAP (Micro-animations), Socket.io Client
*   **Backend**: NestJS (Modular Architecture, WebSockets), Prisma ORM
*   **Database**: SQLite (Development) / PostgreSQL-ready
*   **AI Engine**: Google Gemini 2.5 Flash REST API (RAG-context matching)
*   **Integrations**: Meta WhatsApp Cloud API, Twilio SMS/WhatsApp Gateway, Resend Email Delivery

---

## Core System Modules

### 1. Unified Multi-Channel Inbox
A centralized queue that captures incoming support requests from multiple channels:
*   **Live Chat Hub**: Real-time WebSocket connection for instant client-agent messaging.
*   **WhatsApp Gateway**: Direct Meta Cloud API & Twilio endpoint integration.
*   **SMTP/IMAP Mail Exchange**: Automated ticket generation from email queries.

### 2. SLA Management
*   **Priority Thresholds**: Low, Medium, High, and Urgent levels.
*   **Live Countdown**: Dynamic timers calculate and display response and resolution limits.
*   **Breach Audits**: Background workers track missed deadlines and flag accounts.

### 3. AI Automation (Google Gemini 2.5)
*   **Autonomous Classifier**: Categorizes queries (Billing, Technical, General) and sets priorities.
*   **Sentiment Recognition**: Flags angry or urgent tones for prioritization.
*   **Context Summaries**: Condenses chat history into single-line summaries.
*   **Suggested Replies**: Drafts replies for support agents based on chat context.

### 4. Self-Service Knowledge Base
*   **RAG FAQ Chatbot**: Reads internal documents to resolve client questions autonomously.
*   **Agent Docs**: Interface to create, read, and manage customer documentation.

### 5. Grievances & Audit logs
*   **Escalation logs**: Manages formal complaints when SLAs are breached.
*   **Full Audit Trails**: Logs all assignment and status changes.

---

## Directory Structure

```text
nrt-support-manager/
├── apps/
│   ├── server/           # NestJS Backend API
│   │   ├── prisma/       # Database Schema & Seed scripts
│   │   └── src/          # Modules (AI, SLA, Ticket, Livechat, Integrations)
│   └── web/              # Next.js Frontend App
│       ├── src/
│       │   ├── app/      # Page layout and stylesheets
│       │   ├── components/ # Borderless, flat UI components
│       │   └── lib/      # API wrappers and Socket handlers
└── package.json          # Monorepo Workspace configuration
```

---

## Local Development Setup

### 1. Prerequisites
Ensure you have Node.js (v18+) and npm installed.

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./apps/server/prisma/dev.db"

# Google Gemini AI Config
GEMINI_API_KEY="your-gemini-api-key"

# Resend Email Config
RESEND_API_KEY="your-resend-api-key"
EMAIL_FROM="onboarding@resend.dev"

# Meta WhatsApp Cloud API Config
META_ACCESS_TOKEN="your-meta-token"
META_PHONE_NUMBER_ID="your-phone-id"
```

### 3. Install Dependencies
Run the following command in the root folder:
```bash
npm install
```

### 4. Initialize Database
Generate the Prisma client and push the schema to SQLite:
```bash
npm run db:push --workspace=server
```

Seed the database with infrastructure configurations (SLA policies, support agents, KB articles):
```bash
npm run seed --workspace=server
```

### 5. Start the Application
Start the backend NestJS server:
```bash
npm run dev:server
```

Start the frontend Next.js application:
```bash
npm run dev:web
```

The frontend portal will be active on [http://127.0.0.1:3000](http://127.0.0.1:3000), and the backend server on [http://127.0.0.1:4000](http://127.0.0.1:4000).

---

## Production Deployment

### Meta WhatsApp Cloud API Setup
To receive and reply to real customer WhatsApp chats:
1. Register a developer account at [Meta for Developers](https://developers.facebook.com/).
2. Create a Business App and set up the **WhatsApp** product.
3. Generate a permanent System User access token in your Meta Business Settings and configure it as `META_ACCESS_TOKEN`.
4. Configure your Webhook URL on Meta pointing to `/integrations/whatsapp/webhook` to capture incoming messages in real-time.
