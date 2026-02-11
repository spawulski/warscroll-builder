# Cards.TabletopToolbox

A web app for creating, managing, and printing **Warhammer Age of Sigmar (4th Edition)** unit cards and battle traits. Live at [cards.tabletoptoolbox.shop](https://cards.tabletoptoolbox.shop).

## Tech stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **LocalStorage** (MVP persistence)
- **react-to-print** (print sheet)
- **Lucide React** (icons)

## Features

- **Create unit cards** – Unit name, faction, characteristics (Move, Health, Save, Control, Ward), weapon profiles (ranged/melee), abilities (with phase timing and type), and keywords.
- **Import from BSData** – Import units and battle traits from the age-of-sigmar-4th catalogue.
- **Live preview** – Editor and card preview side by side.
- **Print sheet** – 4 cards per A4/Letter page (2×2 grid), compact layout for print.
- **Regiments of Renown** – Import individual regiments with their units and battle traits.
- **Army collections** – Save sets of cards and battle traits for quick access.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **New Card** – Start from scratch.
- **Import** – Import from BSData faction catalogues or Regiments of Renown.
- **Print** – Opens a print view with 4 cards per page; use the Print button or browser print (Ctrl/Cmd+P).

## Project layout

```
src/
  app/           – layout, page, globals
  components/    – WarscrollCard, WarscrollForm, PrintSheet, CheatSheet
  lib/           – battlescribe (parse .cat XML), storage (LocalStorage)
  types/         – warscroll schema (Warscroll, WeaponProfile, Ability, etc.)
```

## Data schema (AoS 4e)

- **Header:** Unit Name, Faction, Subfaction
- **Characteristics:** Move, Health, Save, Control, Ward (red circle badge)
- **Weapon profiles:** Name, Range, Attacks, Hit, Wound, Rend, Damage, optional abilities (e.g. Crit, Anti-Infantry)
- **Abilities:** Name, Timing (Hero/Shooting/Combat/Charge/Movement/End of Turn/Deployment/Start of Turn), Type (Passive, Reaction, Once Per Turn), Text
- **Keywords:** List of tags

Ability timing uses the standard phase colours (e.g. yellow Hero Phase, red Combat Phase).

## Footer links

GitHub and Ko-fi links are configured in `src/lib/site-config.ts`. Override via `.env.local` if needed.

## License

MIT
