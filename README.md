# Weight Stack

**Type the weight you want to lift. Weight Stack shows you exactly which plates to put on the bar.**

Weight Stack is a fast, mobile-first barbell plate calculator. It works offline, installs on your phone like an app.

**Live app:** https://weight-stack.mikc.dev/

---

## Features

- **Exact plate loadouts:** enter a target weight and get the plates for each side, using the fewest plates possible.
- **Closest weight suggestions:** if the target can't be loaded exactly, it shows the nearest lighter and heavier options.
- **kg and lb:** supports standard kg and lb plate sets, plus small change plates (1.25 kg, 0.5 kg, 2.5 lb).
- **Bar and collar settings:** 20 kg, 15 kg, 45 lb, EZ bar, or a custom bar weight, with optional collar weight.
- **Visual bar:** color-coded plates (IWF colors) so you can see the loadout at a glance.
- **Offline and installable:** a PWA that keeps working when gym Wi-Fi doesn't.

## Example

```
Target:   112.5 kg
Bar:      20 kg

Per side: 25 + 20 + 1.25
```

## Tech stack

| Area | Tool |
|------|------|
| Build | [Vite](https://vite.dev) |
| UI | [React](https://react.dev) + TypeScript |
| Styling | [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| State | [Zustand](https://zustand.docs.pmnd.rs) (with `persist`) |
| Offline / install | [vite-plugin-pwa](https://vite-pwa-org.netlify.app) |
| Tests | [Vitest](https://vitest.dev) |
| Hosting | [Cloudflare Pages](https://pages.cloudflare.com) |

## Getting started

**Requirements:** Node.js 22 or later.

```bash
git clone https://github.com/mikc2/weight-stack.git
cd weight-stack
npm install
npm run dev
```

Then open the URL shown in the terminal (usually http://localhost:5173).

### Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the unit tests |


## Deployment

To deploy manually without GitHub:

```bash
npm run build
npx wrangler pages deploy dist
```
