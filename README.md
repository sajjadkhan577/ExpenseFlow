# ExpenseFlow

Professional PWA Expense Tracker — Budget, charts, CSV/PDF export

ExpenseFlow is a lightweight, offline-capable Progressive Web App for tracking personal and business expenses. Built with Bootstrap, vanilla JavaScript, Chart.js and Flatpickr, it supports transaction history, category breakdowns, CSV/PDF export, a tax calculator (Pakistan FBR 2026), and simple profile/budget settings.

## Features

- Add / edit / delete income & expenses
- Category breakdown & charts (Chart.js)
- Export to CSV / PDF
- Offline / PWA support (manifest embedded)
- Tax calculator (Pakistan FBR 2026)

## Files

- `index.html` — main UI
- `script.js` — application logic
- `styles.css` — custom styles

## Quick start (local)

1. Serve the folder with a simple static server (recommended):

```bash
npx http-server
# or
python -m http.server 8000
```

2. Open `http://localhost:8080` (or `:8000`) in your browser.

3. To test the PWA install flow, open in Chrome and use "Add to Home screen".

## Deploy

- GitHub Pages: push the repository and enable Pages from `main` or `gh-pages`.
- Or connect to Netlify / Vercel for static hosting.

## Development

1. Initialize git and commit (example):

```bash
git init
git add .
git commit -m "feat: initial commit — add ExpenseFlow frontend (index.html, script.js, styles.css)"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ExpenseFlow.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username before pushing.

## License

This project is available under the MIT License. See `LICENSE`.

## Contact

Replace with your name / email if you want attribution in the repo.
