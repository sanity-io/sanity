import {type CurrentUser} from '@sanity/types'
import {BoundaryElementProvider, Stack, useClickOutsideEvent, usePortal} from '@sanity/ui'
import {useCallback, useRef} from 'react'
import {styled} from 'styled-components'

import {Popover, type PopoverProps} from '../../../../../ui-components/popover/Popover'
import {
  CommentInput,
  type CommentInputHandle,
  type CommentInputProps,
} from '../../../components/pte/comment-input/CommentInput'
import {hasCommentMessageValue} from '../../../helpers'

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['bottom', 'top']

const RootStack = styled(Stack)`
  width: 250px;
`

interface InlineCommentInputPopoverProps {
  currentUser: CurrentUser
  mentionOptions: CommentInputProps['mentionOptions']
  onChange: CommentInputProps['onChange']
  onClickOutside: () => void
  onDiscardConfirm: CommentInputProps['onDiscardConfirm']
  onSubmit: CommentInputProps['onSubmit']
  referenceElement?: HTMLElement | null
  value: CommentInputProps['value']
}

export function InlineCommentInputPopover(props: InlineCommentInputPopoverProps) {
  const {
    currentUser,
    mentionOptions,
    onChange,
    onClickOutside,
    onDiscardConfirm,
    onSubmit,
    referenceElement,
    value,
  } = props

  const commentInputRef = useRef<CommentInputHandle | null>(null)
  const contentElementRef = useRef<HTMLDivElement | null>(null)
  const portal = usePortal()

  // Popovers opened from the composer (the mentions menu) are measured against the
  // nearest boundary element. Inherited from the field, that is the Portable Text
  // field root — a single line tall in `oneLine` fields, which left the mentions
  // menu with a max height of ~0 and collapsed it (SAPP-4093). The composer floats
  // above the field, so its popovers should use the scroll area for room instead.
  const boundaryElement = portal.elements?.documentScrollElement || null

  const handleDiscardConfirm = useCallback(() => {
    commentInputRef.current?.discardDialogController.close()
    onDiscardConfirm()
  }, [onDiscardConfirm])

  const handleDiscardCancel = useCallback(() => {
    commentInputRef.current?.discardDialogController.close()
  }, [])

  useClickOutsideEvent(
    () => {
      const hasValue = hasCommentMessageValue(value)

      if (hasValue) {
        commentInputRef.current?.discardDialogController.open()
        return
      }

      onClickOutside()
    },
    () => [contentElementRef.current],
  )

  const content = (
    <BoundaryElementProvider element={boundaryElement}>
      <RootStack padding={2} ref={contentElementRef}>
        <CommentInput
          currentUser={currentUser}
          focusLock
          focusOnMount
          mentionOptions={mentionOptions}
          onChange={onChange}
          onDiscardCancel={handleDiscardCancel}
          onDiscardConfirm={handleDiscardConfirm}
          onSubmit={onSubmit}
          ref={commentInputRef}
          value={value}
        />
      </RootStack>
    </BoundaryElementProvider>
  )

  return (
    <Popover
      content={content}
      data-ui="InlineCommentInputPopover"
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      open
      placement="bottom"
      portal
      referenceElement={referenceElement}
    />
  )
}
