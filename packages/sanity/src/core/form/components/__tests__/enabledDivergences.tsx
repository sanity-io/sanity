import {type ReactNode} from 'react'
import {DocumentDivergencesContext, type DocumentDivergencesContextValue} from 'sanity/_singletons'
import {vi} from 'vitest'

import {type ReachableDivergence} from '../../../divergence/divergenceNavigator'
import {type Divergence} from '../../../divergence/readDocumentDivergences'

const divergence: Divergence = {
  path: 'title',
  effect: 'set',
  documentId: 'upstream-doc',
  documentType: 'article',
  subjectId: 'drafts.doc-1',
  sinceRevisionId: 'upstream-doc@rev-1',
  isAddressable: true,
  status: 'unresolved',
  snapshots: {subjectHead: undefined, upstreamHead: undefined, upstreamAtFork: undefined},
}

const reachableDivergence: ReachableDivergence = {
  ...divergence,
  isComposite: false,
  divergences: [['title', divergence]],
  schemaType: {name: 'string', jsonType: 'string'},
}

/**
 * An enabled divergence context with one divergence at `title`. The form components look their
 * path up in this state, and the lookups only stringify the path once there is something to
 * compare against, so the list must not be empty.
 */
export const enabledDivergences: DocumentDivergencesContextValue = {
  enabled: true,
  sessionId: 'session',
  focusDivergence: vi.fn(),
  blurDivergence: vi.fn(),
  blurFocusedDivergence: vi.fn(),
  state: {
    focusedDivergence: undefined,
    previousDivergence: undefined,
    nextDivergence: undefined,
    state: 'ready',
    upstreamId: 'upstream',
    allDivergences: [['title', divergence]],
    divergences: [['title', reachableDivergence]],
    divergencesByNode: {title: 1},
  },
}

export function WithEnabledDivergences({children}: {children: ReactNode}) {
  return (
    <DocumentDivergencesContext.Provider value={enabledDivergences}>
      {children}
    </DocumentDivergencesContext.Provider>
  )
}
