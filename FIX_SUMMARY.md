# Fix Summary: ArrayOf Type Helper

## Problem Statement

The `ArrayOf` type helper was always generated in TypeGen output, even when not used. This caused lint errors in projects with `@typescript-eslint/no-unused-vars` rule enabled:

```bash
error  'ArrayOf' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
```

Reference: https://github.com/sanity-io/lcapi-examples/actions/runs/21448855487/job/61771975683?pr=339

## Root Cause

In `@sanity/codegen@5.9.1`, the `typeGenerator.js` file always included the `ArrayOf` type declaration in the generated output, regardless of whether any types actually used it.

The `ArrayOf` helper is only needed when there are inline array types in the schema (arrays of objects defined inline rather than as separate named types).

## Solution

Created a pnpm patch for `@sanity/codegen@5.9.1` that:

1. **Tracks usage**: Recursively scans all generated types to detect references to `ArrayOf`
2. **Conditional inclusion**: Only includes the `ArrayOf` declaration if it's actually referenced
3. **Safe recursion**: Uses WeakSet and depth limiting to prevent infinite loops and stack overflow

## Implementation Details

### Key Changes

- **File**: `patches/@sanity__codegen@5.9.1.patch`
- **Location**: `dist/typescript/typeGenerator.js` in the `generateTypes` method

### Algorithm

```javascript
// Track if ArrayOf is used
let arrayOfUsed = false
const visited = new WeakSet()

// Recursively check AST nodes for ArrayOf references
const checkForArrayOf = (node, depth = 0) => {
  if (!node || depth > 100) return

  const isObject = typeof node === 'object'
  if (isObject) {
    if (visited.has(node)) return // Prevent circular refs
    visited.add(node)
  }

  // Check if this node is an ArrayOf reference
  if (isTSTypeReference(node) && node.typeName.name === 'ArrayOf') {
    arrayOfUsed = true
    return
  }

  // Recurse through children
  if (Array.isArray(node)) {
    node.forEach((child) => checkForArrayOf(child, depth + 1))
  } else if (isObject) {
    Object.values(node).forEach((value) => checkForArrayOf(value, depth + 1))
  }
}

// Scan schema types
schemaTypeDeclarations.forEach((decl) => checkForArrayOf(decl.tsType))

// Only include if used
if (arrayOfUsed) {
  program.body.push(arrayOfDeclaration.ast)
  code += arrayOfDeclaration.code
}
```

## Files Changed

### 1. `patches/@sanity__codegen@5.9.1.patch` (NEW)

- Patches the external `@sanity/codegen` package
- Registered in `pnpm-lock.yaml` under `patchedDependencies`

### 2. `packages/@sanity/cli/test/__snapshots__/typegen.test.ts.snap` (MODIFIED)

- Updated 4 test snapshots to remove unused `ArrayOf` declarations
- Test schema doesn't use inline arrays, so `ArrayOf` should not appear

### 3. `pnpm-lock.yaml` (MODIFIED)

- Registered the patch with hash

### 4. `TEST_ARRAYOF_FIX.md` (NEW - documentation)

- Comprehensive test results and validation

## Testing

### Manual Tests

✅ **Test 1**: Schema without inline arrays

- Input: Person/Slug schema with no inline arrays
- Result: `ArrayOf` NOT generated
- Status: **PASS**

✅ **Test 2**: Schema with inline arrays

- Input: Article schema with inline sections array
- Result: `ArrayOf` IS generated
- Status: **PASS**

### Automated Tests

- Updated snapshots match new behavior
- Lint-staged passes
- Prettier formatting passes
- CodeQL security scan: No issues

## Impact

### Positive

- ✅ Eliminates lint errors for unused `ArrayOf` type
- ✅ Cleaner generated code (no unused declarations)
- ✅ Backward compatible (still generates when needed)
- ✅ No runtime impact (purely code generation)

### Considerations

- Uses pnpm patch for external dependency
- Will need to be maintained if `@sanity/codegen` is upgraded
- Should consider contributing this fix upstream to `@sanity/codegen`

## Next Steps

1. **Monitor**: Watch for any issues in CI/CD after merge
2. **Upstream**: Consider opening PR in `@sanity/codegen` repository
3. **Documentation**: Update TypeGen docs if needed
4. **Release**: Include in next Sanity release notes

## Security Summary

- ✅ No security vulnerabilities introduced
- ✅ No code execution paths changed
- ✅ Only affects type generation (compile-time only)
- ✅ CodeQL scan passed with no findings
