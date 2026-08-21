import {type Path} from '@sanity/types'
import {type ReactNode, useContext} from 'react'
import {PortableTextInputPathContext} from 'sanity/_singletons'

/**
 * Provides the Portable Text input's own doc-absolute path, so container
 * renders (which only receive an editor-relative path) can resolve their
 * doc-absolute member path by concatenation.
 * @internal
 */
export function PortableTextInputPathProvider(props: {path: Path; children: ReactNode}) {
  return (
    <PortableTextInputPathContext.Provider value={props.path}>
      {props.children}
    </PortableTextInputPathContext.Provider>
  )
}

/** @internal */
export function usePortableTextInputPath(): Path {
  return useContext(PortableTextInputPathContext)
}
