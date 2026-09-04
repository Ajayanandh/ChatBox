# 🤖 ChatBox - Production-Ready Personal AI Assistant

A complete, production-grade personal AI chatbot platform inspired by ChatGPT. Built with **Next.js 14 / React / TypeScript / Tailwind CSS** for the frontend and **FastAPI / SQLAlchemy / Pydantic v2** for the backend.

Features multi-provider AI support (**Google Gemini** & **OpenAI**), real Server-Sent Events (SSE) streaming, RAG document-based question answering (PDF, DOCX, TXT, MD), long-term personal memory, safe mathematical tools, and secure JWT authentication.

---

## 🌟 Key Features

- **⚡ Real-time SSE Token Streaming**: True Server-Sent Events with instant rendering, blinking cursor, and cancellation (`Stop generating`).
- **🧠 Multi-Provider AI Architecture**: Seamlessly switch between Google Gemini (Gemini 2.5 Flash, 1.5 Pro, 1.5 Flash) and OpenAI (GPT-4o, GPT-4o mini, GPT-3.5 Turbo).
- **📚 RAG / Document Chat**: Upload PDF, DOCX, TXT, and MD files. Automatic text extraction, recursive chunking, dense vector embeddings, cosine similarity ranking, and source citation tooltips.
- **💾 Long-Term Memory**: Automatic preference extraction (e.g., coding preferences, names) and manual memory management. Memories are safely injected into system prompts.
- **🧮 Tool Execution & Registry**: Safe AST-based mathematical calculator tool with an extensible registry ready for web search and Python execution.
- **🔐 Complete Authentication**: User registration, login, bcrypt password hashing, JWT access tokens, and protected user-isolated conversations.
- **💻 ChatGPT-Style Interface**: Responsive sidebar with conversation grouping (Today, Yesterday, Previous), search filtering, code syntax highlighting, copy buttons, regeneration, light/dark themes, and keyboard shortcuts (`Enter`, `Shift+Enter`, `Ctrl+K`).
- **🪟 Windows Desktop Ready**: Single-click launcher (`start_app.bat` or `python desktop/launcher.py`) that boots both backend & frontend and launches the browser automatically.

---

## 📐 Architecture

```
ChatBox/
├── frontend/                  # Next.js 14 App Router, React 18, TypeScript, Tailwind
│   ├── app/                   # Root layout, globals.css, and main chat page
│   ├── components/            # ChatArea, Sidebar, SettingsModal, CodeBlock, etc.
│   ├── hooks/                 # useChat, useAuth, useConversations, useDocuments, useMemory
│   ├── lib/                   # Typed API client with SSE stream reader, utils, auth
│   └── types/                 # Strict TypeScript interfaces
│
├── backend/                   # FastAPI Python backend
│   ├── app/
│   │   ├── api/v1/            # Auth, conversations, chat (SSE), documents, memory, health
│   │   ├── core/              # Config (Pydantic Settings), security (Bcrypt/JWT), exceptions
│   │   ├── database/          # SQLAlchemy session & Base metadata (SQLite/PostgreSQL)
│   │   ├── models/            # User, Conversation, Message, Memory, Document models
│   │   ├── schemas/           # Pydantic v2 request/response schemas
│   │   └── services/
│   │       ├── ai/            # Gemini & OpenAI provider implementations & prompt builder
│   │       ├── rag/           # Parser, chunker, embeddings, persistent vector store
│   │       ├── memory/        # Long-term memory store & preference extractor
│   │       └── tools/         # Safe AST Calculator & extensible tool registry
│   ├── tests/                 # Full Pytest test suite (18+ tests)
│   └── requirements.txt
│
├── desktop/
│   └── launcher.py            # Desktop orchestrator & browser launcher
├── start_app.bat              # Windows 1-click Batch launcher
├── start_app.ps1              # Windows PowerShell launcher
├── .env.example               # Environment variables template
└── README.md
```

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 18+** (Tested on Node.js 20 & 22)
- **npm** (or pnpm / yarn)

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root and in `backend/`:

```bash
cp .env.example .env
cp .env.example backend/.env
```

Edit `.env` with your API keys:
```env
# AI Providers (at least one recommended)
GEMINI_API_KEY=your-gemini-api-key-here
OPENAI_API_KEY=your-openai-api-key-here

# Database (SQLite default)
DATABASE_URL=sqlite:///./data/chatbox.db

# JWT Security
SECRET_KEY=generate-a-random-hex-string-for-jwt-signing
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

> **Obtaining API Keys:**
> - **Google Gemini Key:** Get one for free at [Google AI Studio](https://aistudio.google.com/).
> - **OpenAI Key:** Generate at [OpenAI API Keys](https://platform.openai.com/api-keys).

---

### 3. One-Click Startup (Recommended)

Simply double-click `start_app.bat` or run:

```bash
# Windows Batch
start_app.bat

# Or Windows PowerShell
.\start_app.ps1

# Or Python Cross-Platform Launcher
python desktop/launcher.py
```

This starts the backend on `http://127.0.0.1:8000`, starts the frontend on `http://127.0.0.1:3000`, and automatically opens your default browser.

---

### 4. Manual Startup (Separate Terminals)

#### Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- Swagger API Docs: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/api/health`

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://127.0.0.1:3000`

---

## 🧪 Running Automated Tests

A comprehensive test suite verifies authentication, conversations, streaming endpoints, RAG document parsing, vector cosine similarity search, memory safety, and tool execution.

```bash
pytest backend/tests -v
```

---

## 🔌 API Reference

### Authentication
- `POST /api/auth/register` — Register a new account (`email`, `password`)
- `POST /api/auth/login` — Sign in and receive JWT bearer token
- `GET  /api/auth/me` — Retrieve current authenticated user profile
- `POST /api/auth/logout` — Client token clearance

### Conversations & Messages
- `GET    /api/conversations?q=...` — List user conversations with search filter
- `POST   /api/conversations` — Create a conversation thread
- `GET    /api/conversations/{id}` — Fetch conversation with message history
- `PATCH  /api/conversations/{id}` — Rename title or update model
- `DELETE /api/conversations/{id}` — Delete conversation and messages
- `GET    /api/conversations/{id}/messages` — List messages in conversation
- `DELETE /api/messages/{id}` — Delete a specific message

### Chat & Streaming
- `POST /api/chat` — Synchronous completion
- `POST /api/chat/stream` — **Real Server-Sent Events (SSE) token stream**
- `POST /api/chat/regenerate` — Regenerate previous assistant response

### RAG & Documents
- `POST   /api/documents/upload` — Upload PDF/DOCX/TXT/MD, chunk, embed, and index
- `GET    /api/documents` — List user uploaded knowledge documents
- `DELETE /api/documents/{id}` — Delete document and its vector embeddings

### Long-Term Memory
- `GET    /api/memory` — List stored user preferences and facts
- `POST   /api/memory` — Store custom memory item (`key`, `value`)
- `DELETE /api/memory/{id}` — Delete specific memory
- `DELETE /api/memory` — Clear all memories

### System
- `GET /api/health` — Check database connection and configured AI providers

---

## 📦 Packaging for Windows Desktop (.exe)

You can package ChatBox into a standalone Windows desktop executable:

### Method 1: PyInstaller Launcher Bundle
1. Build the Next.js production export:
   ```bash
   cd frontend
   npm run build
   ```
2. Build executable using PyInstaller:
   ```bash
   pip install pyinstaller
   pyinstaller --noconfirm --onedir --windowed --name "ChatBox" desktop/launcher.py
   ```
3. The resulting `.exe` in `dist/ChatBox/` can be launched directly.

---

## 🔒 Security Best Practices

- **Zero Client-Side Keys**: AI provider keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`) and JWT secrets exist only in the FastAPI backend environment.
- **Password Hashing**: Passwords are encrypted with `bcrypt` before storage.
- **Sensitive Memory Filtering**: Memory store automatically screens and rejects credentials, credit card numbers, tokens, and PII.
- **File Validation**: Enforces extension whitelisting (PDF, DOCX, TXT, MD) and 20MB file size limits with sanitized UUID paths.

---

## 📄 License
MIT License. Free for personal and commercial use.