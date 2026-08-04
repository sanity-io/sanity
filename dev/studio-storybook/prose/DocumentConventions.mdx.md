---
source: stories/DocumentConventions.mdx
format: mdx-verbatim
roundtrip: true
sourceHash: 87d711f4dc8b1d72
---

import {Meta} from '@storybook/addon-docs/blocks'

<Meta title="Start Here/Document Conventions" />

{/*
Specimen note for future authors: every "Real example" card on this page quotes the live
Button.stories.tsx docblock verbatim (see stories/actions/Button.stories.tsx), not a
reconstructed or historical version. If Button's docblock changes, update these quotes to
match, or the page starts making a claim a reader can falsify by opening Button's own page.
*/}

{/*
Font-inheritance note: loose multi-line text sitting directly inside a JSX block element
gets auto-wrapped by MDX in its own <p>, and that <p> then picks up the docs theme's
`fontBase` (Inter) directly rather than inheriting the wrapper's intended font, no amount
of font-family on the wrapper reaches it, because a rule that matches the element always
wins over pure inheritance, regardless of specificity. The "Three registers" specimens and
the plain-text "Real example" specimens below dodge this by passing their text as a {'...'}
JS expression, which MDX never reprocesses as markdown. The metadata-table and callout
specimens can't do that: they rely on real markdown syntax (a table, a blockquote) actually
being parsed. The .sbx-sample rule below forces their auto-generated <p> and <table> back to
inheriting from the styled wrapper instead.
*/}

<style>{`.sbx-sample p, .sbx-sample td, .sbx-sample th { font-family: inherit !important; }`}</style>

export const specimenCard = {
padding: '20px 22px',
borderRadius: 12,
border: '1px solid var(--sbx-line)',
background: 'rgba(255,255,255,0.02)',
marginBottom: 12,
}

export const specimenLabel = {
fontFamily: 'Inter, system-ui, sans-serif',
fontSize: 'var(--sbx-label)',
fontWeight: 650,
letterSpacing: '0.1em',
textTransform: 'uppercase',
color: 'var(--sbx-faint)',
marginBottom: 12,
display: 'flex',
justifyContent: 'space-between',
}

export const metaTable = {
width: '100%',
borderCollapse: 'collapse',
fontFamily: 'var(--sbx-mono)',
fontSize: 'var(--sbx-data)',
lineHeight: 1.6,
}

export const metaKey = {
padding: '6px 14px 6px 0',
verticalAlign: 'top',
whiteSpace: 'nowrap',
color: 'var(--sbx-faint)',
borderTop: '1px solid var(--sbx-line)',
}

export const metaVal = {
padding: '6px 0',
verticalAlign: 'top',
color: 'var(--sbx-muted)',
borderTop: '1px solid var(--sbx-line)',
}

# Document Conventions

This catalog is meant to be clear and consistent so users can trust the information it provides. This page explains the standards and conventions for writing docblocks in this catalog. Follow these guidelines so that new pages match the style and structure of existing ones. These instructions are directed at authors writing docblocks.

## Three registers, one family

A catalog page uses three typographic registers to clarify meaning: measured fact, argued prose, and interface chrome. Previously, all three used the same gray Inter font, making it difficult to distinguish between facts, commentary, and UI elements.

To resolve this, each register uses a distinct font: mono for measured fact, serif for argued prose, and Inter for interface chrome. This system is consistent across the catalog, the Component Atlas, and the Interface Pattern Library.

<div style={specimenCard}>
  <div style={specimenLabel}>
    <span>Instrument</span>
    <span>OS mono</span>
  </div>
  <p
    style={{
      fontFamily: 'var(--sbx-mono)',
      fontSize: 'var(--sbx-data)',
      lineHeight: 1.6,
      color: 'var(--sbx-muted)',
    }}
  >
    <span
      style={{
        color: 'var(--sbx-faint)',
        fontSize: 'var(--sbx-label)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      Source&nbsp;&nbsp;
    </span>
    {'packages/sanity/src/ui-components/button/Button.tsx'}
  </p>
  <p
    style={{
      fontFamily: 'var(--sbx-serif)',
      fontSize: 'var(--sbx-body)',
      lineHeight: 1.55,
      color: 'var(--sbx-faint)',
      marginTop: 14,
    }}
  >
    {
      'Everything a probe produced: source paths, tiers, audit verdicts, counts, file and line. If a number came from somewhere, it speaks mono.'
    }
  </p>
</div>

<div style={specimenCard}>
  <div style={specimenLabel}>
    <span>Essay</span>
    <span>Newsreader, Georgia stack fallback</span>
  </div>
  <p
    style={{
      fontFamily: 'var(--sbx-serif)',
      fontSize: 'var(--sbx-lead)',
      lineHeight: 1.55,
      color: 'var(--sbx-fg)',
      maxWidth: '52ch',
    }}
  >
    {'Almost everything a person '}
    <em style={{fontStyle: 'italic'}}>does</em>
    {' in Studio lands on a button, so the decision is made once.'}
  </p>
  <p
    style={{
      fontFamily: 'var(--sbx-serif)',
      fontSize: 'var(--sbx-body)',
      lineHeight: 1.55,
      color: 'var(--sbx-faint)',
      marginTop: 14,
    }}
  >
    {
      'The arguing register: what the component is, why it matters, what the audit found. It is the serif sanity.io itself reads in, and it runs optically small, so essay sizes sit a step above the old Inter sizes.'
    }
  </p>
</div>

<div style={specimenCard}>
  <div style={specimenLabel}>
    <span>Chrome</span>
    <span>Inter</span>
  </div>
  <p
    style={{
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 'var(--sbx-title)',
      fontWeight: 650,
      letterSpacing: '-0.022em',
      color: 'var(--sbx-fg)',
    }}
  >
    {'Actions & Commands'}
  </p>
  <p
    style={{
      fontFamily: 'var(--sbx-serif)',
      fontSize: 'var(--sbx-body)',
      lineHeight: 1.55,
      color: 'var(--sbx-faint)',
      marginTop: 14,
    }}
  >
    {
      'Headings, labels, controls, navigation. The surface the components live in, which should stay quiet enough that the other two registers can be heard.'
    }
  </p>
</div>

> **Why it matters:** none of this is enforced by a linter, and all of it degrades gracefully,
> which means an unconverted page never looks broken. It just looks like nobody made a
> decision. The conventions below are the decision.

## The five conventions

The following examples show the actual docblock for [`Button`](?path=/docs/actions-commands-button--docs), divided by convention. These are not reconstructed or outdated; the content matches the live page exactly. The Button docblock demonstrates all five conventions because it represents a core CHROME control.

### 1. The metadata table

Begin each docblock with a two-column markdown table, not a paragraph with bolded labels. This allows the lede selector to move directly to the first real sentence, so citations appear in the instrument register (see "Three registers" above) and do not interfere with the main argument.

<div style={specimenCard} className="sbx-sample">
  <div style={specimenLabel}>
    <span>Real example</span>
    <span>Button.stories.tsx</span>
  </div>
  {/*
    Written as a real <table> rather than markdown pipes. Storybook dropped remark-gfm from
    its MDX pipeline in v7 and this project does not add it back, so table syntax in an .mdx
    page renders as literal text. Docblocks are unaffected: those go through Storybook's own
    Markdown renderer, which handles tables. This is the only MDX page in the catalog that
    needs one, so the specimen is hand-built instead of taking on the dependency.
  */}
  <table style={metaTable}>
    <tbody>
      <tr>
        <td style={metaKey}>Source</td>
        <td style={metaVal}>
          <code style={{fontFamily: 'var(--sbx-mono)', fontSize: '0.92em'}}>
            packages/sanity/src/ui-components/button/Button.tsx
          </code>
          , the Studio shadow of{' '}
          <code style={{fontFamily: 'var(--sbx-mono)', fontSize: '0.92em'}}>@sanity/ui</code> Button
        </td>
      </tr>
      <tr>
        <td style={metaKey}>Tier</td>
        <td style={metaVal}>
          CHROME. The most commodity control there is; the shadow only pins layout, maps tone, and
          requires a tooltip when icon-only
        </td>
      </tr>
      <tr>
        <td style={metaKey}>Audit</td>
        <td style={metaVal}>
          🔴 needs-work (
          <code style={{fontFamily: 'var(--sbx-mono)', fontSize: '0.92em'}}>idempotency</code>).
          Submit controls that can double-fire; see the two Idempotency stories
        </td>
      </tr>
      <tr>
        <td style={metaKey}>Patterns</td>
        <td style={metaVal}>
          <code style={{fontFamily: 'var(--sbx-mono)', fontSize: '0.92em'}}>button-groups</code> ·{' '}
          <code style={{fontFamily: 'var(--sbx-mono)', fontSize: '0.92em'}}>prominent-done</code> ·{' '}
          <code style={{fontFamily: 'var(--sbx-mono)', fontSize: '0.92em'}}>fitts-law</code>
        </td>
      </tr>
    </tbody>
  </table>
</div>

### 2. Argument First

Start each docblock with a serif lede paragraph at `--sbx-lead` stating why the component is important to the product. Do not mention file paths or generic statements. The opening sentence must be specific to this component and not usable on multiple component pages.

<div style={specimenCard} className="sbx-sample">
  <div style={specimenLabel}>
    <span>Real example</span>
    <span>Button.stories.tsx</span>
  </div>
  <p
    style={{
      fontFamily: 'var(--sbx-serif)',
      fontSize: 'var(--sbx-lead)',
      lineHeight: 1.55,
      color: 'var(--sbx-fg)',
      maxWidth: '52ch',
    }}
  >
    {'Almost everything a person '}
    <em style={{fontStyle: 'italic'}}>does</em>
    {
      ' in Studio lands on a button, so the decision is made once: one shared control, and every action inherits its padding, its tone, and its sizing.'
    }
  </p>
</div>

The example does not reference file paths or props, only the Button’s role. A valid lede cannot work for multiple components; otherwise, it is not a true lede.

### 3. No Em-Dashes in Rendered Prose

Do not use em-dashes (—) in any rendered prose. Use commas, colons, or full stops for sentence structure instead. Check for em-dashes throughout the file, including story JSDoc and canvas strings, as well as the meta docblock.

### 4. The Callout Is for Stakes

Each page includes a single blockquote, starting with `**Why it matters:**`, which delivers the most critical point for the component. Do not use this callout for summaries or lists. If removing the callout does not diminish the argument of the page, rewrite it to be essential.

<div style={specimenCard} className="sbx-sample">
  <div style={specimenLabel}>
    <span>Real example</span>
    <span>Button.stories.tsx</span>
  </div>

> **Why it matters:** a button must make double-submission impossible. The audit found submit controls that stay live during an async write, so a rapid second click posts a duplicate. The fix is to flip into a pending state the instant it fires; the two Idempotency stories show the shipped behaviour and the repair side by side.

</div>

Reference to details earlier in the doc (such as `idempotency`) is fine, but the callout must explain "why," not just recap what has already been named.

### 5. Use Italic for Emphasis, Not for Labels

Use true italics (Newsreader italic) for emphasis. Bold should not be used for emphasis in prose; bold is reserved for structural labels and will be rendered as small Inter caps by CSS. Only the callout label (**Why it matters**) should appear bold after conversion.

<div style={specimenCard} className="sbx-sample">
  <div style={specimenLabel}>
    <span>Real example</span>
    <span>Button.stories.tsx</span>
  </div>
  <p
    style={{
      fontFamily: 'var(--sbx-serif)',
      fontSize: 'var(--sbx-body)',
      lineHeight: 1.55,
      color: 'var(--sbx-faint)',
    }}
  >
    {'The page closes '}
    <em style={{fontStyle: 'italic'}}>in context</em>
    {
      ': the document header of the Anna Karenina draft, where Publish, Review changes, and the overflow menu are all this one shared control.'
    }
  </p>
</div>

Use italics for true emphasis (e.g., _in context_). Labels, such as “Why it matters”, appear bold only because they are structural, not emphasized content.

## The Metadata Table: Complete Example

Every docblock should start with at least four rows: **Source**, **Tier**, **Audit**, and **Patterns**. Add additional rows for any measured property or aspect that needs documentation, such as configuration shapes, counts, hazards, or contradictions. Do not bury measured information in parentheticals: promote it to its own row.

Copy and adapt this template as needed. The initial `| | |` and `|---|---|` form a headerless, two-column table for a clean label strip.

```js
component: [
  '| | |',
  '|---|---|',
  '| Source | `packages/sanity/src/…/Thing.tsx`, and what it really is |',
  '| Tier | CORE, SERVICE or CHROME, plus the one clause that justifies it |',
  '| Audit | 🔴 needs-work (`pattern-slug`), or ⚪ not-audited as a unit, and why |',
  '| Patterns | `pattern-one` · `pattern-two` |',
  '',
  'The argument. Why this component matters in the product, in a sentence that could ' +
    'not open any other page.',
  '',
  '> **Why it matters:** the sharpest stake on the page, once.',
  '',
  'The page closes *in context*: what the last story shows.',
].join('\n'),
```

Be aware of these common pitfalls:

- **Pipe characters split cells:** Using `boolean | {reason}` in a table row will split it into more columns. Rephrase as "a boolean _or_ a `{reason}` object".
- **Story JSDoc is rendered prose:** Documentation in story JSDoc (`/** … */`) gets rendered and must follow these rules just like the main docblock.
- **Strings in story canvas:** All visible strings, such as fixture labels, are read by users and must follow all conventions, including em-dash avoidance.

## Controls and Documentation Pages

Document controls explicitly. If a component has props that warrant an args table, include one. If it does not, explicitly disable controls with `controls: {include: []}` and add a comment explaining why. This makes all documentation decisions clear and intentional, eliminating ambiguity.
