import {isEqual} from 'lodash'
import React, {useCallback, useMemo, useState} from 'react'

import {CommentsSelectedPathContext} from './CommentsSelectedPathContext'
import {type CommentsSelectedPath, type CommentsSelectedPathContextValue} from './types'

interface CommentsSelectedPathProviderProps {
  children: React.ReactNode
}

export const CommentsSelectedPathProvider = React.memo(function CommentsSelectedPathProvider(
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
    <CommentsSelectedPathContext.Provider value={ctxValue}>
      {children}
    </CommentsSelectedPathContext.Provider>
  )
})
