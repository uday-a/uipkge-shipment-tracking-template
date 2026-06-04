# What the Internet Says About Spotting AI Slop — A Discourse Roundup

A gathering of how people *actually talk* about identifying AI-generated ("slop") design — the
practitioner tells, the root-cause theories, the accessibility data, the AI-image giveaways, and the
substantial counter-camp that thinks the whole framing is overblown.

This is the **discourse** (quotes, sentiment, debate), not a synthesized how-to. For the synthesized
catalog of tells see [`ai-design-tells-research.md`](./ai-design-tells-research.md); for the
project-specific rules see [`anti-ai-slop-design-guide.md`](./anti-ai-slop-design-guide.md).

*Gathered 2026-05-31 across 8 platform lenses (Hacker News, Reddit, designer X/Threads, design
publications, dev.to/Medium, accessibility research, the counter-debate, and AI-imagery): 106
attributed feedback items, 78 verbatim. Sentiment split: 59 critical · 22 how-to · 18 defends · 7
neutral. Verbatim quotes are in quotation marks; un-quoted attributions are faithful paraphrases.*

---

## A. The consensus tells — what people cite over and over

The single most-named tell is **purple/indigo**, usually with a gradient:

> "Purple-to-indigo gradients have become the Times New Roman of AI-generated design."
> — Jeff Humble, [The Fountain Institute](https://www.thefountaininstitute.com/blog/signs-vibe-coded-ui)

> "Dark hero. Neon purple accent. Gradient headline. Looks slick… until every other site looks
> exactly like it."
> — Jainil Prajapati, [dev.to](https://dev.to/jaainil/ai-purple-problem-make-your-ui-unmistakable-3ono)

> "It's insane though how many dark mode websites with purple there are right now, how come all LLMs
> converged on that style?" — *stingraycharles*, [Hacker News](https://news.ycombinator.com/item?id=47864393)

> "I would rather go back to when all side projects used Bootstrap than this
> purple-on-purple-with-glowing-purple mess." — *sen*, [Hacker News](https://news.ycombinator.com/item?id=47864393)

Beyond color, a remarkably stable checklist recurs. The clearest single inventory:

> Tells include: Inter used for everything (especially centered hero headlines), a serif italic for one
> accent word in an otherwise-Inter hero, "VibeCode Purple," perma dark mode with medium-grey body text
> and all-caps section labels, gradient everything, a badge right above the hero H1, and identical
> feature cards each with an icon on top. — Adrian Krebs, [design-slop](https://www.adriankrebs.ch/blog/design-slop/)

And the tell that started this whole engagement for us — Krebs again, validating it independently:

> "colored left borders are almost as reliable a sign of AI-generated design as em-dashes for text."
> — Adrian Krebs, [design-slop](https://www.adriankrebs.ch/blog/design-slop/)

Other repeatedly-cited visual tells:

- **Inter/Roboto + three icon boxes + light-grey background.** prg.sh's "hallmarks of AI slop":
  *Inter or Roboto (never anything with personality), purple/indigo accents, three features in boxes
  each with an icon, white/light-grey background* ([prg.sh](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website)). David Min lists the same cluster — *"Inter font family,
  purple-to-blue gradients, three-column layouts, rounded UI elements, entrance animations"* ([Medium](https://medium.com/@dminhk/why-do-ai-generated-websites-all-look-identical-02a68015613d)).
- **Cards inside cards inside cards.** > "Everything goes in a card. Then those cards go in a card.
  Then that card goes in a card." — Jeff Humble, [Fountain Institute](https://www.thefountaininstitute.com/blog/signs-vibe-coded-ui)
- **Neon-at-full-saturation palettes.** > "Electric blue next to hot pink next to acid green, all at
  full saturation, none of them doing anything in particular." — Jeff Humble, [Fountain Institute](https://www.thefountaininstitute.com/blog/signs-vibe-coded-ui)
- **Emoji as UI.** Humble flags *emojis as navigation icons, section headers, bullet replacements* —
  "Interfaces need icons, and icons need a system."
- **Oversized everything + endless scroll.** > "Personally I'm sick of all the oversized fonts and
  icons. Everything is so damn massive anymore that you have to scroll and scroll and scroll." —
  *soundboy64*, [r/webdev](https://www.reddit.com/r/webdev/comments/qvdvrk/websites_all_look_the_same_now/)
- **Purposeless three.js gimmicks.** > "Every site I'm going to these days has these giant black
  rubik's cube things you can click on… enough is enough." — *fakehalo*; and *"three.js sketches doing
  random shit, with no interactivity besides moving the model"* — *illbookkeeper10*, [r/webdev](https://www.reddit.com/r/webdev/comments/17clmce/why_do_all_new_websites_look_the_same/)
- **The "Canva-fication."** > "I call it the Canva-fication of AI… every single vendor seemed to be
  using that accursed [sparkle] emoji in their marketing." — *rchaud*, [Hacker News](https://news.ycombinator.com/item?id=37870437)

The shared sentiment underneath all of it — it's not *ugly*, it's *interchangeable*:

> "it's attractive, yet inoffensive. just the kind of lukewarm design language that could reasonably
> fit any idea or thing." — *functionmouse*, [Hacker News](https://news.ycombinator.com/item?id=48269907)

> "Generic doesn't mean ugly. It means averaged." — Jola Gil, [Design Bootcamp](https://medium.com/design-bootcamp/why-your-vibe-coded-designs-look-generic-the-fix-isnt-better-prompts-09e2fda26591)

---

## B. Why people say it happens — the root-cause discourse

The origin story everyone converges on, confirmed by the source himself:

> "I'd like to formally apologize for making every button in Tailwind UI `bg-indigo-500` five years
> ago, leading to every AI generated UI on earth also being indigo."
> — Adam Wathan, creator of Tailwind CSS, [X](https://x.com/adamwathan/status/1953510802159219096)

> When Tailwind launched its component library, the team "needed a default color for demos. They
> picked `bg-indigo-500`… thousands of developers copied those examples. Thousands of tutorials used
> those defaults." — [prg.sh](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website)

The mechanism people name is **statistical averaging**, not aesthetics:

> "LLMs are excellent at generating code, but they're not designers, they're statistical pattern
> matchers. When prompted vaguely, models produce the median of every Tailwind CSS tutorial scraped
> from GitHub between 2019 and 2024." — [prg.sh](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website)

> "AI represents the average of the majority, not of the best." — *classified*, [Hacker News](https://news.ycombinator.com/item?id=47864393)

> "Distributional convergence — a statistical phenomenon baked into how language models work, turning
> infinite creative possibilities into a narrow corridor of sameness." — David Min, [Medium](https://medium.com/@dminhk/why-do-ai-generated-websites-all-look-identical-02a68015613d)

Jainil Prajapati reframes the blame onto us: *"AI isn't 'in love' with purple; we trained it to be
average — through trend snapshots and copy-paste culture shaping the datasets"* ([dev.to](https://dev.to/jaainil/ai-purple-problem-make-your-ui-unmistakable-3ono)). And Jola Gil argues prompts
*structurally* can't fix it: *"Prompts… can carry explicit knowledge but not tacit knowledge like
compositional rhythm or visual tension — the qualities that make work personal rather than generic"*
([Design Bootcamp](https://medium.com/design-bootcamp/why-your-vibe-coded-designs-look-generic-the-fix-isnt-better-prompts-09e2fda26591)).

---

## C. The accessibility dimension — the data-backed critique

The strongest *evidence-based* strand: AI-assisted coding is measurably making the web less accessible.
The [WebAIM Million 2026 report](https://webaim.org/projects/million/) found **95.9% of home pages had
WCAG failures — 56.1 errors per page on average, a 10.1% increase, reversing six years of improvement.**
Low-contrast text (83.9%) and missing alt text (53.1%) dominated, and — counterintuitively — *pages with
ARIA had more errors (59.1) than pages without (42)*, with the report citing "vibe coding" as a factor.

> "When issues repeat at scale, they are usually being reproduced, not introduced." — Diana Khalipina,
> [a11yblog](https://a11yblog.com/2026/04/03/what-the-new-webaim-million-report-tells-us/)

> "AI cannot repair a broken structure. Instead, AI inherits it and reproduces it at scale." — Anna E.
> Cook, [annaecook.com](https://annaecook.com/writing/2026/ai-doesnt-fix-accessible-systems-it-depends-on-them)

Frontend Masters' analysis is the most-quoted craft critique:

> "CSS can make a `<div>` look like a button. Only HTML semantics can make it be one." …
> "Most LLMs optimize for visual output while generating near-zero semantic information for the layer
> that assistive technologies actually read." … "For screen reader users, keyboard navigators, and
> voice control users, the component effectively doesn't exist."
> — Durgesh Rajubhai Pawar, [Frontend Masters](https://frontendmasters.com/blog/ai-generated-ui-is-inaccessible-by-default/)

A practitioner audit of 100 vibe-coded sites corroborates: *headings skipping H1→H4, images with no alt
attributes, default favicons left in place* — Sergey, [dev.to](https://dev.to/kaplich/i-analyzed-100-vibe-coded-websites-and-found-these-common-mistakes-5275). And Nielsen Norman Group's evaluation:

> "AI-generated screens appear flat and interchangeable." … "The output often feels good from afar, but
> far from good." — Wang & Brown, [NN/g](https://www.nngroup.com/articles/ai-prototyping/)

---

## D. Spotting AI *images & graphics* (a different skillset)

Distinct from layout tells, people identify generated imagery by physical impossibilities. Documented
visual red flags ([Wikipedia: AI slop](https://en.wikipedia.org/wiki/AI_slop)): *six-fingered hands and
disconnected fingers, misspelled logos and nonsensical background text, wrong number of limbs, surreal
impossible compositions like "Shrimp Jesus."* Northwestern's Matthew Groh offers concrete checks:

> "If you're really like, 'Ah, this is a person that looks a little off,' check if that pupil is
> circular." … physics violations are tells: "You can't look in the mirror and have a different shirt
> than you're wearing." — [Kellogg Insight](https://insight.kellogg.northwestern.edu/article/ai-photos-identification)

Groh also explains the over-polished look: *"The models are trained on professional photographs.
Regular-looking people just don't have as many images of themselves on the internet."* And the
color-grading tell — ChatGPT's so-called "piss filter":

> "whites that drift toward cream, shadows that pick up a muddy brown, and skin tones that get a
> slightly jaundiced push." — [Popular AI](https://www.popularai.org/p/chatgpts-piss-filter-why-ai-images)

The 3D-asset world is where critics say slop is undeniable even to laypeople: *"A sloppy model
immediately looks sloppy to nearly any untrained eye"* (*dudeinhawaii*), while professionals note the
*"Illusion of Completeness"* — "visually plausible surfaces without underlying functional geometry"
(*aakresearch*), no clean topology to actually work with ([Hacker News](https://news.ycombinator.com/item?id=47157841)).

---

## E. The counter-discourse — "AI slop" as overblown or gatekeeping

A serious minority (18 of 106 items) pushes back. Three lines of argument:

**1. Sameness predates AI; blame the constraints, not the tool.**

> "The craft doesn't disappear. It moves up a level of abstraction. You stop being the person who
> pushes every pixel and start being the person who knows which pixels actually matter." — Riley
> Gerszewski, [Medium](https://rileygersh.medium.com/ai-didnt-ruin-design-you-re-blaming-the-tool-again-fda99a2a6d1c)

Gerszewski argues the sites people defend "exist because designers learned to work within the boxes
that SEO, responsive mandates, accessibility requirements, and design systems built — sameness predates
AI," and that we're still in "AI's Flash era… the homogenization everyone is complaining about hasn't
even happened yet." Redditors echo the structural causes: *"most sites out there look very similar
because everyone just copies what's working"* and accessibility/lawsuit pressure "limits a lot of more
out there designs" ([r/webdev](https://www.reddit.com/r/webdev/comments/qvdvrk/websites_all_look_the_same_now/)).

**2. Mediocrity is the human baseline — the label is a double standard.**

> "When human artists reproduce clichés, we call it convention; when a machine does the same, we call
> it corruption." … "The majority of human production has always been slop. Mediocrity is not a bug of
> technology; it is the baseline of culture." — Francesco D'Isa, [The Philosophical Salon](https://thephilosophicalsalon.com/the-idea-of-ai-slop-is-slop/)

And the bluntest version: calling everything "AI slop" "isn't criticism, it's gatekeeping" — substituting
a sneer for actual critique ([Cracked](https://trivia.cracked.com/image-pictofact-20106-calling-everything-ai-slop-isnt-criticism-its-gatekeeping), thesis from headline; body blocked).

**3. The tells are unreliable — and false accusations cause real harm.**

The em-dash "tell" gets the most skepticism:

> "I haven't seen any hard evidence that chatbots… use more em dashes than anyone else." … "The em dash
> has the closest relationship to the way we experience thinking—rushing forward, suddenly swerving,
> forking into different branches." — Brian Phillips, [The Ringer](https://www.theringer.com/2025/08/20/pop-culture/em-dash-use-ai-artificial-intelligence-chatgpt-google-gemini)

On images: *"You Can't Detect AI Art, Even if You Think You Can"* — and *"Human artists can make the
same sorts of mistakes people associate with AI generation,"* so *"falsely accusing someone of using
generative AI… can destroy the reputation of upcoming artists"* (Sydney Butler, [Yahoo Tech](https://tech.yahoo.com/accusing-artist-using-ai-read-173014486.html)). And a reminder the output isn't the model's ceiling: *"The LLM does indeed know how to do it right… you can simply ask it to do so"* (*satvikpendem*, [HN](https://news.ycombinator.com/item?id=47864393)).

There's also the uncomfortable demand-side truth — clients *want* the generic look:

> "90% of customers who know nothing about web dev but have seen websites like this, want exactly this
> when they ask for something 'modern'. You want to impress your customers, not other web devs." —
> *AashyLarry*, [r/webdev](https://www.reddit.com/r/webdev/comments/xr1t1o/what_makes_a_website_generic_and_mediocre_to_you/)

---

## F. What people say to actually do about it

The prescriptive consensus, in order of how often it appears:

1. **Constrain, don't ask for creativity.** > "You're not asking the AI to be creative. You're asking
   it to implement someone else's creativity at scale." Give explicit prohibitions (*"Do not use Inter,
   Roboto, or Arial"*) and concrete references (*"the color palette of a 1970s ski lodge"*) — [prg.sh](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website).
2. **References & constraints over prose prompts.** Jola Gil: use *reference images instead of
   descriptions, encode decisions as constraints, work in evaluation loops* ([Design Bootcamp](https://medium.com/design-bootcamp/why-your-vibe-coded-designs-look-generic-the-fix-isnt-better-prompts-09e2fda26591)).
3. **Define real tokens.** Jainil Prajapati: *"Define tokens. Pick colors in OKLCH/HCT. Enforce
   contrast. Prompt with your brand, not generic aesthetics"* ([dev.to](https://dev.to/jaainil/ai-purple-problem-make-your-ui-unmistakable-3ono)); Redditors note real customization "extends well beyond
   just changing a few colours."
4. **One dominant, one accent, one neutral.** Fountain Institute's antidote to the neon palette:
   "Everything else is noise."
5. **Group with space, not nested cards.** "Use whitespace, proximity, and typography to create
   grouping instead." — Fountain Institute.
6. **Be AI-second, not AI-first.** > "Many products are obsessed with being AI-first. But you might be
   way better off by being AI-second… map into the mental models people have, and enhance them with
   AI." — Vitaly Friedman, [Smashing Magazine](https://www.smashingmagazine.com/2025/07/design-patterns-ai-interfaces/); and treat AI as a co-pilot that "won't replace your skills, but… can spark ideas, catch
   issues, and speed up the tedious parts" (Nikita Samutin, [Smashing](https://www.smashingmagazine.com/2025/08/beyond-hype-what-ai-can-do-product-design/)).
7. **Structure-first = accessible *and* AI-legible.** > "Accessible systems are structured. Structured
   systems are parseable. Parseable systems are AI-interpretable." — Anna E. Cook.
8. **The cheeky one.** > "here's the secret to making ui that doesn't look vibe coded. *leans in close*
   use shadcn." — [@hi.im.vijay, Threads](https://www.threads.com/@hi.im.vijay/post/DTCPLGrlQe_/) (i.e.
   start from a real, tuned system rather than raw defaults).

---

## G. The vocabulary — how "slop" entered the language

- **Merriam-Webster / American Dialect Society** made *slop* a 2025 Word-of-the-Year contender, defining
  AI slop as *"digital content made with generative AI that is perceived as lacking in effort, quality,
  or meaning, and produced in high volume as clickbait"* ([Wikipedia](https://en.wikipedia.org/wiki/AI_slop)).
- **Simon Willison** helped popularize the term: *"if it's mindlessly generated and thrust upon someone
  who didn't ask for it, slop is the perfect term for it"* — while defending responsible use: *"I'm not
  going to use them to produce slop. I attach my name and stake my credibility on the things that I
  publish"* ([simonwillison.net](https://simonwillison.net/2024/May/8/slop/)). He credits *@deepfates*:
  *"the way that 'spam' became the term for unwanted emails, 'slop' is going in the dictionary as the
  term for unwanted AI generated content."*
- **"Great AI Convergence"** (Faisal Hoque, [Fast Company](https://www.fastcompany.com/91396307/how-ai-is-creating-a-crisis-of-business-sameness-ai-crisis-business-sameness)) extends the worry past design: brand voice,
  strategy, and culture all "become increasingly generic as organizations increasingly drink from the
  same conceptual fountain."

---

## The shape of the discourse, in one paragraph

Critics (the majority) treat AI slop as a recognizable visual dialect — purple/indigo + gradient, Inter
everywhere, three icon-boxes, nested cards, neon, emoji-icons, colored side-stripes, oversized type — and
trace it to LLMs reproducing the statistical median of a Tailwind-saturated training corpus. The
accessibility camp adds hard data: the web is measurably regressing as AI reproduces inaccessible
patterns at scale. The defenders counter that sameness predates AI (SEO, design systems, client taste),
that mediocrity is the human baseline so the label is a double standard, that the tells (em-dashes
especially) are unreliable and false accusations harm real artists, and that it's simply too early. The
fix everyone who offers one agrees on: **the model supplies the average; a human has to supply the
point of view** — through constraints, references, real design tokens, and editorial judgment.

---

## Sources (by lens)

**Hacker News:** [Purple gradient thread](https://news.ycombinator.com/item?id=48269907) · [Dark-mode-purple thread](https://news.ycombinator.com/item?id=47864393) · [AI-branding/purple](https://news.ycombinator.com/item?id=37870437) · [3D slop](https://news.ycombinator.com/item?id=47157841)
**Reddit:** [r/webdev: why do all new sites look the same](https://www.reddit.com/r/webdev/comments/17clmce/why_do_all_new_websites_look_the_same/) · [r/webdev: generic & mediocre](https://www.reddit.com/r/webdev/comments/xr1t1o/what_makes_a_website_generic_and_mediocre_to_you/) · [r/webdev: all look the same now](https://www.reddit.com/r/webdev/comments/qvdvrk/websites_all_look_the_same_now/) · [r/SaaS: landing-page pitfalls](https://www.reddit.com/r/SaaS/comments/194ylsp/i_found_common_saas_landing_page_pitfalls_and/)
**Designer X / Threads:** [Adam Wathan (Tailwind)](https://x.com/adamwathan/status/1953510802159219096) · [@hi.im.vijay (Threads)](https://www.threads.com/@hi.im.vijay/post/DTCPLGrlQe_/)
**Publications:** [NN/g — AI prototyping](https://www.nngroup.com/articles/ai-prototyping/) · [Smashing — AI interface patterns](https://www.smashingmagazine.com/2025/07/design-patterns-ai-interfaces/) · [Smashing — what AI can do for product design](https://www.smashingmagazine.com/2025/08/beyond-hype-what-ai-can-do-product-design/) · [Fountain Institute — signs of vibe-coded UI](https://www.thefountaininstitute.com/blog/signs-vibe-coded-ui) · [Fast Company — AI business sameness](https://www.fastcompany.com/91396307/how-ai-is-creating-a-crisis-of-business-sameness-ai-crisis-business-sameness)
**dev.to / Medium / blogs:** [prg.sh — purple gradient](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website) · [dev.to — AI purple problem](https://dev.to/jaainil/ai-purple-problem-make-your-ui-unmistakable-3ono) · [dev.to — I analyzed 100 vibe-coded sites](https://dev.to/kaplich/i-analyzed-100-vibe-coded-websites-and-found-these-common-mistakes-5275) · [Medium — why AI sites look identical](https://medium.com/@dminhk/why-do-ai-generated-websites-all-look-identical-02a68015613d) · [Design Bootcamp — the fix isn't better prompts](https://medium.com/design-bootcamp/why-your-vibe-coded-designs-look-generic-the-fix-isnt-better-prompts-09e2fda26591) · [Adrian Krebs — design slop](https://www.adriankrebs.ch/blog/design-slop/)
**Accessibility:** [WebAIM Million](https://webaim.org/projects/million/) · [Frontend Masters — inaccessible by default](https://frontendmasters.com/blog/ai-generated-ui-is-inaccessible-by-default/) · [a11yblog — WebAIM 2026](https://a11yblog.com/2026/04/03/what-the-new-webaim-million-report-tells-us/) · [annaecook.com](https://annaecook.com/writing/2026/ai-doesnt-fix-accessible-systems-it-depends-on-them)
**Counter-discourse:** [The Philosophical Salon — "the idea of AI slop is slop"](https://thephilosophicalsalon.com/the-idea-of-ai-slop-is-slop/) · [Medium — AI didn't ruin design](https://rileygersh.medium.com/ai-didnt-ruin-design-you-re-blaming-the-tool-again-fda99a2a6d1c) · [The Ringer — em dash](https://www.theringer.com/2025/08/20/pop-culture/em-dash-use-ai-artificial-intelligence-chatgpt-google-gemini) · [Yahoo Tech — you can't detect AI art](https://tech.yahoo.com/accusing-artist-using-ai-read-173014486.html) · [Cracked — gatekeeping](https://trivia.cracked.com/image-pictofact-20106-calling-everything-ai-slop-isnt-criticism-its-gatekeeping)
**Imagery / definition:** [Wikipedia — AI slop](https://en.wikipedia.org/wiki/AI_slop) · [Kellogg Insight — spotting AI photos](https://insight.kellogg.northwestern.edu/article/ai-photos-identification) · [Popular AI — the "piss filter"](https://www.popularai.org/p/chatgpts-piss-filter-why-ai-images) · [Simon Willison — slop](https://simonwillison.net/2024/May/8/slop/)
