import React, {useEffect, useMemo, useState} from 'react'
import styled, {css} from 'styled-components'
import {Box, Card, Flex, Theme} from '@sanity/ui'
import {FieldPresence, FormNodePresence} from '../../../presence'
import {DocumentFieldActionNode} from '../../../config'
import {calcAvatarStackWidth} from '../../../presence/utils'
import {FieldActionMenu} from '../../field'
import {FieldCommentsProps} from '../../types'

const Root = styled(Flex)`
  /* Prevent buttons from taking up extra vertical space */
  line-height: 1;
  position: relative; /* For floating actions menu */
`

const PresenceBox = styled(Box)(({theme, $right}: {theme: Theme; $right: number}) => {
  const {space} = theme.sanity
  return css`
    position: absolute;
    bottom: 0;
    right: ${$right + space[1]}px;
  `
})

const ContentBox = styled(Box)(({
  theme,
  $presenceMaxWidth,
}: {
  theme: Theme
  $presenceMaxWidth: number
}) => {
  const {space} = theme.sanity
  return css`
    max-width: calc(100% - ${$presenceMaxWidth + space[1]}px);
    min-width: 75%;
  `
})

const SlotBox = styled(Box)(({
  theme,
  $right,
  $fieldActionsVisible,
}: {
  theme: Theme
  $right: number
  $fieldActionsVisible: boolean
}) => {
  const {space} = theme.sanity
  const right = $fieldActionsVisible ? $right + space[1] : $right
  return css`
    position: absolute;
    bottom: 0;
    right: ${right}px;
  `
})

const FieldActionsFloatingCard = styled(Card)(({theme}: {theme: Theme}) => {
  const {space} = theme.sanity
  return css`
    bottom: 0;
    gap: ${space[1] / 2}px;
    padding: ${space[1] / 2}px;
    position: absolute;
    right: 0;
  `
})

const MAX_AVATARS = 4

interface FormFieldBaseHeaderProps {
  __internal_comments?: FieldCommentsProps // DO NOT USE
  __internal_slot?: React.ReactNode // ONLY USED BY AI ASSIST PLUGIN
  actions?: DocumentFieldActionNode[]
  content: React.ReactNode
  fieldFocused: boolean
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
  } = props

  // State for if an actions menu is open
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  // States for floating card element and its width
  const [floatingCardElement, setFloatingCardElement] = useState<HTMLDivElement | null>(null)
  const [floatingCardWidth, setFloatingCardWidth] = useState<number>(0)

  // States for slot element and its width
  const [slotElement, setSlotElement] = useState<HTMLDivElement | null>(null)
  const [slotWidth, setSlotWidth] = useState<number>(0)

  // Extract comment related data with default values
  const {hasComments = false, button = null, isAddingComment = false} = comments || {}

  // Determine if actions exist and if field actions should be shown
  const hasActions = actions && actions.length > 0
  const showFieldActions = fieldFocused || fieldHovered || menuOpen || isAddingComment

  // Determine if floating card with actions should be shown
  const shouldShowFloatingCard = showFieldActions || hasComments

  // Determine the shadow level for the card
  const shadow = (showFieldActions && hasActions) || !hasComments ? 3 : undefined

  // Determine if there are no comments or actions
  const noCommentsOrActions = !comments?.button && !hasActions

  // Calculate floating card's width
  useEffect(() => {
    if (floatingCardElement) {
      const {width} = floatingCardElement.getBoundingClientRect()
      setFloatingCardWidth(width || 0)
    }
  }, [floatingCardElement, showFieldActions])

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
      <SlotBox
        $fieldActionsVisible={Boolean(showFieldActions)}
        $right={floatingCardWidth}
        ref={setSlotElement}
      >
        {slot}
      </SlotBox>
    )
  }, [floatingCardWidth, showFieldActions, slot])

  return (
    <Root align="flex-end">
      <ContentBox flex={1} paddingY={2} $presenceMaxWidth={calcAvatarStackWidth(MAX_AVATARS)}>
        {content}
      </ContentBox>

      {presence && presence.length > 0 && (
        <PresenceBox flex="none" paddingBottom={1} $right={floatingCardWidth + slotWidth}>
          <FieldPresence maxAvatars={MAX_AVATARS} presence={presence} />
        </PresenceBox>
      )}

      {slotEl}

      {shouldShowFloatingCard && !noCommentsOrActions && (
        <FieldActionsFloatingCard
          display="flex"
          radius={2}
          ref={setFloatingCardElement}
          shadow={shadow}
          sizing="border"
        >
          {showFieldActions && hasActions && (
            <FieldActionMenu nodes={actions} onMenuOpenChange={setMenuOpen} />
          )}

          {button}
        </FieldActionsFloatingCard>
      )}
    </Root>
  )
}
