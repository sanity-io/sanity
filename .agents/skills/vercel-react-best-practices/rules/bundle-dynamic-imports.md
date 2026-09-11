---
title: Dynamic Imports for Heavy Components
impact: CRITICAL
impactDescription: directly affects TTI and LCP
tags: bundle, dynamic-import, code-splitting, next-dynamic
---

## Dynamic Imports for Heavy Components

Use `next/dynamic` to lazy-load large components not needed on initial render.

**Incorrect (Monaco bundles with main chunk ~300KB):**

```tsx
import {MonacoEditor} from './monaco-editor'

function CodePanel({code}: {code: string}) {
  return <MonacoEditor value={code} />
}
```

**Correct (Monaco loads on demand):**

```ts
// monaco-editor.lazy.ts
export {MonacoEditor as default} from './monaco-editor'
```

```tsx
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(() => import('./monaco-editor.lazy'), {
  ssr: false,
})

function CodePanel({code}: {code: string}) {
  return <MonacoEditor value={code} />
}
```
