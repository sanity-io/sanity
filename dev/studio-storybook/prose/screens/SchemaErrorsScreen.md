---
source: stories/screens/SchemaErrorsScreen.stories.tsx
title: 'Navbar & Shell/Screens/Schema Errors'
blocks: 5
roundtrip: true
sourceHash: aa2dbb7834f215e0
---

<!-- @component -->

SchemaErrorsScreen replaces the entire studio when the schema does not compile. Not a warning banner over a working studio: the studio does not start.

|        |                                                                               |
| ------ | ----------------------------------------------------------------------------- |
| Source | `packages/sanity/src/core/studio/screens/schemaErrors/SchemaErrorsScreen.tsx` |
| Tier   | SERVICE                                                                       |

It lists every problem group with an error in it, each as a bordered card carrying a breadcrumb to the offending path, the message, and a link to the relevant docs page when the problem has a `helpId`.

> **Why it matters:** this is the studio's compiler-error screen, and it is aimed squarely at a developer with the schema file open. That shows in two choices. The path is rendered as a breadcrumb of code segments rather than a dotted string, so a path like article, fields, author reads as a route into the file rather than a symbol to decode. And a help ID becomes a real docs link, so a schema rule nobody has met before is one click from its explanation instead of a phrase to paste into a search engine.

**The Copy to clipboard button is the quiet good idea.** It runs `formatSchemaErrorsToMarkdown` and puts the whole report on the clipboard as markdown - ready to paste into a pull request, an issue, or a chat with someone who can help. A screen full of errors is exactly the moment somebody wants to hand the errors to somebody else, and this is the only screen in the family that makes that a single click.

**Warnings are shown but never block.** `groupsWithErrors` filters to groups containing at least one `error`, so a warning-only schema starts the studio normally - the warnings go to the console via `reportWarnings`. But a group that has an error AND a warning renders both. In the mixed story below, the caution-toned card only ever appears in the company of a critical one.

**Harness note:** the screen reads only `schema._validation`, so these stories pass a minimal schema object rather than compiling a broken one. The rendering, the breadcrumb, the help links and the clipboard formatting are all real.

<!-- @story SingleError -->

The smallest real case: one array member declared without a type. Note the message contains a newline and the card preserves it (`white-space: pre-line`), so a two-sentence schema error keeps the line break its author wrote instead of running together.

<!-- @story MultipleErrors -->

Three problems across three paths. The screen does not rank or group them beyond the order the validator produced, which is the right restraint - it has no basis for deciding which broken schema rule matters most, and a wrong ordering would send someone to the wrong file first.

The third card is worth a look: an object type with no name at all, so `getTypeInfo` substitutes `<anonymous object>`. Even an unnameable problem gets a label rather than a blank breadcrumb.

<!-- @story WithWarnings -->

A schema with both. The caution-toned warning card sits inline among the critical ones, distinguished by tone and by icon - a triangle instead of a circle - so it survives a grayscale render.

The subtlety: this screen never appears for warnings alone. `groupsWithErrors` requires at least one `error` in a group, so a warning is only ever seen here because something else already stopped the studio. On a healthy schema the same warnings are logged to the console by `reportWarnings` and nothing is shown at all.

<!-- @story ProblemGroupsAlone -->

Rendered outside the screen, at the width a narrower container would give it. It is a `<ul>` of cards, one per problem rather than one per group - a group with three problems in it becomes three cards, because a reader fixing schema errors works problem by problem, not path by path.
