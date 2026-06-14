# Kado App — Agent Context

## Stack

Static HTML/JS, no build step, deployed to Vercel as-is (`vercel.json` has no `buildCommand`).

## History Orb Widget

`history/index.html` mounts a 3D audio-reactive orb (ElevenLabs `Orb` component, React + react-three-fiber + three.js) into `#orb-root`.

- Source: `history/orb-widget/` (Vite + React project, has its own `package.json`)
- Built bundle: `history/js/orb/orb-widget.js` (loaded via `<script type="module">`)
- `history/js/session.js` drives it via `window.KadoOrb.setAgentState(null | "listening" | "talking")`

**Important:** the bundle is committed to git and served directly — Vercel does NOT build it. After editing anything in `history/orb-widget/src/`, rebuild and commit the output:

```bash
npm run build:orb   # from kado-app/ — runs vite build, writes history/js/orb/orb-widget.js
```

If `history/js/orb/orb-widget.js` is stale vs `history/orb-widget/src/`, prod shows the old orb.
