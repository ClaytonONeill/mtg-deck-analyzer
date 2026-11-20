# Card Roles

This page lists every Card Role the app detects automatically from a card's rules text, the text that triggers each one, and where roles show up in the UI.

Card Roles are computed, not stored. They are different from **Objectives**, the tags you apply to cards yourself. For how Card Roles, Objectives, and a deck's Strategy relate, see [Strategy, Objectives, and Card Roles](../explanation/strategy-objectives-and-card-roles.md).

Source: `src/features/recommendations/utils/deckSignals.ts` (`CARD_ROLES`, `detectCardRoles`, `cardRoles`, `roleCounts`).

## How detection works

- Detection reads the card's rules text (`oracle_text`). For double-faced cards it reads the text of every face. The text is lowercased before matching.
- Each role is one regular expression. A card has a role if its text matches that role's pattern. One card can have several roles, or none.
- Keywords, type line, and mana cost are not checked. The only exception is **Ramp**, which never applies to a land.
- Roles are worked out again every time they are needed, so they always reflect the card's current text and are never saved to the database.

## Role list

There are eight Card Roles in two groups.

- **Staple roles** each have a target count. They show up in the deck stats and the suggestion engine, as well as in the gallery.
- **Display-only roles** have no target. They show up only in the gallery.

| Role | ID | Group | Target | Triggered by rules text that… | Example card |
| --- | --- | --- | --- | --- | --- |
| Ramp | `ramp` | Staple | 10 | adds a specific mana symbol (`Add {W}`/`{U}`/`{B}`/`{R}`/`{G}`/`{C}`), says "add one mana" or "add two mana", or searches your library for a land or basic land (including "up to *N*"). Lands never count. | Sol Ring |
| Card draw | `draw` | Staple | 10 | says "draw a card", "draw two/three/*N* cards", "draws cards", or similar. | Harmonize |
| Removal | `removal` | Staple | 8 | says "destroy target" or "exile target" followed by creature, artifact, enchantment, permanent, nonland, or planeswalker, or deals *N* damage to a target or any target. | Swords to Plowshares |
| Board wipes | `wipe` | Staple | 2 | says "destroy all", "exile all", or "all creatures get -". | Wrath of God |
| Tutor | `tutor` | Display-only | — | searches your library for "a", "an", or "up to one/two/three" cards that are not lands or basics. Land searches count as Ramp instead. | Demonic Tutor |
| Counterspell | `counter` | Display-only | — | says "counter target … spell". | Counterspell |
| Recursion | `recursion` | Display-only | — | returns something from your graveyard (or a graveyard) to the battlefield or to your hand. | Raise Dead |
| Protection | `protection` | Display-only | — | gives creatures or permanents you control hexproof, indestructible, shroud, or protection, or gives one target creature or permanent you control any of those. | Heroic Intervention |

Each example card matches only its own role's pattern, checked against the card's printed rules text.

Detection is a plain text match. A card whose wording matches a pattern gets the role even when the effect is incidental. For example, any card that says "draw a card" gets Card draw.

### Exact patterns

These are the regular expressions, matched against the lowercased rules text.

```text
ramp        add \{[wubrgc]\}|add (one|two) mana|search your library for (a|up to \w+) (basic )?lands?
            (never applied to a card whose front type line contains "Land")
draw        draw (a|two|three|\w+) cards?|draws? cards
removal     (destroy|exile) target (creature|artifact|enchantment|permanent|nonland|planeswalker)|deals? \d+ damage to (target|any target)
wipe        (destroy|exile) all |all creatures get -
tutor       search your library for (a|an|up to (one|two|three)) (?!(basic )?lands?\b|basic )[^.]*card
counter     counter target [^.]*spell
recursion   return [^.]*from (your|a) graveyard to (the battlefield|your hand)
protection  (creatures|permanents) you control (gain|have) [^.]*(hexproof|indestructible|shroud|protection)|target (creature|permanent) you control gains [^.]*(hexproof|indestructible|shroud|protection)
```

## Where Card Roles appear

| Surface | Location | Roles used | Behavior |
| --- | --- | --- | --- |
| Gallery role badges | Deck page, **Gallery** tab | All eight | Each card shows a badge for every role it has. In dense layouts the badges are hidden below the `sm` breakpoint. |
| Gallery filter | Deck page, **Gallery** tab, filter panel, **Card Roles** section ("detected from card text") | All eight | Only roles that at least one gallery card has are listed, each with a card count. Selecting several roles shows cards that have **any** of them. The role filter is combined with the other filters using AND. Basic lands are left out of the gallery and so are never counted. |
| Deck at a Glance | Deck builder page (`/build`, `/build/:deckId`), **Deck at a Glance** panel | Staple roles only | Shows `count/target` for each staple role, with a check mark once the target is met. Only the 99 are counted, not the commander or partner, and each card counts once per copy. |
| Suggestions: deck gaps | Deck page, **Suggestions** tab | Staple roles only | A staple role below its target becomes a search signal labelled `<Role>: deck has N (aim ~T)`. A candidate card that fills an under-target role gets a reason chip `Fills <role> gap (N/T)`. Only the largest gap counts for each card. |
| Suggestions: swap mode | Swap sidebar (`SwapSidebar`), when suggestions are for replacing one specific card | Staple roles only | Each staple role the outgoing card has becomes a signal labelled `Same role: <Role>`. |
| Swap-in picker | Deck page, **Suggestions** tab, **Swap in** | Staple roles only | Deck cards that share a primary type or a staple role with the incoming card are listed first. |
| Hand simulator | Deck page, **Simulator** tab | None | The simulator does not use Card Roles. |

## Recognized objective presets

> These are **Objectives**, not Card Roles. They are labels for tags you apply to cards yourself, and they are stored as part of your objectives. They are never detected from card text.

Source: `src/features/objectives/utils/recognizedObjectives.ts` (`RECOGNIZED_OBJECTIVE_GROUPS`), shown by `ObjectiveManager` on the **Objectives** page (`/objectives`).

- The presets appear as one-tap buttons under the heading "Quick picks: these also improve card suggestions."
- Tapping a preset fills in the new objective's label and description. You still create the objective yourself.
- A preset disappears once you already have an objective with the same label (case-insensitive).
- You can still create objectives with any freeform label.

| Group (UI heading) | Label | Description | Suggestion pattern |
| --- | --- | --- | --- |
| Core roles | Ramp | Extra mana: rocks, dorks, land fetch. | `ramp` |
| Core roles | Card Draw | Refills the hand; card advantage. | `draw` |
| Core roles | Removal | Answers a single threat. | `removal` |
| Core roles | Board Wipes | Resets the board when behind. | `wipe` |
| Synergies | Tokens | Makes or rewards creature tokens. | `tokens` |
| Synergies | +1/+1 Counters | Places or rewards +1/+1 counters. | `counters` |
| Synergies | Sacrifice | Sac outlets and death payoffs. | `sacrifice` |
| Synergies | Graveyard | Recursion and reanimation. | `graveyard` |
| Synergies | Lifegain | Gains life or pays off lifegain. | `lifegain` |
| Synergies | Landfall | Triggers on lands entering. | `landfall` |
| Synergies | Spellslinger | Instants and sorceries matter. | `spellslinger` |
| Synergies | Artifacts | Artifacts matter. | `artifacts` |
| Synergies | Enchantments | Enchantments matter. | `enchantments` |
| Synergies | Voltron | Equipment and Auras on one threat. | `voltron` |
| Synergies | Blink | Exile and return for ETB value. | `blink` |
| Synergies | ETB | Enter-the-battlefield triggers matter. | `etb` |
| Synergies | Mill | Mills a library. | `mill` |

The UI heading of the first group is literally "Core roles". The objectives in it are still user tags, not Card Roles.

### How objective labels reach suggestions

- The **Suggestion pattern** column shows the pattern each label resolves to through `OBJECTIVE_SYNONYMS` in `deckSignals.ts`. The first matching synonym wins.
- The four Core roles presets resolve to the same patterns as the four staple Card Roles. The Synergies presets resolve to deck-theme patterns, which are not Card Roles.
- Freeform labels go through the same synonym list. For example, a label containing "wrath" resolves to `wipe`. A label containing "counterspell" or "counter magic" is recognized but has no search, so it does not affect suggestions.
- Objectives count toward suggestions in two cases:
  - Every Strategy objective (`Deck.objectives`) counts.
  - A card-level objective (`DeckEntry.objectiveIds`) counts once it is tagged on at least 3 cards in the deck.
