# git-architect

**Description**: Use this skill to transform plain-English Git errors or "missed queries" into structured JSON that exactly matches the schema in `data/scenarios.json`.

## When to use this skill
- When the user provides a "missed query" from the Git Oops AI helper.
- When the user asks to add a new scenario to `data/scenarios.json`.

## Schema Requirements
For every new scenario, generate a JSON object with the following strictly defined fields:
- `id`: A unique, kebab-case identifier (e.g., `"delete-all-files"`).
- `title`: A short, clear summary of the action or error (e.g., `"Delete all files of a branch"`).
- `category`: Must be one of `commits`, `branches`, `remote`, `merge`, `history`, `stash`.
- `tags`: An array of keywords. **Critically**, include exact phrasing from the user's plain-English query so the semantic search embedding model can match it easily.
- `description`: A clear, natural language explanation of the problem.
- `danger`: Must be one of `"safe"`, `"caution"`, or `"destructive"`.
- `steps`: An array containing objects with:
    - `commands`: An array of strings representing exact Git terminal commands.
    - `explanation`: A description of what the commands do.
    - `warning` (optional): Use if the command is destructive (e.g., force pushes or hard resets).
- `related` (optional): An array of strings referencing other `id`s in `data/scenarios.json`.

## Execution
1. Analyze the user's missing query.
2. Formulate the precise Git commands to resolve it.
3. Draft the JSON exactly according to the schema above.
4. Explain how the JSON integrates the exact keywords necessary for optimal semantic indexing.
