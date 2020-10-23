import React from 'react'
import {Path} from '@sanity/types'
import {ScrollContainer} from 'part:@sanity/components/scroll'
import {Tracker, ConnectorContext} from '../'
import {ENABLED} from '../constants'
import {ConnectorsOverlay} from './ConnectorsOverlay'

interface Props {
  isReviewChangesOpen: boolean
  onOpenReviewChanges: () => void
  onSetFocus: (path: Path) => void
  className?: string
  children: React.ReactNode
}

function EnabledChangeConnectorRoot({
  children,
  className,
  onSetFocus,
  isReviewChangesOpen,
  onOpenReviewChanges,
}: Props) {
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

function DisabledChangeConnectorRoot({children, className}: Props) {
  return <ScrollContainer className={className}>{children}</ScrollContainer>
}

export const ChangeConnectorRoot = ENABLED
  ? EnabledChangeConnectorRoot
  : DisabledChangeConnectorRoot
