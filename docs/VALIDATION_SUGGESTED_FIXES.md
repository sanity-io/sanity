# Validation suggested fixes (design note)

Status: proposal with a thin spike. Origin: feature request in Slack `#studio` (2026-09-29):
a validation error should be able to carry a corrected value that the editor applies with one
click, e.g. a redirect destination with a trailing slash. Follow-up from the thread: errors
should generally suggest context and solutions, so this should be a platform primitive rather
than a one-off.

## How validation reaches the form today

| Step           | Where                                                                                                 | What happens                                                                                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Rule        | `@sanity/types` `CustomValidatorResult`, `ValidationError`                                            | `rule.custom(fn)` returns `true`, a string, `LocalizedValidationMessages`, a `ValidationError` or an array of them.                                                                                                                  |
| 2. Normalize   | `@sanity/validation` `validators/genericValidator.ts` (`custom`), `util/convertToValidationMarker.ts` | Messages are localized, then each result becomes a `ValidationMarker`. The converter whitelists `code`, `details`, `level`, `message`, `path` (context path + the error's relative `path`/`paths`); anything else is dropped.        |
| 3. Evaluate    | `@sanity/validation` `evaluateDocumentObservable`                                                     | Same code runs headless (CLI `sanity documents validate`) and in Studio, so markers must stay plain, serializable data.                                                                                                              |
| 4. Store       | `sanity` `core/validation/validateDocumentWithReferences.ts`                                          | Emits `{validation: ValidationMarker[], isValidating, revision}` per document; re-runs on every edit (`exhaustMapWithTrailing`).                                                                                                     |
| 5. Form state  | `sanity` `core/form/store/formState.ts`                                                               | Markers are filtered per node by exact path and projected to `FormNodeValidation` `{level, message, path}` in four places (object, primitive, array of primitives, array of objects). `code`/`details` never reach field components. |
| 6. Field UI    | `FormFieldHeaderText` → `FormFieldValidationStatus`                                                   | Status icon with a hover-only `Tooltip` listing messages. It cannot host a clickable action accessibly.                                                                                                                              |
| 7. Document UI | `structure/panes/document/inspectors/validation/ValidationInspector.tsx`                              | Lists full markers (document-absolute paths); each card is a button that focuses the field.                                                                                                                                          |

There is already a precedent for one-click repairs: `MemberFieldError` renders
`InvalidValueInput` (convert or remove a value of the wrong type), `MissingKeysAlert` (add
missing `_key`s) and `DuplicateKeysAlert`, which apply patches through
`useFormCallbacks().onChange`. Suggested fixes generalize that to schema-authored validation.

## API

Add an optional `suggestedFixes` array to `ValidationError`, carried onto `ValidationMarker` and
`FormNodeValidation`. All `@beta`.

```ts
type ValidationSuggestedFix =
  | {type: 'set'; title: string; value: unknown} // replace the value at the marker path
  | {type: 'unset'; title: string} // remove the value at the marker path

interface ValidationError {
  message: string
  path?: Path
  suggestedFixes?: ValidationSuggestedFix[]
  // ...existing fields
}
```

Example, the redirect case from the request:

```ts
defineField({
  name: 'destination',
  type: 'string',
  validation: (rule) =>
    rule.custom((destination: string | undefined) => {
      if (!destination || destination === '/' || !destination.endsWith('/')) return true
      return {
        message: 'Destination must not end with a trailing slash',
        suggestedFixes: [
          {type: 'set', title: 'Remove trailing slash', value: destination.replace(/\/+$/, '')},
        ],
      }
    }),
})
```

An object-level validator can target a child and offer alternatives:

```ts
rule.custom((redirect) => ({
  message: 'Destination must not end with a trailing slash',
  path: ['destination'],
  suggestedFixes: [
    {type: 'set', title: 'Remove trailing slash', value: redirect.destination.slice(0, -1)},
    {type: 'unset', title: 'Clear destination'},
  ],
}))
```

Design choices:

- Data, not callbacks. Markers are produced headlessly and compared by value in form state; a
  function could not be serialized for the CLI, and would need the validator's closure to be
  re-run at click time.
- The fix targets the marker's path, so relative `path` and keyed array segments work without a
  second path concept. Fixes on a marker at the document root are dropped, because `set` there
  would replace the whole document.
- `type` is discriminated so later variants can be added without breaking consumers:
  `setIfMissing`, `insert`, or a `patches` variant with relative `FormPatch`-shaped operations
  for surgical edits to objects and arrays.
- `title` is required: a one-click action must say what it does. Localized titles
  (`LocalizedValidationMessages`) are an open question.
- Backwards compatible: the field is optional, existing return shapes are untouched, and
  malformed entries are dropped instead of throwing.

## UX

1. Field level (primary). When a field's validation carries fixes, render an inline row below
   the input: status icon, message, and one ghost button per fix ("Remove trailing slash").
   For primitive `set` fixes, show the resulting value (`→ /about`) in the button's tooltip.
   Fields without fixes keep today's tooltip, so existing studios see no visual change. The
   alternative, turning the status icon into a click-to-open popover when fixes exist, is less
   discoverable.
2. Validation inspector (secondary, implemented in the spike). Each card gets fix buttons under
   it. This reaches fields in other groups, collapsed objects and array item dialogs.
3. On accept, emit `set(value, markerPath)` or `unset(markerPath)` through the normal form
   `onChange`, so the change gets undo, presence, releases and version handling like typing.
   Validation re-runs and the marker disappears on its own. Keep focus on the field.

Edge cases:

- Stale fixes. A fix was computed for the value at validation time; applying it after further
  typing would clobber the newer text. Disable fix buttons while `isValidating` is true, and at
  apply time only apply if the current value still equals the value that was validated (the
  store already tracks `revision`; the marker could also carry the validated value when it has
  fixes).
- Async validators: same as above; fixes appear when the slow validator resolves.
- Nested paths and arrays: relative paths with `{_key}` segments work as-is. Index segments in
  primitive arrays shift when items move, which the stale guard covers. A `set` on an object or
  array replaces it wholesale, so the validator must spread the existing value (keeping `_key`);
  consider limiting the field-level UI to primitive fields in v1.
- `.all()` / `.either()`: child markers are folded into `details.causes`, so child fixes are
  lost. Decide whether to surface them.
- Read-only and permissions: document-level read-only is enforced in `useDocumentForm`
  (patches are dropped). Field-level `readOnly` (including conditional callbacks) is only known
  to form state: the field UI has it, the inspector must look up the form node at the marker
  path before offering fixes. Hidden fields: offer fixes only from the inspector.
- Custom inputs and field components receive `validation` with fixes, so plugins can render
  their own affordance.
- Portable Text renders markers in its own UI; out of scope for v1.

## Risks and open questions

- Naming: `suggestedFixes` vs `fixes` vs `suggestions` (ESLint calls user-accepted edits
  "suggestions" and automatic ones "fixes").
- Wholesale `set` on objects and arrays is easy to misuse; the `patches` variant is the answer
  if that becomes common.
- Built-in validators could emit fixes (`lowercase()`, `uppercase()`, trimming whitespace in
  `uri()`), which is where the "errors suggest solutions" principle pays off, but it changes
  every studio's UI and needs design review.
- CLI: `sanity documents validate` could print fixes, and a `--fix` flag could apply them
  headlessly. The serializable shape keeps that possible.
- Telemetry: log that a fix was applied (marker `code`, fix `type`), never the value.

## Incremental path

1. Types and plumbing (spike, no visible change for existing schemas): `@sanity/types`,
   `convertToValidationMarker` passthrough, `formState` projection. Safe to ship on its own
   under `@beta`; custom field components can use it immediately.
2. Validation inspector action (spike stub), plus the stale guard, field-level read-only
   lookup and telemetry.
3. Inline field affordance for primitive fields.
4. Built-in validator fixes, CLI output and `--fix`.

Plumbing first: every UI depends on it, and it is small and additive.
