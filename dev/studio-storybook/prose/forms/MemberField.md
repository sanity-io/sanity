---
source: stories/forms/MemberField.stories.tsx
title: 'Address'
blocks: 1
roundtrip: true
sourceHash: 66841c897636ee68
---

<!-- @component -->

Every field row in every object and document in Studio passes through one dispatcher before anything else decides how to draw it. `MemberField` reads a resolved member and picks one of four shape renderers, and that four-way branch is the seam that lets Studio add a new field shape without teaching every input in the tree to recognize it.

|          |                                                                                                                                                                                                                                                     |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/members/object/MemberField.tsx`                                                                                                                                                                                      |
| Tier     | CORE. Every field in every object and document in the Studio is routed through this dispatcher before anything else decides how to draw it                                                                                                          |
| Audit    | 🟡 needs-work (`type-dispatch`). The fallback branch that stands in for "unrecognised field" cannot be reached by any schema the Studio itself accepts, and one input that IS reachable is routed by declaration order rather than by its own shape |
| Patterns | `type-dispatch`                                                                                                                                                                                                                                     |
| Branches | 4 guards (`isMemberObject`, `isMemberArrayOfPrimitives`, `isMemberArrayOfObjects`, `isMemberPrimitive`), one bare `return null` fallback                                                                                                            |

Not an input itself: `MemberField` reads one resolved `FieldMember` and decides which of four field-shape renderers gets it, `ObjectField`, `ArrayOfPrimitivesField`, `ArrayOfObjectsField`, or `PrimitiveField`. Every field row in the document pane passes through here first. The component has four `if` guards, each calling into `fields/asserters.ts`, and a bare `return null` after all four fail:

```tsx
if (isMemberObject(member)) return <ObjectField ... />
if (isMemberArrayOfPrimitives(member)) return <ArrayOfPrimitivesField ... />
if (isMemberArrayOfObjects(member)) return <ArrayOfObjectsField ... />
if (isMemberPrimitive(member)) return <PrimitiveField member={member} renderField={renderField} renderInput={renderInput} />
return null
```

Each story below is a real document over a real schema, run through the live `FormBuilder` (`lib/formBuilderHarness.tsx`) so the member `MemberField` receives is the product of the real `useFormState` resolver, not a hand-built object.

**What reading it turned up.**

<details><summary><b>The `return null` fallback is dead code for any schema the Studio will load.</b></summary>

It exists to catch a member matching none of the four guards, but the array validator in `@sanity/schema` makes that state unreachable: `isMemberArrayOfPrimitives` requires every `of` member to be primitive and `isMemberArrayOfObjects` requires every `of` member to be an object type (`fields/asserters.ts:15-31`), and mixing the two in one array is a hard schema **error**, not a warning: `packages/@sanity/schema/src/sanity/validation/types/array.ts:156-171` reads "The array type's 'of' property can't have both object types and primitive types". Every schema type in Sanity compiles to `jsonType` `object`, `array`, `string`, `number`, or `boolean`; the four guards together already cover all of those (object maps to `isMemberObject`, a uniform-primitive or uniform-object array maps to one of the two array guards, and a primitive maps to `isMemberPrimitive`). A schema that produces a mixed array also fails to load past the schema-errors screen (`packages/sanity/src/core/studio/screens/schemaErrors/SchemaErrorsScreen.tsx`), so this branch is not merely rare, it is unreachable through any editing session.

</details>

<details><summary><b>A schema-authoring mistake is silently swallowed rather than surfaced.</b></summary>

`isMemberArrayOfPrimitives` and `isMemberArrayOfObjects` both use `Array.prototype.every`, which is vacuously `true` on an empty array. An array field declared with `of: []` (no member types at all) is legal by the same validator's own rules, `packages/@sanity/schema/src/sanity/validation/types/array.ts` raises no error or warning for it, and such a member satisfies **both** guards at once. Because `isMemberArrayOfPrimitives` is checked first, that field silently renders as `ArrayOfPrimitivesField`, with no indication anywhere on screen that the field declares zero allowed types. This is a real, reachable input (an easy accident from a spread or filter that empties an `of` array programmatically), and the two guards disagree about it in a way that is resolved only by which `if` happens to come first in the file. Not staged as a story here: what `ArrayOfPrimitivesField` and its input actually render with zero item types could not be confirmed without a live render this harness's own "do not assume it renders" caveat rules out, so it is reported rather than demonstrated.

</details>

> **Why it matters:** a dispatcher with a silent `null` fallback reads as defensive coverage for an edge case. It is not one here: the real gap is one call up, in `every()` treating "no declared types" the same as "all declared types agree", which lets a broken array definition pass as a normal one instead of surfacing as the misconfiguration it is.
