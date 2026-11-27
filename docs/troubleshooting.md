# Troubleshooting

Use this page to find the cause of a common failure in MTG Deck Analyzer and fix it.

## Goal

Find the symptom you see below, confirm the cause, and apply the fix. The first half is for people using the app. The second half is for developers running or deploying it. It assumes you already know how to build a deck. For a developer, it also assumes you have a working local checkout (see [Development setup](contributing/development-setup.md)).

## For users

### Fix a failed sign-in

**Symptom:** a red alert appears above the form after you select **Sign In**.

**Cause:** the alert shows the message Supabase Auth returned. It usually means the email or password is wrong, or the account isn't confirmed yet.

**Fix:**

1. Check the email address and password, then select **Sign In** again.
2. If you just created the account, open the confirmation email first. After **Create Account**, the app shows "Check your email to confirm your account."
3. If you still can't sign in, reset your password (next section).

### Reset a forgotten password

1. On the sign-in screen, select **Forgot password?**.
2. Enter your email address and select **Send Reset Link**.
3. Wait for "Password reset link sent — check your email.", then open the link in that email.

The app has no screen for choosing a new password. Nothing in `src/` calls `supabase.auth.updateUser`, so the reset link signs you in, but you can't set a new password from inside the app.

> TODO(product owner): confirm what a user should do after following the reset link (for example, whether the product owner sets the new password in the Supabase dashboard).

### Fix "Invalid deck file — missing required fields."

**Cause:** the file is valid JSON, but it isn't a deck exported by this app. **Import Deck** needs an `id`, a `name`, a `createdAt` and an `updatedAt` (all strings) and an `entries` array.

**Fix:** import a `.json` file you exported from this app, not a text list or a file from another deck site. If you edited the file by hand, put back any of those five fields you removed. The full format is in [Deck file formats](reference/deck-file-formats.md).

### Fix "Invalid deck file — Commander decks can only contain one copy of: …"

**Cause:** the file has more than one copy of the named cards. That includes a single entry with a quantity above 1, or a card that is also the commander or partner. Basic lands, and cards whose rules text says "a deck can have any number of cards named …", are exempt.

**Fix:** open the file and remove the extra copies of each card named in the message, then import it again. The singleton rules are in [Deck rules](reference/deck-rules.md).

### Fix "Could not parse file. Make sure it is a valid deck JSON."

**Cause:** the file isn't valid JSON. Common causes are a wrong file type, a truncated download, or a hand edit that broke the syntax.

**Fix:** export the deck again and import the new file. If you edited it by hand, run it through a JSON validator to find the syntax error. See [Import and export a deck](how-to/import-and-export-a-deck.md).

"Failed to read file." means the browser couldn't read the file at all. Select the file again. "Failed to save deck" (or "Failed to save imported deck." after you choose **Overwrite existing deck** or **Keep both**) means the file was valid but the write to the database failed. Check your connection and import it again.

### Recover from a failed save

**Symptom:** one of these appears:

- In the deck builder header: "Couldn't save your last change." with a **Retry** link.
- At the bottom of a deck's page: "Couldn't save your deck changes." with a **Retry** button.

**Cause:** a deck save to the database failed, most often because of a dropped connection or an expired session. Your changes are kept on the page. They are not rolled back.

**Fix:**

1. Check your connection.
2. Select **Retry**. This saves the latest version of the whole deck again. Any later edit also saves the whole deck again.
3. Don't reload or leave the page until the error clears. Changes that never saved exist only on this page.

If Retry keeps failing, sign out and sign back in, then make the change again.

### Fix "Name your deck to autosave cards"

**Cause:** a new deck isn't saved until it has a name. Cards you add before naming it aren't saved yet, and **Save Deck** stays disabled.

**Fix:** type a deck name. The cards you've already added are saved with your next change or when you select **Save Deck**.

### Fix a card that won't add to the deck

**Symptom:** a warning appears instead of the card being added:

- "*Card* is outside your commander's color identity and cannot be added." The card's color identity includes a color your commander (and partner) doesn't have. Pick a different card, or change the commander. Before you choose a commander, the deck has no colors, so only colorless cards can be added.
- "*Card* is already in your deck." Commander allows one copy of each card, and the card is already in the deck as an entry, the commander or the partner. Basic lands and "any number of cards named …" cards don't get this warning.

The rules behind both checks are in [Deck rules](reference/deck-rules.md).

### Fix empty or slow suggestions

On a deck's **Suggestions** tab:

| What you see | Cause | Fix |
| --- | --- | --- |
| "Finding suggestions..." for several seconds | Scryfall allows only 2 search requests a second, so the app spaces its requests 550 ms apart. A deck with many signals queues many requests. | Wait. Results are cached for the rest of the session, so opening the tab again is faster. |
| "No EDHREC data for this commander yet; suggestions are based on your deck's cards and objectives." | EDHREC has no page for this commander (it returned 403 or 404). | Nothing to fix. Suggestions still come from Scryfall. |
| "Couldn't reach EDHREC; suggestions are based on your deck's cards and objectives." | The request to EDHREC failed. | Select **Retry** in that line. |
| "Some suggestions couldn't load (…)." | The Scryfall search failed, but EDHREC data loaded, so the suggestions shown come from EDHREC only. | The suggestions shown are still valid. Reopen the tab later for the full set. |
| A red error with **Try again** | The Scryfall search failed and there is no EDHREC data to fall back on. Heavy use can trigger Scryfall's rate limit, which blocks requests for about 30 seconds. | Wait 30 seconds, then select **Try again**. |
| "No suggestions found for this deck." | No card matched what the deck signals. This usually happens with a near-empty deck and no strategy set. | Add more cards or set the deck's strategy, then reopen the tab. |

How the engine builds suggestions is explained in [How suggestions work](explanation/how-suggestions-work.md).

## For developers

### Fix "Missing Supabase environment variables"

**Symptom:** the app renders a blank page. The browser console shows `Error: Missing Supabase environment variables`.

**Cause:** `src/lib/supabase.ts` throws on load when `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is empty.

**Fix:**

1. Make sure `.env.local` at the repo root defines both variables. Don't paste their values into issues or logs.
2. Restart `npm run dev`. Vite reads env files only at startup.
3. For a deployed build, set both variables in the Vercel project's environment settings and redeploy. Vite writes them into the bundle at build time.

See [Configuration and commands](reference/configuration-and-commands.md) for the full list of variables.

### Fix a commit rejected by ESLint warnings

**Cause:** the husky `pre-commit` hook runs `npx lint-staged`. For staged files under `src/**/*.{ts,tsx}`, that runs `npx eslint --max-warnings=0`, so a single warning blocks the commit.

**Fix:**

1. Run `npm run lint` to see every warning and error.
2. Fix each one in the staged files, then `git add` them again.
3. Commit again. Don't skip the hook with `--no-verify`.

### Fix a commit rejected by `tsc`

**Cause:** when any `.ts`/`.tsx` file is staged, lint-staged runs `npx tsc -p tsconfig.app.json --noEmit` on the **whole app project**, not only the staged files. A type error in a file you didn't touch, or in an unstaged change, still blocks the commit.

**Fix:**

1. Run `npx tsc -p tsconfig.app.json --noEmit` and read the errors.
2. Fix them. If an error comes from unstaged work in progress, stash that work (`git stash --keep-index`) and run the check again.
3. Commit again.

`npm run build` runs `tsc -b`, which also checks `tsconfig.node.json`, so a build can fail on errors the commit hook doesn't catch.

### Fix deep links that return 404 on the host

**Symptom:** the home page loads, but reloading or opening a URL such as `/deck/<id>` directly returns the host's 404 page.

**Cause:** the app uses client-side routing (`BrowserRouter`). The host has to serve `index.html` for every path. `vercel.json` already does this on Vercel:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Fix:**

- On Vercel, make sure `vercel.json` is at the repo root of the deployed commit, then redeploy (deploys are manual: `vercel --prod` or the Vercel dashboard).
- On any other host, add the equivalent "rewrite all paths to `/index.html`" rule.

## Next steps

- [Import and export a deck](how-to/import-and-export-a-deck.md)
- [Development setup](contributing/development-setup.md)
- [Deck file formats](reference/deck-file-formats.md)
- [External services](reference/external-services.md)
