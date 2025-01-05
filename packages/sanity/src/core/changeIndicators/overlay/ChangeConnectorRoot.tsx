import {type Path} from '@sanity/types'
import {type ReactNode, useMemo, useState} from 'react'
import {ConnectorContext} from 'sanity/_singletons'

import {ScrollContainer} from '../../components/scroll'
import {ChangeIndicatorsTracker} from '../tracker'
import {ConnectorsOverlay} from './ConnectorsOverlay'

/** @internal */
export interface ChangeConnectorRootProps {
  children: ReactNode
  className?: string
  isReviewChangesOpen: boolean
  onOpenReviewChanges: () => void
  onSetFocus: (path: Path) => void
  isEnabled?: boolean
}

/** @internal */
export function ChangeConnectorRoot({
  children,
  className,
  isReviewChangesOpen,
  onOpenReviewChanges,
  onSetFocus,
  isEnabled = true,
  ...restProps
}: ChangeConnectorRootProps) {
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>()

  const contextValue = useMemo(
    () => ({
      isReviewChangesOpen,
      onOpenReviewChanges,
      onSetFocus,
      isEnabled,
    }),
    [isReviewChangesOpen, onOpenReviewChanges, onSetFocus, isEnabled],
  )

  return (
    <ConnectorContext.Provider value={contextValue}>
      <ChangeIndicatorsTracker>
        <ScrollContainer {...restProps} ref={setRootElement} className={className}>
          {children}
          {rootElement && <ConnectorsOverlay rootElement={rootElement} onSetFocus={onSetFocus} />}
        </ScrollContainer>
      </ChangeIndicatorsTracker>
    </ConnectorContext.Provider>
  )
}
