<div align="center">

# 🪨 Pebbles

### AI Resume Optimizer

Upload your resume, pick a target role, and let AI rewrite it into an **ATS-optimized PDF** — tailored, keyword-rich, and recruiter-ready in seconds.

<br>

<img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19"/>
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
<img src="https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
<img src="https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
<img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"/>
<img src="https://img.shields.io/badge/Groq_AI-F55036?style=for-the-badge&logo=coloros&logoColor=white" alt="Groq"/>

</div>

<br>

## ✨ Features

| | Feature |
|---|---|
| 📄 | **PDF In → PDF Out** — upload your resume, get an optimized PDF back, auto-downloaded |
| 🎯 | **Targeted or Simple** — enter a job role for full ATS tailoring, or leave blank for general optimization |
| 🔐 | **GitHub Auth** — sign in via a custom in-app modal (Supabase) |
| 📱 | **Fully Responsive** — mobile-first, single-page tool on phones; full desktop experience on larger screens |
| ✨ | **Interactive Dot Background** — canvas-based, reacts to cursor & touch |
| 🎨 | **Template Selector** — pick from resume templates (desktop) |
| ⚡ | **Live Progress UI** — animated stage-by-stage status with simple/full-optimization badges |

<br>

## 🛠️ Tech Stack

- **React 19** + **TypeScript** + **Vite 8**
- **Tailwind CSS v4** for styling
- **Supabase Auth** (GitHub sign-in, full-page redirect flow — Vercel friendly)
- **React Router v7** for routing
- **shadcn/ui** components + **lucide-react** icons
- **Motion** for animations

<br>

## 🚀 Getting Started

### 1 · Prerequisites

- **Node.js** `≥ 20`
- The **[Pebbles backend](../pebblesBackend)** running locally (or deployed)

### 2 · Install

```bash
git clone <repo-url>
cd pebbles
npm install
```

### 3 · Configure environment

Copy the example file and fill in your Supabase client credentials:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (default `http://localhost:8000`) |
| `VITE_SUPABASE_URL` | Supabase project URL (`https://<ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key (Project Settings → API) |

> ⚠️ **Never commit `.env`** — it's gitignored. Only `.env.example` is shared.

> 🔑 **One-time Supabase setup for GitHub sign-in:** In Supabase → Authentication →
> Providers → GitHub, enable the provider. Then in **Authentication → URL
> Configuration**, add your app's URLs (e.g. `http://localhost:5173`,
> `https://your-app.vercel.app`) to **Redirect URLs** and set **Site URL** to the
> production Vercel URL. Without these, GitHub sign-in will redirect back to a
> URL that Supabase hasn't whitelisted.

### 4 · Run

```bash
npm run dev      # start dev server (http://localhost:5173)
npm run build    # production build
npm run preview  # preview the production build
npm run lint     # run ESLint
```

<br>

## 📂 Project Structure

```
pebbles/
├── public/                  # static assets (favicon, template images)
├── src/
│   ├── components/
│   │   ├── AuthModal.tsx    # custom GitHub sign-in modal
│   │   ├── Content.tsx      # landing hero (signed-out)
│   │   ├── Pebble.tsx       # main optimizer tool (signed-in)
│   │   ├── Navbar.tsx       # top nav with auth state
│   │   ├── Footer.tsx       # footer
│   │   ├── Learnmore.tsx    # "Why optimize" info page
│   │   └── DotBg.tsx        # interactive canvas background
│   ├── lib/supabase.ts     # Supabase init + GitHub auth helpers
│   ├── AuthContext.tsx      # auth provider/hook
│   ├── App.tsx              # routes + layout
│   └── main.tsx             # entry point
└── @/components/DotField.jsx # dot-field canvas engine
```

<br>

## 🧩 How It Works

```
User uploads PDF + (optional) job role
        │
        ▼
Frontend ──POST /optimise──▶ Backend (pebblesBackend)
                                  │
                          PDF → text (pdf-parse)
                                  │
                          Groq (llama-3.3-70b) optimizes
                                  │
                          React SSR → HTML → Puppeteer → PDF
                                  ▼
Frontend ◀──── optimized PDF (auto-download) ────
```

<br>

<div align="center">

Made with ❤️ by **Asrar**

</div>


Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
