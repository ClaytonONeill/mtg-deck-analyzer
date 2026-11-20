# How suggestions are chosen

This page explains where the cards on the **Suggestions** tab (and in the swap sidebar) come from, and why two decks with the same commander can get different suggestions.

For the steps to use suggestions, see [Get card suggestions](../how-to/get-card-suggestions.md). For the services involved, see [External services](../reference/external-services.md).

## The short version

Two sources each say something different, and the app combines them.

- **EDHREC** knows how thousands of other players build decks around *your commander*. It says what is popular and what is unusually common with this commander.
- **Your own deck** says what *you* are building: its themes, its tribe, the Card Roles it is short on, and the Strategy and Objectives you have set. The app turns these into Scryfall searches.

Neither source is enough by itself. EDHREC alone would give every deck with a given commander the same list, whatever direction the deck has taken. Searching your own cards alone would miss what makes your commander special, and would do nothing for a nearly empty deck. So the app collects candidates from both sources, then **re-ranks every candidate against your deck** (`blend()` in `src/features/recommendations/utils/blend.ts`).

## What the engine looks at

The engine reads a small summary of the deck (`RecInput` in `deckSignals.ts`), not the whole saved deck:

- **Commander and partner.** These pick the EDHREC page. A partner pair uses a combined page.
- **The other cards.** On the deck page this is the **active version's** list, not always the main list. The panel title says which ("Suggestions for Main", or the version's name), because a version that swaps cards out may be heading somewhere different. See [How deck versions work](how-deck-versions-work.md).
- **Strategy** (`Deck.objectives`, the deck's one or two plans). Each Strategy entry counts at full strength.
- **Objectives** tagged on cards. An Objective counts only if it is on at least three cards, at half strength. One stray tag doesn't make something a priority for the deck.
- **Color identity.** This limits every search and filters every candidate.

From the cards, the engine *detects* three things using the same rules-text patterns that power Card Roles. Nothing is stored or tagged by hand:

- **Themes** such as Tokens, Landfall, ETB triggers, or +1/+1 counters. A theme needs about five matching cards (twelve for ETB, because so many creatures have one).
- **A tribe**, if one creature type is common enough.
- **Role gaps.** These are staple Card Roles (Ramp, Card draw, Removal, Board wipes) where the deck is under a rough target, for example "deck has 6 (aim ~10)". The deck builder's stats use the same counts, so the two screens agree.

This is why the [Strategy, Objectives, and Card Roles](strategy-objectives-and-card-roles.md) split matters here. Card Roles and themes come from the cards, so you never have to tag them to get suggestions. Strategy and Objectives are the only way to tell the engine something it can't read off the cards. Freeform Objective labels are matched to known themes or roles by keyword ("aristocrats" maps to Sacrifice, "go wide" maps to Tokens). A label with no keyword match can't steer the searches. It can still pick an EDHREC build if it names one of the commander's builds (see below).

## Source one: EDHREC's view of the commander

EDHREC publishes static JSON for each commander page. The app reads it directly (`edhrecClient.ts`). Each listed card comes with two numbers:

- **Inclusion:** the share of this commander's decks that play the card.
- **Synergy:** how much more often the card shows up with this commander than in other decks of the same colors.

Synergy counts for more than inclusion in the ranking. A high-synergy card is one this commander wants. A high-inclusion card is often just a staple for its colors, such as a mana rock every deck plays. Weighting synergy higher lets cards specific to the commander beat generic good cards.

EDHREC also lists the commander's popular **builds** (its themes, such as "Landfall" or "Tokens"), and each build has its own card page. The app loads several of these pages: the commander's four most popular builds, plus any build your Strategy, Objectives, or detected themes point to. It loads at most six. It then decides which builds to lean toward, at most two:

1. A build matching one of your Strategy entries or Objectives.
2. A build matching a theme or tribe detected in your cards.
3. Failing those, a popular build your deck **already resembles**, meaning your cards appear noticeably more often in that build than in the commander's decks overall.

The third rule is what lets two decks with the same commander drift apart. A Yarok deck full of ETB creatures leans toward the ETB build, and one full of fetchlands leans toward Landfall, even if neither has any tags. The "Based on" line under the panel title names each chosen build and why it was chosen ("your deck already looks like it", "your "Lifegain" objective").

EDHREC data also changes how the commander's own rules text is used. Without EDHREC, the engine reads the commander's abilities to guess its themes. With EDHREC, it trusts the commander's top builds instead, because how a commander is actually played says more than its text.

## Source two: searches built from your deck

Separately, the engine turns what it detected into **signals** (`buildDeckPlan()` in `deckSignals.ts`). Each signal is a weighted reason with a Scryfall query: a theme, the tribe, a role gap, or a recognized Objective. Only the four strongest signals run. If nothing qualifies (a nearly empty deck with no EDHREC data, say), one fallback signal runs: "Popular in your colors".

Each query is limited to the deck's color identity and to cards legal in Commander, and leaves out basic lands. Results come back in Scryfall's EDHREC-popularity order. Only the top 60 of each are kept, since deeper results are mostly noise. A card returned by several signals adds up their scores and collects all their labels. Cards that several parts of your deck point to rise to the top.

## Blending: re-ranking against this deck

Every candidate from either source is scored against your deck from several angles:

- commander fit (EDHREC synergy and inclusion)
- membership in a chosen build, especially if the build plays the card more than the commander overall does
- fit with your detected themes and tribe
- fit with your Strategy and Objectives
- filling your single biggest role gap (only the biggest, so a do-everything staple can't pile up points)
- how strongly the searches ranked it
- a small bonus when more than one source agrees

The weights are fixed constants in `blend.ts`. Every user gets the same formula, and there is no tuning UI.

**Top picks vs. Hidden gems.** The toggle above the results changes one thing. "Hidden gems" scales each score down by how widely the card is already played. Cards that fit the deck but few decks run move up. Cards EDHREC doesn't know get a middle value. The app remembers your choice in the browser.

**Diversifying.** A deck with a big tribe or one dominant theme would otherwise fill the first page with that one thing. After ranking, a greedy pass (`diversify()` in `scryfallRecs.ts`) discounts each later card of the same primary type (Creature, Instant, Land…) every time one is picked. Other kinds of cards get onto the first page as a result.

## Why each card shows its reasons

Every suggestion carries chips such as "+27% synergy with Yarok", "Landfall build: in 41% of decks", "Fits your "Lifegain" objective", or "Fills ramp gap (6/10)". The card shows up to three, sorted by how much each added to the score, and a "+N" chip holds the rest.

There are two reasons for this. A score alone would be a black box. With reasons, you can judge a suggestion on your own terms, for example ignoring one that is only popular when you want synergy. Reasons also show what the engine *thinks* your deck is about. If the chips keep saying "Tokens" and you aren't building tokens, that tells you what your cards and tags are signalling. Overlapping reasons are merged, so the same point doesn't appear twice in different words.

## Why results are paged and capped

Results come eight at a time. **Show more** adds eight more, up to three times, so you see at most 32 cards. After that the panel says "That's the strongest set; beyond this, suggestions get noisy."

The cap is deliberate. Past about 32 cards the ranking runs out of strong reasons, and the remaining picks drift toward generic color staples or loose matches. A short list of strong picks is more useful than a long tail you would have to sort through yourself.

## Filtering: what never shows up

These filters run before diversifying, so a filtered card never takes up an early slot:

- **Already in the deck.** This covers the commander(s), the active version's cards, and cards added by pending swaps. Matching is by name, so another printing still counts. Basic lands and "any number of copies" cards such as Relentless Rats are exempt from the singleton check (`isDuplicateCard()` in `deckStore.ts`).
- **Outside the color identity.** The same `isCardLegalForDeck()` check the deck builder uses.
- **Not legal in Commander,** and **basic lands**.

One exception is intentional. When you quick-add a card from the Suggestions tab, the list it was built from stays frozen while you remain on the tab. The added card stays visible, marked as already in the deck, instead of vanishing and reshuffling the grid. Leaving the tab or switching versions unfreezes it.

## Replacing one card

The swap sidebar has a second mode, "For {card}", which looks for replacements for one specific card (`buildSwapPlan()`). The searches look for the outgoing card's job: the same Card Role, the same Objective tags, and whichever of the deck's themes or tribe it supports. Every result must also share its primary type and, unless it's a land, cost within one mana of it. Those constraints show up as reasons ("Also a creature", "Similar cost (3)"). EDHREC candidates go through the same type and cost check, and a candidate gets extra credit ("Same role", "Keeps the deck's theme") when it does what the outgoing card did. The sidebar's "For the deck" mode shows the deck-level suggestions described above.

## Limits and trade-offs

- **EDHREC is unofficial.** It has no public API. The app reads the same static JSON the EDHREC site uses, and that format could change without notice. All knowledge of the format lives in `edhrecClient.ts`. Unexpected or missing data is treated as "no EDHREC data" and never crashes the panel.
- **When EDHREC has nothing.** A brand-new commander may have no EDHREC page. The panel then says "No EDHREC data for this commander yet; suggestions are based on your deck's cards and objectives," and the search half carries on alone. If EDHREC can't be reached, a similar note offers a **Retry** link. Without EDHREC, suggestions are thinner, especially for a nearly empty deck, because there's less to detect.
- **When Scryfall fails.** If EDHREC data loaded, its candidates still show, with a note that some suggestions couldn't load. If neither source is available, the panel shows the error and a **Try again** button.
- **Rate limits shape the speed.** Scryfall allows about two search or collection requests a second, and going over that locks the client out for 30 seconds. So every suggestion request waits its turn on one shared schedule, spaced 550 ms apart, even if both suggestion panels are open. Up to four searches plus card lookups for EDHREC's candidates is why the first load takes a few seconds.
- **Caching is per session.** EDHREC pages, search results, and card lookups are kept in memory, so switching tabs and coming back is instant. Staging a swap re-filters without refetching. A page reload starts fresh, and nothing about suggestions is saved to the database.
- **The detection is heuristic.** Themes and roles come from regular expressions over rules text, so unusual wording can be missed or misread. The thresholds and weights are hand-picked defaults, not learned values.

The design history, and parts that are still unbuilt (such as combo-completion suggestions from Commander Spellbook), are in [`docs/plans/card-recommendations-v2.md`](../plans/card-recommendations-v2.md). That file is a plan, not a description of current behavior.
