# codingCON - Frontend Branch

Welcome to the **`frontend`** branch of **[codingCON](https://github.com/Monishwaran45/codingCON)**!

This branch contains the user interface and interactive web application for the **codingCON Competitive Coding Platform**.

---

## 🌟 Key Features

- 🎯 **Problem Arena**: Interactive problem statement viewer with input/output specs and copyable test cases.
- 💻 **Code Editor & Runner**: Multi-language support (JavaScript, Python, C++, Java) with line numbers, code resetting, sample test execution, and full solution evaluator.
- 🏆 **Live Leaderboard**: Real-time participant standings, score breakdowns, penalty calculations, and handle search.
- 📜 **Submissions Log**: Comprehensive history tracking verdicts (Accepted, Wrong Answer, TLE), execution runtime, and time metrics.
- ⏱️ **Live Contest Countdown**: Real-time timer tracking remaining contest duration.
- 🎨 **Modern Dark Aesthetic**: Sleek glassmorphism panels, glowing neon accents (`#00F2FE`), and responsive CSS Grid / Flexbox layouts.

---

## 📂 File Architecture

```text
codingCON/
├── index.html       # Semantic HTML layout with Navigation, Arena, Leaderboard & Submissions tabs
├── styles.css       # Custom CSS design system, dark mode theme, glassmorphism & responsive rules
├── app.js           # Interactive state manager, code runner simulator, tab router & timer
├── package.json     # Node manifest and local dev scripts
└── README.md        # Branch documentation and guide
```

---

## 🚀 Local Development Setup

To view and run the frontend application locally:

### Option 1: Direct Browser Access
Simply open `index.html` in your web browser.

### Option 2: Node Local Server
Run a local web server using `npm`:

```bash
# Clone the repository and switch to frontend branch
git checkout frontend

# Start local dev server
npm start
```
Access the application at `http://localhost:3000`.

---

## 🛠️ Git Workflow & Commit Guidelines

When committing changes to the `frontend` branch, follow clean commit message standards:

```bash
git add .
git commit -m "feat(frontend): add interactive problem arena and code evaluator"
git push origin frontend
```
