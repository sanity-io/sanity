import {createContext} from 'sanity/_createContext'

import type {PortableTextRootMembersContextValue} from '../../core/form/inputs/PortableText/contexts/PortableTextRootMembersContextValue'

/**
 * Carries the Portable Text input's root form-store members plus the
 * render plumbing needed to build nested-member `<FormInput>` elements
 * on demand.
 *
 * Replaces the eager flat-list `PortableTextMemberItemsContext` —
 * consumers query the tree lazily via path lookup hooks.
 *
 * @internal
 */
export const PortableTextRootMembersContext =
  createContext<PortableTextRootMembersContextValue | null>(
    'sanity/_singletons/context/portable-text-root-members',
    null,
  )
