import React from 'react'
import {Path} from '_self_'
interface ChangeIndicatorContext {
  value?: any
  compareValue?: any
  focusPath: Path
  path: Path
  fullPath: Path
}
export interface ConnectorContext {
  isReviewChangesOpen: boolean
  onOpenReviewChanges: () => void
  onSetFocus: (nextPath: Path) => void
}
export declare const ConnectorContext: React.Context<ConnectorContext>
export declare const ChangeIndicatorContext: React.Context<ChangeIndicatorContext>
export {}
