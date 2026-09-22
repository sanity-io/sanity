# Package.json Migration

How to update package.json when migrating from tsup to tsdown.

## Scripts

Replace all occurrences of `tsup` and `tsup-node` with `tsdown`:

```json
// Before
{
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm",
    "dev": "tsup --watch",
    "build:node": "tsup-node src/server.ts"
  }
}

// After
{
  "scripts": {
    "build": "tsdown src/index.ts --format cjs,esm",
    "dev": "tsdown --watch",
    "build:node": "tsdown src/server.ts"
  }
}
```

## Dependencies

Rename `tsup` to `tsdown` in whichever dependency field it appears:

```json
// Before
{
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}

// After (Stage 1 — migration checkpoint)
{
  "devDependencies": {
    "tsdown": "0.22.14",
    "typescript": "^5.0.0"
  }
}
```

Use **`0.22.14` for Stage 1** — the last tsdown version that still accepts the deprecated tsup compatibility options and flags each one with a deprecation warning. Run the build on 0.22.14 and resolve every warning; v0.23+ silently ignores the removed options, so the warnings are the only reliable completeness check. Once the build is warning-free, upgrade to the latest tsdown (**Stage 2**):

```json
// Final state (Stage 2 — after a zero-warning build on 0.22.14)
{
  "devDependencies": {
    "tsdown": "^0.23.0",
    "typescript": "^5.0.0"
  }
}
```

### All Dependency Fields

| Field                  | tsup version    | Stage 1 (migration) | Stage 2 (final) |
| ---------------------- | --------------- | ------------------- | --------------- |
| `dependencies`         | any             | `0.22.14`           | `^0.23.0`       |
| `devDependencies`      | any             | `0.22.14`           | `^0.23.0`       |
| `optionalDependencies` | any             | `0.22.14`           | `^0.23.0`       |
| `peerDependencies`     | any             | `*`                 | `*`             |
| `peerDependenciesMeta` | rename key only | rename key only     | rename key only |

## Root Config Field

If the project uses inline config in package.json (root-level `tsup` field), rename to `tsdown`:

```json
// Before
{
  "name": "my-lib",
  "tsup": {
    "entry": ["src/index.ts"],
    "format": ["cjs", "esm"],
    "dts": true
  }
}

// After
{
  "name": "my-lib",
  "tsdown": {
    "entry": ["src/index.ts"],
    "format": ["cjs", "esm"],
    "dts": true
  }
}
```

Note: Option mappings (entryPoints→entry, etc.) also apply inside the root config field.

## Related

- [guide-option-mappings.md](guide-option-mappings.md) - Config option transforms
- [guide-differences-detailed.md](guide-differences-detailed.md) - Feature comparison
