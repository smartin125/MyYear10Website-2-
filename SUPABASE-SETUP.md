# Supabase setup

1. Open the Supabase SQL Editor for this project and run `supabase-schema.sql`.
2. In Authentication settings, disable **Confirm email**. The site maps usernames to private internal auth emails, so there is no email field to verify.
3. Submit an approval request on the image page, then approve it from the administrator account.
4. Promote the first administrator in SQL after that account exists:

```sql
update public.image_game_profiles
set role = 'admin', approved = true
where username = 'YOUR_USERNAME';
```

Passwords are managed by Supabase Auth and are never stored in this repository or in leaderboard tables.