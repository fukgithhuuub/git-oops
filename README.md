# Git Oops

Fix your Git mistakes by describing them in plain English.

Git Oops is a single, trusted, visual reference that always gives the right command for the right situation when something goes wrong with Git.

## Philosophy

Keep it dead simple. No frameworks, no build tools, no npm. Pure HTML + CSS + Vanilla JS. A developer should be able to open `index.html` in a browser and have it work. This makes it trivially easy to host on GitHub Pages and contribute to.

## Project Structure

- `index.html`: Main search and browse page.
- `scenario.html`: Detail page for a specific fix.
- `about.html`: Information about the project.
- `data/scenarios.json`: The "database" of Git fixes.
- `css/main.css`: Core styles.
- `js/app.js`: Homepage logic (search, filtering).
- `js/scenario.js`: Scenario page logic.
- `js/data.js`: Data loading and parsing.

## Running Locally

Because it uses `fetch()` to load the JSON data, you cannot just open the HTML files directly from your file system (due to CORS restrictions for `file://` protocols). You need a basic HTTP server.

If you have Python installed:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`.

## Contributing

See `CONTRIBUTING.md` for information on how to add or update Git scenarios.
