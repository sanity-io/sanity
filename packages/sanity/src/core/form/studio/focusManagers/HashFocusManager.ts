/* eslint-disable react/no-unused-prop-types */

import {Path} from '@sanity/types'
import React, {useCallback, useEffect, useState} from 'react'
import {decodePath, encodePath} from '../../utils/path'

/** @internal */
export type HashFocusManagerChildArgs = {
  onFocus: (path: Path) => void
  onBlur: () => void
  focusPath: Path
}

/** @internal */
export interface HashFocusManagerProps {
  focusPath: any | null
  onFocus: () => void
  onBlur: () => void
  children: (arg0: HashFocusManagerChildArgs) => any
}

function getHash() {
  return decodeURIComponent(document.location.hash.substring(1))
}

function getPathFromHash() {
  const hash = getHash()
  return hash ? decodePath(hash) : []
}

/**
 * An example of how to sync focus path through document.location.hash
 *
 * @internal
 */
export function HashFocusManager(props: HashFocusManagerProps) {
  const {children} = props
  const [focusPath, setFocusPath] = useState(() => getPathFromHash())

  const handleBlur = useCallback(() => {
    // setFocusPath([])
  }, [])
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const handleFocus = useCallback((focusPath: Path) => {
    document.location.hash = encodePath(focusPath)
  }, [])

  useEffect(() => {
    const handleHashChange = () => {
      setFocusPath(getPathFromHash())
    }
    window.addEventListener('hashchange', handleHashChange, false)
    return () => window.removeEventListener('hashchange', handleHashChange, false)
  }, [])

  return children({onBlur: handleBlur, onFocus: handleFocus, focusPath})
}
