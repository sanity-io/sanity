---
source: stories/Lanes.mdx
format: mdx-verbatim
roundtrip: true
sourceHash: f368ac3961010ada
---

import {Meta} from '@storybook/addon-docs/blocks'

<Meta title="Foundations/Lanes" />

# Provenance lanes

Every story in this catalog belongs to one of five **provenance lanes**, a mark that says,
at a glance, _whose behavior you are looking at_ and _whether it is shipped canon or a
proposal_. The mark shows three ways, all from the same rule:

- a **corner marker** on the story canvas and on every docs canvas,
- a **coloured glyph** in the sidebar, and
- the badge label spelled out below.

Canon lanes (1–2) are quiet: a small chip, no frame. Lanes 3–5 and the paired defect repro
are loud: a toned frame, so you never mistake a proposal, a defect, or fabricated data for
shipped behavior.

<div style={{display: 'grid', gap: 14, margin: '28px 0'}}>
  <div style={{display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 18px', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10}}>
    <span style={{color: '#4e91fc', fontSize: 20, lineHeight: 1.2, width: 22, textAlign: 'center'}}>◇</span>
    <div>
      <strong>Lane 1 · UI v3</strong> &nbsp;
      <span style={{display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5, color: '#4e91fc', background: 'rgba(78,145,252,0.12)', border: '1px solid rgba(78,145,252,0.45)'}}>UI v3</span>
      <div style={{color: 'var(--sbx-muted)', marginTop: 6}}>The raw <code>@sanity/ui</code> primitive, the design-system layer, unwrapped. Canon. Derived from the <code>Primitive</code> story on a shadow page (or a <code>source:sanity-ui</code> tag).</div>
    </div>
  </div>

  <div style={{display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 18px', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10}}>
    <span style={{color: '#8b909a', fontSize: 20, lineHeight: 1.2, width: 22, textAlign: 'center'}}>◆</span>
    <div>
      <strong>Lane 2 · Studio</strong> &nbsp;
      <span style={{display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5, color: '#c7cad0', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)'}}>Studio</span>
      <div style={{color: 'var(--sbx-muted)', marginTop: 6}}>A Studio-shipped component, the shadow of a DS primitive, or Studio-only with no DS equivalent. Canon. Derived from <code>source:studio-shadow</code> / <code>source:studio-only</code> / <code>source:plugin</code>.</div>
    </div>
  </div>

  <div style={{display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 18px', border: '1px solid rgba(67,214,117,0.4)', borderRadius: 10, background: 'rgba(67,214,117,0.05)'}}>
    <span style={{color: '#43d675', fontSize: 20, lineHeight: 1.2, width: 22, textAlign: 'center'}}>✚</span>
    <div>
      <strong>Lane 3 · Proposed</strong> &nbsp;
      <span style={{display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5, color: '#43d675', background: 'rgba(67,214,117,0.12)', border: '1px dashed rgba(67,214,117,0.6)'}}>Proposed, not shipped</span>
      <div style={{color: 'var(--sbx-muted)', marginTop: 6}}>Our proposal: an audit-anchored fix, not shipped behavior. Green <b>dashed</b> frame. Derived from a <code>Recommended</code> variant.</div>
    </div>
  </div>

  <div style={{display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 18px', border: '1px solid rgba(245,166,35,0.4)', borderRadius: 10, background: 'rgba(245,166,35,0.05)'}}>
    <span style={{color: '#f5a623', fontSize: 20, lineHeight: 1.2, width: 22, textAlign: 'center'}}>✦</span>
    <div>
      <strong>Lane 4 · Envisioned</strong> &nbsp;
      <span style={{display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5, color: '#f5a623', background: 'rgba(245,166,35,0.12)', border: '1px dotted rgba(245,166,35,0.6)'}}>Envisioned, not built</span>
      <div style={{color: 'var(--sbx-muted)', marginTop: 6}}>A future-direction story with an argument to make, not built, not proposed for the current audit. Amber <b>dotted</b> frame. Opt in with <code>variant:envisioned</code> (or <code>lane:envisioned</code>).</div>
    </div>
  </div>

  <div style={{display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 18px', border: '1px solid rgba(34,118,252,0.4)', borderRadius: 10, background: 'rgba(34,118,252,0.05)'}}>
    <span style={{color: '#2276fc', fontSize: 20, lineHeight: 1.2, width: 22, textAlign: 'center'}}>▨</span>
    <div>
      <strong>Lane 5 · Stubbed</strong> &nbsp;
      <span style={{display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5, color: '#4e91fc', background: 'rgba(34,118,252,0.12)', border: '3px double rgba(34,118,252,0.6)'}}>Stubbed, shipped, fabricated data</span>
      <div style={{color: 'var(--sbx-muted)', marginTop: 6}}>A <b>real, shipped</b> Studio component reached through a <b>fabricated</b> data source, because the real one (an addon dataset, a live auth state, a comlink channel to a running front end) cannot be reached from a story. Blue <b>double</b> frame: two lines for two claims, the component is real and its contents are not. Opt in with <code>variant:stubbed</code> (or <code>lane:stubbed</code>).</div>
    </div>
  </div>
</div>

## Why Stubbed is a lane and not just "a story with a fixture"

Every story here already runs on fabricated data: `WithStudioProviders` invents a workspace,
`mockContentLake` invents GROQ results. So fabrication is not what sets this lane apart.

What sets it apart is **what the story is evidence of**. A Studio story is evidence about
_behaviour_: this is what the component does. A Stubbed story is evidence about _existence_:
this screen is in the product, and here is what it looks like. Reading the second as the first
is the one mistake the lane exists to prevent. Every Stubbed story carries a four-line
disclosure block naming what it cannot show:

```
**Real source:**   the addon dataset (`sanity.tasks.task`, via TasksAddOnWorkspaceProvider)
**Stubbed with:**  lib/addonDatasetStub.ts, 3 fixture tasks, 2 with activity
**Mounted by:**    core/tasks/components/TasksLayout.tsx, when `tasks.enabled`
**Cannot show:**   real activity ordering, permission-gated actions, the empty→first-task flow
```

`Mounted by` is the load-bearing line. A stubbed story proves a component _renders_; it says
nothing about whether anything still _mounts_ it. `TelephoneInput` renders perfectly, is
publicly exported, and no flow reaches it. The citation is checked by `qa/staleness.mjs`.

Stubbed stories live in their subject chapter, not in a holding pen: a stubbed comments
inspector belongs under Collaboration, where someone would look for it. The lane supplies the
marker; the chapter supplies the place.

## The audit overlay: Current

Lane 3 (Proposed) always pairs with a **Current** story that reproduces the as-shipped
defect the proposal fixes. Current is not a fifth lane: it is a **Studio** story (Lane 2)
carrying an audit finding, so it wears a loud red **solid** frame:

<div style={{display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 18px', border: '1px solid rgba(240,62,47,0.4)', borderRadius: 10, background: 'rgba(240,62,47,0.05)', margin: '18px 0'}}>
  <span style={{color: '#f03e2f', fontSize: 20, lineHeight: 1.2, width: 22, textAlign: 'center'}}>●</span>
  <div>
    <strong>Current</strong> &nbsp;
    <span style={{display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5, color: '#f36458', background: 'rgba(240,62,47,0.12)', border: '1px solid rgba(240,62,47,0.6)'}}>As shipped, audit finding</span>
    <div style={{color: 'var(--sbx-muted)', marginTop: 6}}>Reproduces the real, shipped defect, read it beside its <b>Proposed</b> sibling. Derived from a <code>Current</code> variant.</div>
  </div>
</div>

## How a lane is decided

One lane per story, from signals already in the corpus, **no retagging required**. Priority
(the proposal/defect variants win over canon provenance, because those are the ones a viewer
must not read as shipped):

1. `variant:envisioned` / `lane:envisioned` tag → **Envisioned**
2. `variant:stubbed` / `lane:stubbed` tag → **Stubbed**
3. a `Recommended` export (or `variant:recommended`) → **Proposed**
4. a `Current` export (or `variant:current`) → **Current**
5. the `Primitive` export on a `source:studio-shadow` page (or `source:sanity-ui`) → **UI v3**
6. `source:studio-shadow` / `source:studio-only` / `source:plugin` → **Studio**
7. otherwise → no marker

The matcher keys on the **export name**, not the display name (display names are decorated
freely, e.g. `similarity · Current (…)`). Override per story with a tag:
`variant:recommended` · `variant:current` · `variant:envisioned` · `variant:stubbed` ·
`variant:none` (opt out).

**Stubbed is tag-only**: it has no export-name convention, unlike Proposed and Current.
"Stubbed" is a plausible name for a story that merely uses a fixture, which is most of this
catalog, and inferring the lane from the word would mark half the corpus as
unreachable-without-a-stub. The lane carries a disclosure obligation, so entering it has to be
a decision rather than a spelling.

The single source of truth is `dev/studio-storybook/lib/lanes.ts`, read by both the canvas
decorator (`lib/variantFrame.tsx`) and the sidebar glyphs (`.storybook/manager.tsx`).
