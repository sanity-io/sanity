import React from 'react'
import {ConnectorsOverlay} from './ConnectorsOverlay'
import {Tracker, ConnectorContext} from '../'
import {Path} from '@sanity/types'
import {ScrollContainer} from 'part:@sanity/components/scroll'
import {ENABLED} from '../constants'

type Props = {
  isReviewChangesOpen: boolean
  onOpenReviewChanges: () => void
  onSetFocus: (path: Path) => void
  className?: string
  children: React.ReactNode
}
export function DisabledChangeConnectorRoot({children, className}: Props) {
  return <ScrollContainer className={className}>{children}</ScrollContainer>
}

function EnabledChangeConnectorRoot({
  children,
  className,
  onSetFocus,
  isReviewChangesOpen,
  onOpenReviewChanges
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

export const ChangeConnectorRoot = ENABLED
  ? EnabledChangeConnectorRoot
  : DisabledChangeConnectorRoot
