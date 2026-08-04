---
name: technical-manual-voice
description: Edit storybook docblock prose (prose/**/*.md) into direct, technical reference writing — cutting AI-slop patterns and the setup-then-reveal essay structure that leaks into component descriptions. Use when editing, auditing, or sweeping copy in dev/studio-storybook/prose/, or when a component description or "Why it matters" callout reads as narrative rather than reference material.
---

# Technical manual voice

This catalog documents components the way a reference manual documents an API, not the way a
blog post argues a point. Every docblock is `prose/<path>.md`, mirrored from a
`<!-- @component -->` / `<!-- @story Name -->` block in the matching `stories/**/*.stories.tsx`
via `scripts/prose.mjs`. Editing happens in the `.md` mirror; the mirror never becomes a second
source of truth (see Workflow below).

A docblock has two zones with two different jobs. Slop collects in the first because writing
tends to reach for stakes and drama before it reaches for facts:

- **Description** (the paragraph(s) directly under `<!-- @component -->`, before the metadata
  table or first story): **what the component is and does.** A fact, stated once, subject first.
- **Why it matters** (the `> **Why it matters:**` callout): **why it's built that way, or what
  breaks if it isn't.** Mechanism and consequence — the one place rationale is allowed to live,
  and the richer the citation (file path, audit finding, line count) the better.

If a description is doing the "why it matters" zone's job, that's the defect: move the
justification down, replace the description with the fact it was justifying.

## The anti-pattern: setup-then-reveal

The dominant slop pattern in this corpus is not banned vocabulary — the corpus is already clean
on em dashes, weasel attribution, and importance puffery. It's a structural move borrowed from
essay writing: state a tension about the domain, then reveal the component as the resolution.

> "A menu is where a product puts everything it could not fit on screen, which makes the menu
> button one of the highest-traffic controls in Studio: document actions, the create-document
> picker and the workspace switcher all live behind one."

Every fact in that sentence is true. The problem is the shape: tension, then "and this is the
component that...", applied identically across components that have nothing to do with each
other. A reader scanning for what `MenuButton` does has to read a stage-setting clause before
reaching the subject. Ban this shape outright. Lead with the subject:

> "MenuButton is Studio's menu-trigger control. Document actions, the create-document picker, and
> the workspace switcher all open through it."

## Rules

**Carried over from general slop-editing, unchanged** — these are register-agnostic:

- Cut the banned-words list: delve, foster, leverage, utilize, facilitate, empower, streamline,
  robust, cutting-edge, paradigm shift, game changer, tapestry, realm, beacon, multifaceted,
  meticulous, intricate, paramount, transformative, elevate, embark, supercharge, harness (the
  rhetorical verb — not this codebase's own `formBuilderHarness` / `structureHarness` noun, which
  is a real identifier, not slop), ever-evolving.
- No colon-reveal drama ("The detail that makes it work: ..."). Colons are fine for labels,
  lists, and genuine technical citations (a file path, a prop name).
- No importance puffery ("stands as a testament," "marks a pivotal moment"). State the fact, let
  the reader judge whether it matters.
- No weasel attribution ("studies show," "widely regarded as"). Name the source (a file, an audit
  finding, a commit) or cut the claim.
- Em dashes: none by default. A comma, period, or parenthesis almost always works instead.
- Make every sentence earn its place. Cut a clause if the sentence is still true and still
  complete without it.

**Overridden for this catalog** — general slop-editing guides tell you to preserve the writer's
personal voice, humor, and digressions. Drop that here. A manual has no narrator. Every sentence
is a claim about the software, not a claim delivered _by_ someone. There is no "I" or implied
author, and no aside exists purely for character.

**Specific to this catalog:**

1. **Ban the setup-then-reveal opening.** No "[domain tension], and this is the component
   that...". No "X is where/how Studio does Y" as the first sentence. Name the component and
   state its function in the first sentence. Everything else in the description supports that
   fact — location, what wraps it, what it wraps.
2. **One claim, one sentence.** A description sentence joined by "and this is..." or "which makes
   ..." is usually two claims wearing one sentence. Split it, and cut whichever half was scene-
   setting rather than fact.
3. **No rhetorical second person.** "You" is fine inside a literal instruction a reader carries
   out ("press Publish twice"). It's not fine as address ("without ever telling you what would
   unblock you") — rewrite in third person about the editor/reader role, not "you."
4. **Rationale moves down, not out.** If the removed setup clause contained a real reason the
   component exists (not just drama), it isn't deleted — it moves into "Why it matters," tightened
   to mechanism and consequence, citing a file or an audit finding if one is available.
5. **Per-story blurbs (`<!-- @story Name -->`) stay concrete and stay short.** They're already the
   cleanest zone in the corpus — describe what this specific story demonstrates and how it differs
   from the sibling stories on the page. Don't import the description zone's problems into them.

## Worked example

| Zone        | Before                                                                                                                                                                                                                                                                                                                     | After                                                                                                                                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Description | "Almost everything a person _does_ in Studio lands on a button, so the decision is made once: one shared control, and every action inherits its padding, its tone, and its sizing."                                                                                                                                        | "Button is Studio's single shared button component. Every action control wraps it and inherits its padding, tone mapping, and sizing."                                                                                         |
| Description | "A Studio toolbar has to survive a pane the editor is free to drag narrower, and this is the component that keeps it from breaking: it watches how much room is left and sheds the least important controls into an overflow menu rather than letting anything wrap, clip, or push the document title off its own header." | "CollapseMenu keeps a toolbar usable as its pane narrows. It tracks available width and moves lower-priority controls into an overflow menu instead of letting them wrap, clip, or push the document title out of the header." |
| Description | "Menus grow. Every feature that ships adds a row, nobody ever removes one, and eventually the document menu is a column of fifteen things an editor reads past to reach the two they came for."                                                                                                                            | "MenuGroup is the grouping primitive Studio's menus use to organize items into sections, rather than one column that grows unbounded as features ship."                                                                        |

## Workflow

1. Read the target `.md` file(s) under `prose/`. Check `roundtrip:` in the frontmatter — `false`
   means the source block is `READ ONLY` (usually because it interpolates a runtime value); skip
   editing those, the inject step will refuse them anyway.
2. Before editing, run `node scripts/prose.mjs check` and confirm the target file isn't in the
   `conflicts` list ("source changed since extraction"). If it is, re-extract first:
   `node scripts/prose.mjs extract --force --only <path-substring>`.
3. Edit the `.md` mirror directly — the description paragraph, the `Why it matters` callout, and
   the per-story blurbs — applying the rules above. Don't touch the frontmatter or the
   `<!-- @component -->` / `<!-- @story Name -->` markers.
4. Inject back into source: `node scripts/prose.mjs inject --only <path-substring>`.
5. Run `npx prettier --write` on the touched `.stories.tsx` file(s), then `pnpm build` to confirm
   the story still compiles and renders.
6. Ignore whitespace-only diffs from the inject step itself (it normalizes `*italic*` to
   `_italic_` and pads markdown table columns — cosmetic, not content).
