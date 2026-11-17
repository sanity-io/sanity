import type {Path} from '@sanity/types'
import {createContext} from 'react'

/**
 * Scrolls the content of the open enhanced object dialog that edits `path` to the top.
 * Each dialog provides one that handles its own path and hands any other path on to the
 * dialog it is nested in, so a dialog's breadcrumbs can reach every dialog behind it.
 *
 * @internal
 */
export type EnhancedObjectDialogScrollToTop = (path: Path) => void

/**
 * @internal
 */
export const EnhancedObjectDialogScrollContext =
  createContext<EnhancedObjectDialogScrollToTop | null>(null)
