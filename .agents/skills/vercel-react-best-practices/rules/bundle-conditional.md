---
title: Conditional Module Loading
impact: HIGH
impactDescription: loads large data only when needed
tags: bundle, conditional-loading, lazy-loading
---

## Conditional Module Loading

Load large data or modules only when a feature is activated.

**Example (lazy-load animation frames):**

```js
// animation-frames.lazy.js
export {frames as default} from './animation-frames.js'
```

```tsx
function AnimationPlayer({
  enabled,
  setEnabled,
}: {
  enabled: boolean
  setEnabled: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [frames, setFrames] = useState<Frame[] | null>(null)

  useEffect(() => {
    if (!enabled || frames || typeof window === 'undefined') return

    async function loadFrames() {
      try {
        const {default: animationFrames} = await import('./animation-frames.lazy.js')
        setFrames(animationFrames)
      } catch {
        setEnabled(false)
      }
    }

    void loadFrames()
  }, [enabled, frames, setEnabled])

  if (!frames) return <Skeleton />
  return <Canvas frames={frames} />
}
```

The `typeof window !== 'undefined'` check prevents bundling this module for SSR, optimizing server bundle size and build speed.
