import React, {useMemo} from 'react'
import {Path} from '@sanity/types'
import {ScrollContainer} from '../../scroll'
import {ConnectorContext} from '../ConnectorContext'
import {ENABLED} from '../constants'
import {Tracker} from '../tracker'
import {ConnectorsOverlay} from './ConnectorsOverlay'

interface EnabledChangeConnectorRootProps {
  children: React.ReactNode
  className?: string
  isReviewChangesOpen: boolean
  onOpenReviewChanges: () => void
  onSetFocus: (path: Path) => void
}

function EnabledChangeConnectorRoot({
  children,
  className,
  isReviewChangesOpen,
  onOpenReviewChanges,
  onSetFocus,
  ...restProps
}: EnabledChangeConnectorRootProps) {
  const [rootElement, setRootElement] = React.useState<HTMLDivElement | null>()

  const contextValue = useMemo(
    () => ({
      isReviewChangesOpen,
      onOpenReviewChanges,
      onSetFocus,
    }),
    [isReviewChangesOpen, onOpenReviewChanges, onSetFocus]
  )

  return (
    <ConnectorContext.Provider value={contextValue}>
      <Tracker>
        <ScrollContainer {...restProps} ref={setRootElement} className={className}>
          {children}
          {rootElement && <ConnectorsOverlay rootElement={rootElement} onSetFocus={onSetFocus} />}
        </ScrollContainer>
      </Tracker>
    </ConnectorContext.Provider>
  )
}

interface DisabledChangeConnectorRootProps {
  className?: string
  children: React.ReactNode
}

function DisabledChangeConnectorRoot({children, className}: DisabledChangeConnectorRootProps) {
  return <ScrollContainer className={className}>{children}</ScrollContainer>
}

export const ChangeConnectorRoot = ENABLED
  ? EnabledChangeConnectorRoot
  : DisabledChangeConnectorRoot
