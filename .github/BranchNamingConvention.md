# Frontend Branch Naming Convention

We use a structured branch naming convention to classify branches by purpose.

## Naming Pattern
`<type>/<short-description-kebab-case>`

## Allowed Types

| Branch Type | Description | Example |
| :--- | :--- | :--- |
| `feature/` | New UI components, pages, state logic | `feature/atm-details-sidebar` |
| `bugfix/` | Fixing a UI bug, styling defect, logic issue | `bugfix/map-rendering-lag` |
| `hotfix/` | Urgent fixes pushed directly to production | `hotfix/broken-auth-callback` |
| `docs/` | Updates to README, storybooks, or comments | `docs/component-library-guide` |
| `refactor/` | Rearranging directory structure, cleanups | `refactor/modularize-hooks` |
| `chore/` | Updating packages, config files, npm dependencies | `chore/update-react-router` |

## Rules
1. **Lowercase Only**: Do not use uppercase letters.
2. **Kebab-Case**: Use hyphens (`-`) instead of spaces or underscores.
3. **Be Concise**: Keep the branch description short (3-5 words max).