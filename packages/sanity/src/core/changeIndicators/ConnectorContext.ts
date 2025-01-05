import {type Path} from '@sanity/types'

/** @internal */
export interface ConnectorContextValue {
  isReviewChangesOpen: boolean
  onOpenReviewChanges: () => void | undefined
  onSetFocus: (nextPath: Path) => void | undefined
  isInteractive?: boolean
}
