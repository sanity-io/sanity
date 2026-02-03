# Test Results for ArrayOf Fix

## Problem

The `ArrayOf` type helper was always generated in TypeGen output, even when not used. This caused lint errors in projects with `@typescript-eslint/no-unused-vars` rule:

```
error  'ArrayOf' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
```

## Solution

Created a pnpm patch for `@sanity/codegen@5.9.1` that:

1. Tracks whether `ArrayOf` is actually used in generated types
2. Only includes the `ArrayOf` declaration when it's referenced
3. Checks both schema types and query result types

## Test Cases

### Test 1: Schema WITHOUT inline arrays (ArrayOf should NOT be generated)

**Input Schema:**

```json
[
  {
    "name": "person",
    "type": "document",
    "attributes": {
      "name": {"type": "objectAttribute", "value": {"type": "string"}},
      "slug": {"type": "objectAttribute", "value": {"type": "inline", "name": "slug"}}
    }
  },
  {
    "name": "slug",
    "type": "type",
    "value": {
      "type": "object",
      "attributes": {
        "current": {"type": "objectAttribute", "value": {"type": "string"}}
      }
    }
  }
]
```

**Generated Output:**

```typescript
export type Person = {
  _id: string
  _type: 'person'
  name?: string
  slug?: Slug
}

export type Slug = {
  _type: 'slug'
  current?: string
}

export type AllSanitySchemaTypes = Person | Slug

export declare const internalGroqTypeReferenceTo: unique symbol

// ✅ NO ArrayOf declaration (it's not used)
```

**Result:** ✅ PASS - ArrayOf is NOT generated

### Test 2: Schema WITH inline arrays (ArrayOf SHOULD be generated)

**Input Schema:**

```json
[
  {
    "name": "article",
    "type": "document",
    "attributes": {
      "title": {"type": "objectAttribute", "value": {"type": "string"}},
      "sections": {
        "type": "objectAttribute",
        "value": {
          "type": "array",
          "of": {"type": "inline", "name": "section"}
        }
      }
    }
  }
]
```

**Generated Output:**

```typescript
export type Article = {
  _id: string
  _type: 'article'
  title: string
  sections: ArrayOf<Section> // ← ArrayOf is used here
}

export type Section = {
  _type: 'section'
  heading?: string
}

export type AllSanitySchemaTypes = Article | Section

export declare const internalGroqTypeReferenceTo: unique symbol

// ✅ ArrayOf declaration IS included because it's used
type ArrayOf<T> = Array<
  T & {
    _key: string
  }
>
```

**Result:** ✅ PASS - ArrayOf IS generated when used

## Files Changed

1. **patches/@sanity__codegen@5.9.1.patch** (NEW)
   - Patches the `typeGenerator.js` to conditionally include ArrayOf

2. **packages/@sanity/cli/test/**snapshots**/typegen.test.ts.snap**
   - Updated 4 snapshots to remove ArrayOf from outputs that don't use it

3. **pnpm-lock.yaml**
   - Registered the patch in `patchedDependencies`

## Impact

- ✅ Fixes lint errors when ArrayOf is not used
- ✅ Still generates ArrayOf when it IS used (inline arrays)
- ✅ Backward compatible - only affects unused declarations
- ✅ No runtime changes - purely a code generation improvement
