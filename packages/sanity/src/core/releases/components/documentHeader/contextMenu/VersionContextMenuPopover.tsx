import {type ReleaseDocument} from '@sanity/client'
import {memo, type RefObject} from 'react'

import {Popover} from '../../../../../ui-components'
import {type UseScheduledDraftMenuActionsReturn} from '../../../../singleDocRelease/hooks/useScheduledDraftMenuActions'
import {type VersionContextMenuState} from '../../../hooks/useVersionContextMenu'
import {VersionContextMenu} from './VersionContextMenu'

/**
 * @internal
 */
export interface VersionContextMenuPopoverProps {
  /** The menu state returned by `useVersionContextMenu`. */
  contextMenu: VersionContextMenuState
  /** The popover ref returned by `useVersionContextMenu`. */
  popoverRef: RefObject<HTMLDivElement | null>
  /** The element the menu popover is positioned relative to. */
  referenceElement: HTMLElement | null
  documentId: string
  documentType: string
  /** The perspective the menu acts on: 'published', 'draft', or a release ID. */
  bundleId: string
  isVersion: boolean
  releases: ReleaseDocument[]
  releasesLoading: boolean
  onDiscard: () => void
  onCreateRelease: () => void
  onCopyToDrafts: () => void
  onCopyToDraftsNavigate: () => void
  onCreateVersion: (targetRelease: string) => void
  disabled?: boolean
  locked?: boolean
  isGoingToUnpublish?: boolean
  release?: ReleaseDocument
  isScheduledDraft?: boolean
  scheduledDraftMenuActions?: UseScheduledDraftMenuActionsReturn
  /**
   * Whether the UI permits discarding versions.
   * Defaults to `true`.
   */
  isDiscardable?: boolean
  /**
   * Whether the popover should be rendered in a portal. If the trigger is
   * already contained in a portal there is no need to also make the context
   * menu a portal (and it also breaks click-outside detection).
   */
  portal?: boolean
}

/**
 * Renders the version context menu in a popover positioned where the context
 * menu was opened. Use together with `useVersionContextMenu` and
 * `VersionContextMenuDialogs`.
 *
 * @internal
 */
export const VersionContextMenuPopover = memo(function VersionContextMenuPopover(
  props: VersionContextMenuPopoverProps,
) {
  const {
    contextMenu,
    popoverRef,
    referenceElement,
    documentId,
    documentType,
    bundleId,
    isVersion,
    releases,
    releasesLoading,
    onDiscard,
    onCreateRelease,
    onCopyToDrafts,
    onCopyToDraftsNavigate,
    onCreateVersion,
    disabled = false,
    locked = false,
    isGoingToUnpublish = false,
    release,
    isScheduledDraft = false,
    scheduledDraftMenuActions,
    isDiscardable = true,
    portal = true,
  } = props

  return (
    <Popover
      animate={false}
      content={
        <VersionContextMenu
          documentId={documentId}
          releases={releases}
          releasesLoading={releasesLoading}
          fromRelease={bundleId}
          isVersion={isVersion}
          onDiscard={onDiscard}
          onCreateRelease={onCreateRelease}
          onCopyToDrafts={onCopyToDrafts}
          onCopyToDraftsNavigate={onCopyToDraftsNavigate}
          disabled={disabled}
          onCreateVersion={onCreateVersion}
          locked={locked}
          type={documentType}
          isGoingToUnpublish={isGoingToUnpublish}
          release={release}
          isScheduledDraft={isScheduledDraft}
          scheduledDraftMenuActions={scheduledDraftMenuActions}
          isDiscardable={isDiscardable}
        />
      }
      fallbackPlacements={[]}
      open={contextMenu.open}
      portal={portal}
      placement="bottom-start"
      ref={popoverRef}
      referenceElement={referenceElement}
      zOffset={10}
      style={
        contextMenu.open
          ? {transform: `translate(${contextMenu.translate.x}px, ${contextMenu.translate.y}px)`}
          : undefined
      }
    />
  )
})
