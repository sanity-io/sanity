import {Box, Card, Flex} from '@sanity/ui'
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ReactNode, useCallback, useEffect, useMemo, useState} from 'react'

import {TooltipDelayGroupProvider} from '../../../../ui-components'
import {type DocumentFieldActionNode} from '../../../config'
import {FieldPresence, type FormNodePresence} from '../../../presence'
import {calcAvatarStackWidth} from '../../../presence/utils'
import {FieldActionMenu} from '../../field'
import {
  contentBox,
  contentMaxWidthVar,
  fieldActionsFloatingCard,
  fieldActionsFlex,
  presenceRightVar,
  root,
  slotBox,
  slotRightVar,
} from './FormFieldBaseHeader.css'
import {type FieldCommentsProps} from '../../types'


const MAX_AVATARS = 4

interface FormFieldBaseHeaderProps {
  __internal_comments?: FieldCommentsProps // DO NOT USE
  __internal_slot?: ReactNode // ONLY USED BY AI ASSIST PLUGIN
  actions?: DocumentFieldActionNode[]
  content: ReactNode
  fieldFocused: boolean
  inputId?: string
  fieldHovered: boolean
  presence?: FormNodePresence[]
}

export function FormFieldBaseHeader(props: FormFieldBaseHeaderProps) {
  const {
    __internal_comments: comments,
    __internal_slot: slot,
    actions,
    content,
    fieldFocused,
    fieldHovered,
    presence,
    inputId,
  } = props
  const {space} = useThemeV2()
  const [focused, setFocused] = useState<boolean>(false)
  // State for if an actions menu is open
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  // States for floating card element and its width
  const [floatingCardElement, setFloatingCardElement] = useState<HTMLDivElement | null>(null)
  const [floatingCardWidth, setFloatingCardWidth] = useState<number>(0)

  // States for slot element and its width
  const [slotElement, setSlotElement] = useState<HTMLDivElement | null>(null)
  const [slotWidth, setSlotWidth] = useState<number>(0)

  // Extract comment related data with default values
  const {
    hasComments = false,
    button: commentButton = null,
    isAddingComment = false,
  } = comments || {}
  // Determine if actions exist and if field actions should be shown
  const hasActions = actions && actions.length > 0
  const showFieldActions = fieldFocused || fieldHovered || menuOpen || isAddingComment

  // Determine if there's a comment button or actions to show.
  // We check for `comments.button` since that's the visual element that should be
  // used for comments. If no button is provided, we don't have anything to show for comments.
  const hasCommentsButtonOrActions = comments?.button || hasActions

  // Determine if floating card with actions should be shown
  const shouldShowFloatingCard = focused || showFieldActions || hasComments

  const handleSetFloatingCardElementWidth = useCallback(() => {
    if (floatingCardElement) {
      const {width} = floatingCardElement.getBoundingClientRect()
      setFloatingCardWidth(width || 0)
    }
  }, [floatingCardElement])

  // When a focus or blur event occurs on the floating card, we need to recalculate its width.
  // This is because presence should be positioned relative to the floating card.
  // We need this because we don't conditionally render the floating card and rely on CSS to
  // show/hide it, and therefore the width calculation won't be triggered when the card is shown or hidden.
  const handleFocusCapture = useCallback(() => {
    handleSetFloatingCardElementWidth()
    setFocused(true)
  }, [handleSetFloatingCardElementWidth])

  const handleBlurCapture = useCallback(() => {
    handleSetFloatingCardElementWidth()
    setFocused(false)
  }, [handleSetFloatingCardElementWidth])

  // Calculate floating card's width
  useEffect(() => {
    handleSetFloatingCardElementWidth()
  }, [handleSetFloatingCardElementWidth, showFieldActions])

  // Calculate slot element's width
  useEffect(() => {
    if (slotElement) {
      const {width} = slotElement.getBoundingClientRect()
      setSlotWidth(width || 0)
    }
  }, [slotElement])

  // Construct the slot element if slot is provided
  const slotEl = useMemo(() => {
    if (!slot) return null

    return (
      <div
        className={slotBox}
        style={assignInlineVars({
          [slotRightVar]: `${showFieldActions ? floatingCardWidth + space[1] : floatingCardWidth}px`,
        })}
        ref={setSlotElement}
      >
        {slot}
      </div>
    )
  }, [floatingCardWidth, showFieldActions, slot])

  return (
    <Flex
      align="flex-end"
      justify="space-between"
      className={root}
      style={assignInlineVars({
        [presenceRightVar]: `${slotWidth + (shouldShowFloatingCard ? floatingCardWidth : 0) + space[1]}px`,
      })}
    >
      <Box
        data-ui="fieldHeaderContentBox"
        flex={1}
        paddingY={2}
        className={contentBox}
        style={assignInlineVars({
          [contentMaxWidthVar]: `calc(100% - ${calcAvatarStackWidth(MAX_AVATARS) + space[1]}px)`,
        })}
      >
        {content}
      </Box>

      {presence && presence.length > 0 && (
        <Box data-ui="PresenceBox" flex="none">
          <FieldPresence maxAvatars={MAX_AVATARS} presence={presence} />
        </Box>
      )}

      {slotEl}

      {(hasCommentsButtonOrActions || hasComments) && (
        <TooltipDelayGroupProvider>
          <Card
            className={fieldActionsFloatingCard}
            data-actions-visible={showFieldActions ? 'true' : 'false'}
            data-has-actions={hasActions ? 'true' : 'false'}
            data-has-comments={hasComments ? 'true' : 'false'}
            data-visible={shouldShowFloatingCard ? 'true' : 'false'}
            display="flex"
            onBlurCapture={handleBlurCapture}
            onFocusCapture={handleFocusCapture}
            ref={setFloatingCardElement}
            sizing="border"
          >
            {hasActions && (
              <Flex
                align="center"
                className={fieldActionsFlex}
                data-ui="FieldActionsFlex"
                data-testid={inputId ? `field-actions-menu-${inputId}` : `field-actions-menu`}
              >
                <FieldActionMenu nodes={actions} onMenuOpenChange={setMenuOpen} />
              </Flex>
            )}

            {commentButton}
          </Card>
        </TooltipDelayGroupProvider>
      )}
    </Flex>
  )
}
