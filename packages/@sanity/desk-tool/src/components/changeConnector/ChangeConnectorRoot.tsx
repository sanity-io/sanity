import React from 'react'
import {ConnectorsOverlay} from './ConnectorsOverlay'
import {Tracker, ConnectorContext} from '@sanity/base/lib/change-indicators'
import {Path} from '@sanity/types'

export function ChangeConnectorRoot({
  children,
  className,
  onSetFocus,
  isReviewChangesOpen,
  onOpenReviewChanges
}: {
  isReviewChangesOpen: boolean
  onOpenReviewChanges: () => void
  onSetFocus: (path: Path) => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <ConnectorContext.Provider value={{isReviewChangesOpen, onOpenReviewChanges, onSetFocus}}>
      <Tracker>
        <ConnectorsOverlay onSetFocus={onSetFocus} className={className}>
          {children}
        </ConnectorsOverlay>
      </Tracker>
    </ConnectorContext.Provider>
  )
}
