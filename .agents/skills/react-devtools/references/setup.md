# Setup Guide

agent-react-devtools works with any React or React Native app. The `init` command auto-detects your framework and configures everything.

## Auto Setup (Recommended)

```bash
cd your-react-app
npx agent-react-devtools init
```

This detects the framework and applies the minimal configuration needed.

Use `--dry-run` to preview changes without modifying files:

```bash
npx agent-react-devtools init --dry-run
```

## Framework-Specific Details

### Vite

`init` adds the Vite plugin to your config:

```ts
// vite.config.ts
import {reactDevtools} from 'agent-react-devtools/vite'

export default defineConfig({
  plugins: [reactDevtools(), react()],
})
```

The plugin only runs in dev mode (`vite dev`). It injects the connect script before your app code loads. Zero app code changes needed.

### Next.js (App Router)

`init` creates a client component that imports the connect script and adds it to your root layout:

```tsx
// app/devtools.tsx
'use client'
import 'agent-react-devtools/connect'
export default function DevTools() {
  return null
}
```

Then imports it in `app/layout.tsx`.

### Create React App

`init` prepends the import to `src/index.tsx`:

```ts
import 'agent-react-devtools/connect'
```

### React Native / Expo

React Native apps auto-connect to the devtools WebSocket on port 8097 — no code changes needed.

```bash
agent-react-devtools start
npx react-native start
# or: npx expo start
```

For physical devices, reverse the port:

```bash
adb reverse tcp:8097 tcp:8097
```

## Manual Setup

If `init` doesn't cover your setup, add this as the first import in your entry point:

```ts
import 'agent-react-devtools/connect'
```

The connect script is:

- **SSR-safe** — no-ops on the server
- **Production-safe** — tree-shaken in production builds
- Connects via WebSocket with a 2-second timeout

## Verifying the Connection

```bash
agent-react-devtools status
```

Expected output when connected:

```
Daemon: running (port 8097)
Apps: 1 connected, 42 components
```

If `Apps: 0 connected`:

1. Check the app is running in dev mode
2. Check the console for WebSocket connection errors
3. Ensure no other DevTools instance is using port 8097
4. If using `agent-browser`, make sure you're using **headed mode** (`--headed`) — headless Chromium does not properly execute the devtools connect script

## Using with agent-browser

When automating the browser with `agent-browser`, you must use headed mode. Headless Chromium handles ES module script execution differently, which prevents the connect script from installing the devtools hook before React loads.

```bash
# Headed mode is required for devtools to connect
agent-browser --session devtools --headed open http://localhost:5173/

# Verify connection
agent-react-devtools status
```
