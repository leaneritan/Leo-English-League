# Leo-English-League

A personal English learning reference app for Leo — built with plain HTML, CSS, and JavaScript. No framework, no build tools.

## How to add content

To add a new vocabulary set:
1. Create a new JSON file at `content/our-world/level-{N}/unit-{N}/vocab-{N}.json`
2. Follow the vocab JSON schema in the build spec
3. Update `content/index.json` to register the new set
4. Open a pull request — nothing goes live until merged

To add a new grammar point:
1. Create a new JSON file at `content/our-world/level-{N}/unit-{N}/grammar-{N}.json`
2. Follow the grammar JSON schema in the build spec
3. Update `content/index.json` to register the new grammar set
4. Open a pull request

## Local preview

Open any `.html` file with VS Code + Live Server.

## Deployment

Auto-deploys to Vercel on every merge to `main`.
