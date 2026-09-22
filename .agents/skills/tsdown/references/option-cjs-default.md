# CJS Default Export

Control how default exports are handled in CommonJS output.

## Overview

The `cjsDefault` option improves compatibility when generating CommonJS **entry** modules. When enabled (default), entry modules with only a single default export use `module.exports = ...` instead of `exports.default = ...`.

## Type

```ts
cjsDefault?: boolean  // default: true
```

## Basic Usage

### Enabled (Default)

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  cjsDefault: true, // default behavior
})
```

### Disabled

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  cjsDefault: false,
})
```

## How It Works

### With `cjsDefault: true` (Default)

When your module has **only a single default export**, tsdown transforms:

**Source:**

```ts
// src/index.ts
export default function greet() {
  console.log('Hello, world!')
}
```

**Generated CJS:**

```js
// dist/index.cjs
function greet() {
  console.log('Hello, world!')
}
module.exports = greet
```

**Generated Declaration:**

```ts
// dist/index.d.cts
declare function greet(): void
export = greet
```

This allows consumers to use `const greet = require('your-module')` directly.

### With `cjsDefault: false`

The default export stays as `exports.default`:

```js
// dist/index.cjs
function greet() {
  console.log('Hello, world!')
}
exports.default = greet
```

Consumers need `require('your-module').default`.

## Entry Modules Only

`cjsDefault` only applies to **explicit entry modules**. In [unbundle mode](option-unbundle.md), imported modules that are emitted as non-entry chunks keep named CJS exports such as `exports.default`. CJS is considered legacy and is supported in maintenance-only mode, so this behavior will not be extended to non-entry chunks.

If every source module is intended to be consumed independently, include all of them as entries:

```ts
export default defineConfig({
  entry: ['src/**/*.ts'],
  root: 'src',
  format: 'cjs',
  unbundle: true,
})
```

## When to Disable

- When your module has both default and named exports
- When you need consistent `exports.default` behavior
- When consumers always use ESM imports

## Tips

1. **Leave enabled** for most libraries (default `true`)
2. **Disable** if you have both default and named exports and need consistent behavior
3. **Test CJS consumers** to verify compatibility

## Related Options

- [Output Format](option-output-format.md) - Module formats
- [Shims](option-shims.md) - ESM/CJS compatibility
