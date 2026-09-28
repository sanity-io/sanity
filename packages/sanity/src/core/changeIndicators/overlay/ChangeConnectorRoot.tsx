import {type Path} from '@sanity/types'
import {type ReactNode, useMemo, useState} from 'react'
import {ReviewChangesContext} from 'sanity/_singletons'

import {ScrollContainer} from '../../components/scroll/scrollContainer'
import {ChangeIndicatorsTracker} from '../tracker'
import {ConnectorsOverlay} from './ConnectorsOverlay'

/** @internal */
export interface ChangeConnectorRootProps {
  children: ReactNode
  className?: string
  isReviewChangesOpen: boolean
  /**
   * Whether review changes can be opened. When false, change bars render as
   * non-interactive markers rather than buttons.
   */
  isInteractive?: boolean
  onOpenReviewChanges: () => void
  onSetFocus: (path: Path) => void
}

/** @internal */
export function ChangeConnectorRoot({
  children,
  className,
  isInteractive = true,
  isReviewChangesOpen,
  onOpenReviewChanges,
  onSetFocus,
  ...restProps
}: ChangeConnectorRootProps) {
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>()

  const contextValue = useMemo(
    () => ({
      isInteractive,
      isReviewChangesOpen,
      onOpenReviewChanges,
      onSetFocus,
    }),
    [isInteractive, isReviewChangesOpen, onOpenReviewChanges, onSetFocus],
  )

  return (
    <ReviewChangesContext.Provider value={contextValue}>
      <ChangeIndicatorsTracker>
        <ScrollContainer {...restProps} ref={setRootElement} className={className}>
          {children}
          {rootElement && <ConnectorsOverlay rootElement={rootElement} onSetFocus={onSetFocus} />}
        </ScrollContainer>
      </ChangeIndicatorsTracker>
    </ReviewChangesContext.Provider>
  )
}
