# LEEA Supabase Setup

This adds cloud sync for homework assignments first. The site still works with
localStorage if Supabase is not configured.

## 1. Create the Supabase project

Create one Supabase project, then open the SQL editor and run:

```sql
-- paste supabase/schema.sql here
```

## 2. Add browser config

Open `lib/leea-cloud-config.js` and replace the placeholders:

```js
window.LEEA_SUPABASE_CONFIG = {
  url: 'https://YOUR-PROJECT.supabase.co',
  anonKey: 'YOUR-SUPABASE-ANON-KEY',
  familyId: 'neritan-leo'
};
```

Use the public anon key, not the service role key.

## 3. What syncs now

- Assigned homework
- Completed homework
- Reset/unassigned homework

The helper is ready for per-app progress sync through the `leea_progress`
table, but each learning app still needs to be connected one by one so review
data moves from localStorage to Supabase.

## 4. Security note

This first version is for a private family tool. It allows the anon browser key
to read/write rows for `family_id = 'neritan-leo'`. Before using this for more
students, add real authentication and user-based Row Level Security.
