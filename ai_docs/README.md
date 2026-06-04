# ai_docs — AI-slop design references

Three references produced while restyling this template to the **Harbor** palette (petrol teal + warm
neutral). They explain how to recognize the generic "AI-generated" look and how this project avoids it.

| Doc | What it is | Use it when |
|---|---|---|
| [**anti-ai-slop-design-guide.md**](./anti-ai-slop-design-guide.md) | Repo-specific guide: the tells, the Harbor standard that replaces each, before/after diffs from this codebase, and a copy-paste detection-grep block. | You're building or reviewing UI **in this repo** and want the rules + a quick scan. |
| [**ai-design-tells-research.md**](./ai-design-tells-research.md) | General, exhaustively-cited catalog of AI design tells across color, type, layout, surface/effects, imagery, copy, motion, and accessibility — with the root cause and the human fix for each. | You want the broad, source-backed reference, independent of this project. |
| [**ai-slop-feedback-roundup.md**](./ai-slop-feedback-roundup.md) | The internet discourse itself: 106 attributed, mostly-verbatim quotes from Hacker News, Reddit, designers, publications, accessibility research, and the counter-camp who think the label is overblown. | You want to know what practitioners actually *say* — including the debate. |

Reading order: **guide** (apply it here) → **research** (the why, in depth) → **roundup** (the discourse).

The related implementation plan, [`2026-05-30-harbor-restyle-spec.md`](./2026-05-30-harbor-restyle-spec.md),
records the palette/token/typography changes that shipped.

> `ai_docs/` is normally git-ignored; these files are force-added on purpose because they're reference
> material worth shipping with the template.
