# Mendoza decoder in TypeScript

Basic example:

```typescript
import {applyPatch} from "mendoza-js"

let left = {…};
let patch = […];
let right = applyPatch(left, patch);
```

Incremental patcher:

```typescript
import {Value, rebaseValue, wrap, unwrap, getType, applyPatch} from "mendoza-js/src/incremental-patcher"

// Create an empty initial version:
const ROOT = wrap(null, null);

// Input of patches:
let patches = […];

// `origin` can be whatever you want to identify where a change comes from:
let origin = 0;

// Reference to the latest version:
let value = ROOT;

// Rebasing is for maintaing history across deleted versions:
let rebaseTarget;

for (let patch of patches) {
  // Apply the patch:
  let newValue = applyPatch(value, patch, origin);

  // Rebase if needed:
  if (rebaseTarget) {
    newValue = rebaseValue(rebaseTarget, newValue);
  }

  // If the document was deleted, store the previous version so we can rebase:
  if (getType(newValue) === "null") {
    rebaseTarget = value;
  } else {
    rebaseTarget = null;
  }

  value = newValue;
  origin++;
}

// Return the final full object:
console.log(unwrap(value));
```