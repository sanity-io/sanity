import {useCallback, useEffect, useState} from 'react'

/** How long a Copy button reads Copied after a copy */
const COPIED_LABEL_MS = 2000

/**
 * Which of several Copy buttons copied last, for {@link COPIED_LABEL_MS}. A copy made while one
 * already reads Copied starts the time over.
 */
export function useCopiedFeedback<Target extends string>(): {
  copied: Target | null
  markCopied: (target: Target) => void
} {
  const [state, setState] = useState<{target: Target; at: number} | null>(null)
  useEffect(() => {
    if (state === null) return undefined
    const timer = setTimeout(() => setState(null), COPIED_LABEL_MS)
    return () => clearTimeout(timer)
  }, [state])
  const markCopied = useCallback((target: Target) => setState({target, at: Date.now()}), [])
  return {copied: state?.target ?? null, markCopied}
}
