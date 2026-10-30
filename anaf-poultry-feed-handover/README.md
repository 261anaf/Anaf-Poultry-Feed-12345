# Anaf Poultry Feed & Farm

A browser-based business dashboard for managing poultry-feed inventory and day-to-day operations. It can use an Express server and SQLite, or run directly in a browser using browser-local storage.

## Features

- Account registration and sign-in
- Product inventory, purchases, sales, stock transfers, and damaged stock
- Supplier, customer, employee, branch, and transaction records
- Income, expenses, cash, banking, loans, assets, and investment tracking
- Business overview, financial summaries, and CSV exports
- Separate business data for each account

## Requirements

- Node.js 20 or later
- npm (included with Node.js)
- Windows, macOS, or Linux
- An internet connection for first-time server dependency installation; CDN-hosted fonts and icons are optional enhancements

## Open directly in a browser

Double-click `index.html` from the extracted folder, or open it directly from the ZIP. The page includes its own CSS and JavaScript, so it does not depend on neighboring files being available. When opened as a `file://` page, it automatically uses browser-local storage for accounts, sessions, records, and settings. When opened over HTTP, it uses the local API if available and falls back to browser-local storage if the server cannot be reached.

Browser-local accounts and data are saved only in that browser profile and do not sync with the SQLite database or other devices. Clearing browser data can remove them. Use the server setup below for SQLite-backed data and shared access from that installation.

## Start on Windows

Double-click `start-project.bat` in the project folder. On its first run, it installs the npm dependencies if they are missing, then starts the application. Keep the command window open while using the app. Press **Ctrl+C** in that window to stop the server.

Open [http://localhost:3000](http://localhost:3000) in a browser. The app can also be opened from VS Code Live Server; it uses the local API on port 3000 when available. Select **Create an account** to set up an account, then sign in. Use a password with at least 10 characters.

## Start from a terminal

From the project directory, run:

```powershell
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000). The server prints its local URL when it is ready.

## Configuration

The application works with its defaults and does not require configuration. Optional settings can be supplied through environment variables or a `.env` file:

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | Local HTTP port |
| `DATABASE_PATH` | `data/anaf.sqlite` | SQLite database file path |
| `NODE_ENV` | — | Set to `production` behind HTTPS to enable secure session cookies |

Copy `.env.example` to `.env` to customize values. Do not share or package a `.env` file containing private settings.

## Data and backups

SQLite is initialized automatically at `data/anaf.sqlite` if the database file or its parent directory is missing. New accounts start with empty business records and default settings. Back up the database file regularly if it contains business information; it contains account credentials (as password hashes) and application data.

The dashboard and API are served by the same server. Account sessions use HTTP-only, same-site cookies; passwords are stored as scrypt hashes. Account registration is open, so for an internet-facing deployment use an HTTPS reverse proxy and an appropriate account approval policy.
