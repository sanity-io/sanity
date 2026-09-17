import {dequal as isEqual} from 'dequal/lite'
import {memo, useCallback, useMemo, useState} from 'react'
import {CommentsSelectedPathContextV2} from 'sanity/_singletons'

import {type CommentsSelectedPath, type CommentsSelectedPathContextValue} from './types'

interface CommentsSelectedPathProviderProps {
  children: React.ReactNode
}

/**
 * @internal
 */
export const CommentsSelectedPathProvider = memo(function CommentsSelectedPathProvider(
  props: CommentsSelectedPathProviderProps,
) {
  const {children} = props
  const [selectedPath, setSelectedPath] = useState<CommentsSelectedPath | null>(null)

  const handleSelectPath = useCallback(
    (nextPath: CommentsSelectedPath | null) => {
      if (isEqual(selectedPath, nextPath)) return

      setSelectedPath(nextPath)
    },
    [selectedPath],
  )

  const ctxValue = useMemo(
    (): CommentsSelectedPathContextValue => ({
      selectedPath,
      setSelectedPath: handleSelectPath,
    }),
    [selectedPath, handleSelectPath],
  )

  return (
    <CommentsSelectedPathContextV2.Provider value={ctxValue}>
      {children}
    </CommentsSelectedPathContextV2.Provider>
  )
})
