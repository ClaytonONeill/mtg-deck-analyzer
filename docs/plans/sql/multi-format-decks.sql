-- Multi-format decks (docs/plans/multi-format-decks.md).
-- Run once in the Supabase SQL editor before deploying the multi-format code.
-- Existing rows become Commander decks with an empty sideboard, which is
-- exactly how the app already reads them, so nothing else needs migrating.

alter table public.decks
  add column if not exists format text not null default 'commander';

alter table public.decks
  add column if not exists sideboard jsonb not null default '[]'::jsonb;

-- Optional guard: reject unknown format values. Keep this list in sync with
-- the DeckFormat type in src/types/index.ts if you add it.
-- alter table public.decks
--   add constraint decks_format_check check (
--     format in ('commander','standard','pioneer','modern','legacy','vintage','pauper')
--   );
