# Contributing to Git Oops

Thank you for helping to make Git Oops a better resource for everyone! Since the core of the app is purely driven by a JSON file, contributing new scenarios or updating existing ones is incredibly easy.

## How to Add or Update a Scenario

1. Fork this repository.
2. Open `data/scenarios.json`.
3. Add a new JSON object to the array, or modify an existing one.
4. Ensure your JSON is valid.
5. Submit a Pull Request.

## Scenario Schema

Here is the exact schema you need to follow for a single scenario:

```json
{
  "id": "undo-last-commit",
  "title": "Undo Last Commit",
  "category": "commits",
  "tags": ["undo", "reset", "last commit", "mistake", "oops"],
  "description": "You made a commit you want to take back. Maybe the message was wrong, or you committed the wrong files.",
  "danger": "caution",
  "steps": [
    {
      "condition": "Keep your changes (just un-commit)",
      "commands": ["git reset --soft HEAD~1"],
      "explanation": "Moves HEAD back one commit. Your files are unchanged and staged, ready to re-commit."
    },
    {
      "condition": "Discard your changes entirely",
      "commands": ["git reset --hard HEAD~1"],
      "explanation": "Moves HEAD back and DELETES the changes.",
      "warning": "This permanently deletes your changes. There is no undo."
    }
  ],
  "related": ["amend-last-commit", "undo-multiple-commits"]
}
```

### Fields

*   `id`: Unique slug (e.g. 'undo-last-commit'). Used in the URL.
*   `title`: Short name of the fix.
*   `category`: Must be one of: `commits`, `branches`, `remote`, `history`, `stash`, `config`, `merge`, `rebase`.
*   `tags`: Array of search keywords.
*   `description`: Plain-English description of the problem (2–3 sentences).
*   `danger`: Must be one of: `safe`, `caution`, `destructive`.
*   `steps`: Array of step objects.
*   `related`: Array of scenario IDs that are related (optional).
*   `notes`: Optional extra tips.

### Step Object Fields

*   `condition`: Optional. When this step applies (e.g. 'If you already pushed'). If provided, creates tabs.
*   `commands`: Array of command strings to run in order.
*   `explanation`: Plain English explanation of what the command does.
*   `warning`: Optional text shown in a red warning box. Use for destructive commands.
