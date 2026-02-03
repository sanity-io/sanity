import {type ReactNode, useCallback, useMemo, useState} from 'react'
import {CommentsAuthoringPathContext} from 'sanity/_singletons'

import {type CommentsAuthoringPathContextValue} from './types'

interface CommentsAuthoringPathProviderProps {
  children: ReactNode
}

/**
 * @beta
 * @hidden
 * This provider keeps track of the path that the user is currently authoring a comment for.
 * This is needed to make sure that we consistently keep the editor open when the user is
 * authoring a comment. The state is kept in a context to make sure that it is preserved
 * across re-renders. If this state was kept in a component, it would be reset every time
 * the component re-renders, for example, when the form is temporarily set to `readOnly`
 * while reconnecting.
 */
export function CommentsAuthoringPathProvider(props: CommentsAuthoringPathProviderProps) {
  const {children} = props
  const [authoringPath, setAuthoringPath] = useState<string | null>(null)

  const handleSetAuthoringPath = useCallback((nextAuthoringPath: string | null) => {
    setAuthoringPath(nextAuthoringPath)
  }, [])

  const value = useMemo(
    (): CommentsAuthoringPathContextValue => ({
      authoringPath,
      setAuthoringPath: handleSetAuthoringPath,
    }),
    [authoringPath, handleSetAuthoringPath],
  )

  return (
    <CommentsAuthoringPathContext.Provider value={value}>
      {children}
    </CommentsAuthoringPathContext.Provider>
  )
}
