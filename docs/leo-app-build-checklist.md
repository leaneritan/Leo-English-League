# LEEA App Build Checklist

Use this checklist for every new standalone Leo learning app in `learn/`.

## Paths

- Leo apps live in `learn/our-world/level-4/unit-7/`.
- Neritan teaching slides live in `teach/our-world/level-4/unit-7/`.
- App and slide files can share the same lesson name, but they are different files.
- Use hyphen filenames:
  - `vocab-1.html`
  - `vocab-2.html`
  - `grammar-1.html`
  - `grammar-2.html`
  - `book-reading.html`

## Required Scripts

Every Leo app should load the cloud save files near the top of the page:

```html
<script src="../../../../lib/leea-cloud-config.js"></script>
<script src="../../../../lib/leea-cloud.js"></script>
```

For apps in another folder depth, adjust the `../../../../` path.

## Save Keys

Each app needs one stable module id:

```js
const MODULE_ID = 'leo-4-7-reading';
```

Use this id for:

- homework completion
- review mode
- Supabase progress rows
- localStorage fallback

## Required Buttons

Each module/modal inside the app should have:

- `Mark [module name] Complete`
- `Redo [module name]`

The complete button should:

- mark only that module complete
- save progress locally
- sync progress to Supabase when available
- update the visible module card/status

The redo button should:

- clear only that module's saved answer/progress
- mark that module as not complete
- update the visible module card/status
- sync the new state when cloud saving is available

## Whole-App Completion

The app should mark the whole lesson done only when all required modules are complete.

When the lesson is done, save:

```js
lSave(MODULE_ID + '-done', true);
lSave(MODULE_ID + '-timestamp', new Date().toISOString());
```

If cloud saving is available, also call the shared cloud progress save.

## Review Mode

Every Leo app should support:

```text
?review=1
```

Review mode should show a simple teacher card, not just reopen the app normally.

The review card should include:

- lesson name
- completed modules count
- remaining modules count
- wrong answers or mistakes, grouped by module when tracked
- time spent, if tracked
- "Work not started" if no saved progress exists

Review mode should not let the student change answers.

## Homework Flow

Neritan assigns homework from `index.html`.

Leo opens the assigned app from the Leo home screen.

When Leo completes all required modules, the homework card moves into Leo's `DONE WORK`.

Neritan then sees it in `READY FOR REVIEW`.

Neritan can:

- review Leo's work
- mark the homework complete
- reset/unassign it

Completed homework moves to `COMPLETED WORK`, where Neritan can still review it or delete it from the archive.

## Claude Prompt For New Apps

When asking Claude to build a new app, include this:

```text
Build this as a standalone LEEA Leo learning app.
Use the existing LEEA style: sharp 4px radius, Oswald headings, Inter body, no gradients, no decorative shadows.
Add localStorage fallback saving and Supabase cloud sync using lib/leea-cloud-config.js and lib/leea-cloud.js.
Use MODULE_ID = 'leo-LEVEL-UNIT-LESSON'.
Every module/modal needs a "Mark [module name] Complete" button and a "Redo [module name]" button.
The lesson is done only when all required modules are complete.
Add ?review=1 mode that shows a teacher review card with completed modules, remaining modules, mistakes, time spent if tracked, and "Work not started" when empty.
Do not put teaching-slide code in this file. This file belongs in learn/.
```
