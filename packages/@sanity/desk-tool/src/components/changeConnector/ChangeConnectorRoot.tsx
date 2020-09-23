import React from 'react'
import {ConnectorsOverlay} from './ConnectorsOverlay'
import {Tracker, ConnectorContext} from '@sanity/base/lib/change-indicators'

export function ChangeConnectorRoot({
  children,
  className,
  isReviewChangesOpen,
  onOpenReviewChanges
}: {
  isReviewChangesOpen: boolean
  onOpenReviewChanges: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <ConnectorContext.Provider value={{isReviewChangesOpen, onOpenReviewChanges}}>
      <Tracker>
        <ConnectorsOverlay className={className}>{children}</ConnectorsOverlay>
      </Tracker>
    </ConnectorContext.Provider>
  )
}
