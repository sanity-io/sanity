import React from 'react'
import {ConnectorsOverlay} from './ConnectorsOverlay'
import {Tracker, ConnectorContext} from '@sanity/base/lib/change-indicators'
import {Path} from '@sanity/types'
import {ScrollContainer} from 'part:@sanity/components/scroll'

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
  const [rootRef, setRootRef] = React.useState<HTMLDivElement | null>()
  return (
    <ConnectorContext.Provider value={{isReviewChangesOpen, onOpenReviewChanges, onSetFocus}}>
      <Tracker>
        <ScrollContainer ref={setRootRef} className={className}>
          {children}
          {rootRef && <ConnectorsOverlay rootRef={rootRef} onSetFocus={onSetFocus} />}
        </ScrollContainer>
      </Tracker>
    </ConnectorContext.Provider>
  )
}
