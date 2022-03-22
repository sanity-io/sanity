import type React from 'react'
import {Path} from '_self_'
interface Props {
  isReviewChangesOpen: boolean
  onOpenReviewChanges: () => void
  onSetFocus: (path: Path) => void
  className?: string
  children: React.ReactNode
}
declare function EnabledChangeConnectorRoot({
  children,
  className,
  onSetFocus,
  isReviewChangesOpen,
  onOpenReviewChanges,
}: Props): JSX.Element
export declare const ChangeConnectorRoot: typeof EnabledChangeConnectorRoot
export {}
