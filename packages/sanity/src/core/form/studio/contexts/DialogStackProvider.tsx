import {isKeySegment, type Path} from '@sanity/types'
import {type ReactNode, useCallback, useMemo, useState} from 'react'
import {DialogStackContext, type DialogStackEntry} from 'sanity/_singletons'

import {stringToPath} from '../../../field/paths/helpers'
import {EMPTY_ARRAY} from '../../../util/empty'
import {useFullscreenPTE} from '../../inputs/PortableText/contexts/fullscreen'
import {useFormCallbacks} from './FormCallbacks'

interface DialogStackProviderProps {
  children: ReactNode
}

/**
 * Provider that tracks a stack of open dialogs.
 * The last dialog in the stack is the "top" one.
 *
 * @beta
 */
export function DialogStackProvider({children}: DialogStackProviderProps): React.JSX.Element {
  const [stack, setStack] = useState<DialogStackEntry[]>([])
  const {onPathOpen} = useFormCallbacks()
  const {hasAnyFullscreen, allFullscreenPaths} = useFullscreenPTE()

  const push = useCallback((id: string, path?: Path) => {
    setStack((prev) => {
      // Don't add if already in stack (prevents infinite loops)
      if (prev.some((entry) => entry.id === id)) return prev
      return [...prev, {id, path}]
    })
  }, [])

  const remove = useCallback((id: string) => {
    setStack((prev) => prev.filter((entry) => entry.id !== id))
  }, [])

  const update = useCallback((id: string, path?: Path) => {
    setStack((prev) => prev.map((entry) => (entry.id === id ? {...entry, path} : entry)))
  }, [])

  const findAncestorFullscreenPath = useCallback(
    (currentPath: Path): string[] => {
      return allFullscreenPaths.filter((pathStr: string) => {
        const fullscreenPath = stringToPath(pathStr)

        // Check if fullscreen path is shorter or equal (ancestor or same level)
        // We include equal length to handle the case where we're at the fullscreen path itself
        if (fullscreenPath.length > currentPath.length) {
          return false
        }

        // Check if all segments of fullscreen path match the start of current path
        const segmentsMatch = fullscreenPath.every((segment, index) => {
          const currentSegment = currentPath[index]

          // For key segments, compare the _key property
          // For string segments, direct comparison
          return isKeySegment(segment) && isKeySegment(currentSegment)
            ? segment._key === currentSegment._key
            : segment === currentSegment
        })

        if (!segmentsMatch) {
          return false
        }

        // Check if the fullscreen path contains a key segment (that is nested)
        const isNestedFullscreenPath = fullscreenPath.some((segment) => isKeySegment(segment))

        if (isNestedFullscreenPath) {
          // For nested fullscreen PTEs, always navigate back to them
          return true
        }

        // For root-level fullscreen PTEs, only navigate back if the next segment
        // is NOT a key segment (i.e., we're going to a child field, not selecting an array item)
        const nextSegment = currentPath[fullscreenPath.length]
        return !isKeySegment(nextSegment)
      })
    },
    [allFullscreenPaths],
  )

  const closeAll = useCallback(() => {
    onPathOpen(EMPTY_ARRAY)
    setStack([])
  }, [onPathOpen])

  const closeWithFullscreen = useCallback(
    (currentPath: Path): void => {
      // Find all fullscreen paths that are ancestors of the current path
      const ancestorPaths = findAncestorFullscreenPath(currentPath)

      // If we found ancestor paths, navigate to the most nested one (longest/closest parent)
      if (ancestorPaths && ancestorPaths.length > 0) {
        const closestParentPath = ancestorPaths.reduce((longest: string, current: string) =>
          current.length > longest.length ? current : longest,
        )
        const newPath = stringToPath(closestParentPath)
        onPathOpen(newPath)

        // Keep stack entries that are ancestors of the new path
        // (dialogs that should remain open because the new path is inside them)
        setStack((prev) =>
          prev.filter((entry) => {
            if (!entry.path) return false
            // Entry is an ancestor if it's shorter and all its segments match the start of newPath
            if (entry.path.length >= newPath.length) return false
            // eslint-disable-next-line max-nested-callbacks
            return entry.path.every((segment, index) => {
              const newSegment = newPath[index]
              return isKeySegment(segment) && isKeySegment(newSegment)
                ? segment._key === newSegment._key
                : segment === newSegment
            })
          }),
        )
      } else {
        // No ancestor fullscreen path found, close all dialogs
        closeAll()
      }
    },
    [onPathOpen, findAncestorFullscreenPath, closeAll],
  )

  const close = useCallback(
    (options?: {toParent?: boolean}) => {
      const currentPath = stack[stack.length - 1]?.path

      // When toParent is set and there's a parent dialog, navigate to it
      // instead of closing everything
      if (options?.toParent && stack.length >= 2) {
        const parentEntry = stack[stack.length - 2]
        if (parentEntry?.path) {
          onPathOpen(parentEntry.path)
          // Remove the top entry, keep the parent and ancestors
          setStack((prev) => prev.slice(0, -1))
          return
        }
      }

      // Check if there's a fullscreen PTE that we should navigate back to
      if (currentPath && hasAnyFullscreen() && allFullscreenPaths.length >= 1) {
        closeWithFullscreen(currentPath)
        return
      }

      closeAll()
    },
    [closeWithFullscreen, closeAll, stack, onPathOpen, hasAnyFullscreen, allFullscreenPaths],
  )

  const navigateTo = useCallback(
    (targetPath: Path) => {
      onPathOpen(targetPath)

      // Keep only stack entries whose paths are strict ancestors of the target path
      // (dialogs that should remain open because the target is inside them)
      setStack((prev) =>
        prev.filter((entry) => {
          if (!entry.path) return false
          // Entry must be strictly shorter to be an ancestor
          if (entry.path.length >= targetPath.length) return false
          // eslint-disable-next-line max-nested-callbacks
          return entry.path.every((segment, index) => {
            const targetSegment = targetPath[index]
            return isKeySegment(segment) && isKeySegment(targetSegment)
              ? segment._key === targetSegment._key
              : segment === targetSegment
          })
        }),
      )
    },
    [onPathOpen],
  )

  const value = useMemo(
    () => ({stack, push, remove, update, close, navigateTo}),
    [stack, push, remove, update, close, navigateTo],
  )

  return <DialogStackContext.Provider value={value}>{children}</DialogStackContext.Provider>
}
