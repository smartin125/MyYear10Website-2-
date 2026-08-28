# Supabase setup

1. Open the Supabase SQL Editor for this project and run `supabase-schema.sql`.
   If login reports `infinite recursion detected in policy for relation "image_game_profiles"`, run `supabase-fix-recursion.sql` instead to repair the installed policies.
   Then run `supabase-image-selection.sql` to synchronize the current image across devices.
   Run `supabase-approval-migration.sql` to enable the administrator Allow and Decline buttons.
   If image loading reports `column reference "day" is ambiguous`, run `supabase-fix-image-selection.sql`.
2. In Authentication settings, disable **Confirm email**. The site maps usernames to private internal auth emails, so there is no email field to verify.
3. Submit an approval request on the image page, then approve it from the administrator account.
4. Promote the first administrator in SQL after that account exists:

```sql
update public.image_game_profiles
set role = 'admin', approved = true
where username = 'YOUR_USERNAME';
```

Passwords are managed by Supabase Auth and are never stored in this repository or in leaderboard tables.