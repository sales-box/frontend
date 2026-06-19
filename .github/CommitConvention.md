# Frontend Commit Message Convention

We follow the **Conventional Commits** standard. Commit messages must be structured as follows:

```text
<type>(<scope>): <subject>
```

## Allowed Types

- `feat`: A new feature for the frontend (e.g. `feat(auth): add login modal`).
- `fix`: A bug fix (e.g. `fix(map): correct marker alignment`).
- `docs`: Documentation changes (e.g. `docs(api): document map component props`).
- `style`: Changes that do not affect code logic (formatting, missing semi-colons, CSS alignment).
- `refactor`: Restructuring code without changing behavior (e.g. `refactor(utils): convert fetch to axios`).
- `test`: Adding or correcting tests (e.g. `test(navbar): add test for mobile toggle`).
- `chore`: Updating configs, build tools, package dependencies (e.g. `chore(eslint): relax console rule`).
- `ci`: Changes to GitHub actions workflows.

## Guidelines
- Write the subject line in the **imperative mood** (e.g., "add button" instead of "added button" or "adds button").
- Limit the first line to **50 characters**.
- Do not end the subject line with a period.