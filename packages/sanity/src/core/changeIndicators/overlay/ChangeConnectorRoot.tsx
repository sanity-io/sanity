import {type Path} from '@sanity/types'
import {type ReactNode, useMemo, useState} from 'react'
import {ConnectorContext} from 'sanity/_singletons'

import {ScrollContainer} from '../../components/scroll'
import {ENABLED} from '../constants'
import {Tracker} from '../tracker'
import {ConnectorsOverlay} from './ConnectorsOverlay'

/** @internal */
export interface EnabledChangeConnectorRootProps {
  children: ReactNode
  className?: string
  isReviewChangesOpen: boolean
  onOpenReviewChanges: () => void
  onSetFocus: (path: Path) => void
}

/** @internal */
export function EnabledChangeConnectorRoot({
  children,
  className,
  isReviewChangesOpen,
  onOpenReviewChanges,
  onSetFocus,
  ...restProps
}: EnabledChangeConnectorRootProps) {
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>()

  const contextValue = useMemo(
    () => ({
      isReviewChangesOpen,
      onOpenReviewChanges,
      onSetFocus,
    }),
    [isReviewChangesOpen, onOpenReviewChanges, onSetFocus],
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

/** @internal */
export interface DisabledChangeConnectorRootProps {
  className?: string
  children: ReactNode
}

/** @internal */
export function DisabledChangeConnectorRoot({
  children,
  className,
}: DisabledChangeConnectorRootProps) {
  return <ScrollContainer className={className}>{children}</ScrollContainer>
}

/** @internal */
export const ChangeConnectorRoot = ENABLED
  ? EnabledChangeConnectorRoot
  : DisabledChangeConnectorRoot
