# eslint-config-bengler

Shared eslint rules for Bengler

# Usage

`npm i -D eslint-config-bengler`

## `.eslintrc`

### A vanilla JavaScript project (ES6 / JavaScript 2015)

```json
{
  "extends": [
    "bengler"
  ]
}
```

### A React project

```json
{
  "extends": [
    "bengler",
    "bengler/react",
  ]
}
```

### Legacy ES5 projects

```json
{
  "extends": [
    "bengler/es5"
  ]
}
```



## Legacy overrides

To ease migration of existing projects to the shared eslint config, a set of rules are redefined from errors to warnings.
These rules are defined in files in the `./legacy-overrides` folder.

!IMPORTANT! Do not include any of these in new projects. They are going away eventually.

### Example:

A legacy project that uses React:
```json
{
  "extends": [
    "bengler",
    "bengler/legacy-overrides/base",
    "bengler/react",
    "bengler/legacy-overrides/react"
  ]
}
```
