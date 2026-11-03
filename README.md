# CodeForge Next

A creative coding studio for building small web projects, previewing them live, and shipping them to GitHub.

## Included

- Monaco editor with a lightweight textarea fallback
- Multi-file HTML, CSS, and JavaScript projects with browser-local autosave
- Isolated, responsive live preview with browser console capture
- Local runner endpoint for JavaScript, Python, Java, C, C++, PHP, SQLite, and JSON validation
- AI co-pilot actions for explain, debug, optimize, review, test writing, refactoring, generation, and brainstorming
- Browser tool plugins: palette mixer, gradient lab, shadow shaper, CSS motion lab with 3D tilt, SVG mark maker, and snippet shelf
- Starter projects for web, Python, Java, and C++ with runnable code
- A Learn page with the guided tutorials, full tutorial library, starter projects, and challenge spotlights
- Language- and difficulty-filtered coding challenges for web, PHP, React.js, DSA, UI/UX, cybersecurity, and AI/ML, with browser-local progress
- GitHub OAuth repository browsing, branch selection, file loading, and commit/push
- Project export, keyboard shortcuts, command palette, and responsive layout

## Start

Requires Node.js 20 or newer.

```sh
npm install
npm start
```

Open `http://localhost:5000`.

## Deploy to Google Cloud Run

The included `Dockerfile` supports a full-stack Cloud Run deployment. From this
folder, deploy with the Google Cloud CLI:

```sh
gcloud run deploy codeforge --source . --region YOUR_REGION --allow-unauthenticated
```

Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`, and
`GEMINI_API_KEY` (if used) as Cloud Run environment variables or Secret Manager
secrets. Set the GitHub OAuth callback URL to the deployed service's
`/auth/github/callback` URL. Do not put credentials in the repository.

Code execution is disabled whenever `NODE_ENV=production`. In development, the
server listens only on loopback and the runner rejects non-loopback clients.
The runner launches submitted programs without a security sandbox; do not
change these protections or expose the runner to the public internet. Project
previews run only inside an opaque-origin sandboxed iframe. Cloud Run's local
filesystem and this app's in-memory sessions are not durable, so this
deployment is suitable for a demo, not production accounts or persistent user
data.

## Optional integrations

Copy `.env.example` to `.env` in this folder.

- **Gemini AI co-pilot:** set `GEMINI_API_KEY`; optionally set `GEMINI_MODEL` (defaults to `gemini-2.5-flash`).
- **GitHub:** configure `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GITHUB_CALLBACK_URL`. The OAuth callback must match the URL registered with GitHub.

The server keeps GitHub tokens out of browser JavaScript. AI requests are sent through the local server, so the key is not exposed in the page.

## Code runner

The local runner launches source code on your computer without a security sandbox. It is restricted to loopback in development and disabled in production. Python, Java, C, C++, and PHP execution require the matching compiler or runtime installed on the host. SQL runs against a temporary in-memory SQLite database. JSON is validated without an external runtime. React.js challenges provide editor scaffolds; a React runtime is not included in the local runner.

## Data

Project files and completed challenge markers are saved in the browser's local storage. The server creates a local `data/` directory for account data and temporary runner files.
