# NPM Candidate Search 🔍

A Talent Intelligence Platform that helps you find world-class engineers by analyzing their open-source contributions on NPM and GitHub.

## 🚀 Features

-   **Smart Search**: Find developers based on the technologies they use (e.g., "react", "rust", "typescript").
-   **Deep Insights**: View detailed profiles including:
    -   NPM package statistics (quality, popularity, maintenance).
    -   GitHub activity (repos, followers, contribution graphs).
    -   Impact scores and "Top Talent" badges.
-   **Flexible Views**: Toggle between a visual **Grid View** (cards) and a data-rich **Table View** (dense list).
-   **Shortlisting**: Save promising candidates to your personal list.
-   **Manual Entry**: Add candidates manually by their GitHub username if they don't appear in NPM search results.
-   **Team Collaboration**:
    -   Share saved candidates with your team.
    -   Add notes and discussions to candidate profiles.
    -   Track outreach status (New, Contacted, Interviewing, Hired).

## 🛠️ Tech Stack

-   **Frontend**: React, TypeScript, Vite, TailwindCSS
-   **Backend**: Supabase (PostgreSQL, Auth, RLS)
-   **Deployment**: Netlify

## 📦 Setup Guide

### 1. Prerequisites
-   Node.js (v18+)
-   A [Supabase](https://supabase.com) project

### 2. Installation

```bash
git clone <your-repo-url>
cd npm_candidate_search
npm install
```

### 3. Database Setup

1.  Go to your Supabase Dashboard -> SQL Editor.
2.  Run the contents of `migrations/0_complete_schema.sql`.
    *   This file contains the complete schema, including tables, RLS policies, and triggers.

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 5. Run Locally

```bash
npm run dev
```

## 🚢 Deployment (Netlify)

1.  **Connect Repo**: Import this repository into Netlify.
2.  **Environment Variables**: In Site Settings > Build & Deploy > Environment, add:
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`
3.  **Build Settings**:
    *   Build command: `npm run build`
    *   Publish directory: `dist`
4.  **Redirects**: The `netlify.toml` file is already configured to handle SPA routing (`/* /index.html 200`).

## 📝 License

MIT
