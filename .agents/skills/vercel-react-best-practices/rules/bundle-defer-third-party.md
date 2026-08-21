---
title: Defer Non-Critical Third-Party Libraries
impact: MEDIUM
impactDescription: loads after hydration
tags: bundle, third-party, analytics, defer
---

## Defer Non-Critical Third-Party Libraries

Analytics, logging, and error tracking don't block user interaction. Load them after hydration.

**Incorrect (blocks initial bundle):**

```tsx
import {Analytics} from '@vercel/analytics/react'

export default function RootLayout({children}) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**Correct (loads after hydration):**

```ts
// Analytics.lazy.ts
export {Analytics as default} from '@vercel/analytics/react'
```

```tsx
import dynamic from 'next/dynamic'

const Analytics = dynamic(() => import('./Analytics.lazy'), {
  ssr: false,
})

export default function RootLayout({children}) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```
