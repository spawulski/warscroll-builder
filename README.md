# AoS Warscroll Architect

A web app for creating, managing, and printing **Warhammer Age of Sigmar (4th Edition)** Warscrolls.

## Tech stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **LocalStorage** (MVP persistence)
- **Tesseract.js** (OCR for image scanning)
- **react-to-print** (print sheet)
- **Lucide React** (icons)

## Features

- **Create Warscrolls** – Unit name, faction, characteristics (Move, Health, Save, Control, Ward), weapon profiles (ranged/melee), abilities (with phase timing and type), and keywords.
- **Upload & scan** – “Upload Warscroll Image” uses OCR to extract text, then a **review step** to confirm parsed data before editing.
- **Live preview** – Editor and card preview side by side.
- **Print sheet** – 4 Warscrolls per A4/Letter page (2×2 grid), compact layout for print.
- **My Warscrolls** – List, edit, delete; all stored in LocalStorage.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **New Warscroll** – Start from scratch.
- **Upload Image (OCR)** – Scan an image, review parsed text, then edit and save.
- **Print** – Opens a print view with 4 cards per page; use the Print button or browser print (Ctrl/Cmd+P).

## Project layout

```
src/
  app/           – layout, page, globals
  components/    – WarscrollCard, WarscrollForm, ScanAndReview, PrintSheet
  lib/           – ocr (parse OCR → Warscroll), storage (LocalStorage)
  types/         – warscroll schema (Warscroll, WeaponProfile, Ability, etc.)
```

## Data schema (AoS 4e)

- **Header:** Unit Name, Faction, Subfaction  
- **Characteristics:** Move, Health, Save, Control, Ward (red circle badge)  
- **Weapon profiles:** Name, Range, Attacks, Hit, Wound, Rend, Damage, optional abilities (e.g. Crit, Anti-Infantry)  
- **Abilities:** Name, Timing (Hero/Shooting/Combat/Charge/Movement/End of Turn/Deployment/Start of Turn), Type (Passive, Reaction, Once Per Turn), Text  
- **Keywords:** List of tags  

Ability timing uses the standard phase colours (e.g. yellow Hero Phase, red Combat Phase).

## License

MIT
