# 🗂 Nihongo Cards

A beautiful Japanese flashcard web app built with React + Vite. Learn hiragana, katakana, and N5 vocabulary using spaced repetition — right in your browser.

![Nihongo Cards](public/icon.png)

---

## ✨ Features

- **142 default cards** — 46 hiragana, 46 katakana, 50 N5 vocabulary
- **Spaced repetition (SR)** — 8-level system inspired by Anki (1min → 1 week)
- **Bilingual** — toggle between English and Portuguese at any time
- **Text-to-speech** — hear correct Japanese pronunciation on every card
- **Custom cards** — add, edit, and delete your own vocabulary
- **Progress tracking** — mastery ring, streaks, accuracy, and type breakdown
- **Fully offline** — all data saved locally via `localStorage`
- **Mobile-ready** — designed as a mobile-first PWA-style layout

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm or yarn

### Install & Run

```bash
# Clone or download the project
cd nihongo-cards

# Install dependencies
npm install

# Start dev server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy it anywhere — Vercel, Netlify, GitHub Pages, etc.

---

## 🗂 Project Structure

```
src/
├── data/
│   └── cards.js          # 142 default cards (hiragana, katakana, N5 vocab)
├── i18n/
│   ├── index.js          # i18next setup
│   ├── en.js             # English strings
│   └── pt.js             # Portuguese strings
├── utils/
│   └── sounds.js         # Web Audio engine + TTS
├── views/
│   ├── StudyView.jsx     # Study session with SR logic and 3D flip card
│   ├── StatsView.jsx     # Progress stats and mastery ring chart
│   └── EditorView.jsx    # Custom card editor
├── App.jsx               # Root component — state, navigation, loading screen
├── App.css               # All styles
└── main.jsx              # Vite entry point
```

---

## 🧠 Spaced Repetition System

Each card has a level from 0 to 7. Answering correctly moves it up; incorrectly drops it by 2.

| Level | Next Review |
|-------|-------------|
| 0 | Immediately |
| 1 | 1 minute |
| 2 | 10 minutes |
| 3 | 1 hour |
| 4 | 8 hours |
| 5 | 1 day |
| 6 | 3 days |
| **7** | **1 week — Mastered ✓** |

Sessions show up to 20 due cards, sorted by level (newest first).

---

## 🌐 Internationalization

Uses [react-i18next](https://react.i18next.com/). All UI strings are in `src/i18n/en.js` and `src/i18n/pt.js`.

To add a new language:

1. Create `src/i18n/xx.js` with the same keys as `en.js`
2. Register it in `src/i18n/index.js`
3. Add a toggle option in `App.jsx`

---

## 🃏 Card Format

Default cards use this shape:

```js
{
  id:         'v_001',
  type:       'vocab',        // 'hiragana' | 'katakana' | 'vocab' | 'custom'
  japanese:   '猫',
  reading:    'ねこ (neko)',
  portuguese: 'Gato',
  english:    'Cat',
}
```

Kana cards (hiragana/katakana) use `romaji` instead of `reading`/`portuguese`/`english`.

---

## 🛠 Built With

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [react-i18next](https://react.i18next.com/) — internationalization
- Web Audio API — sound effects (zero external files)
- Web Speech API — text-to-speech pronunciation
- localStorage — persistent progress, no backend required

---

## 📄 License

MIT — free for personal and educational use.

---

> Made with ♥ by [gifluana](https://github.com/gifluana)