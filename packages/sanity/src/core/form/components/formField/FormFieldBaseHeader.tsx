import {Box, Card, Flex} from '@sanity/ui'
import React, {useEffect, useMemo, useState} from 'react'
import styled, {css} from 'styled-components'
import {FieldPresence, FormNodePresence} from '../../../presence'
import {DocumentFieldActionNode} from '../../../config'
import {calcAvatarStackWidth} from '../../../presence/utils'
import {FieldActionMenu} from '../../field'

const Root = styled(Flex)({
  // This prevents the buttons from taking up extra vertical space in the flex layout,
  // due to their default vertical alignment being baseline.
  lineHeight: 1,

  // This is needed for the floating actions menu
  position: 'relative',
})

const PresenceBox = styled(Box)<{$right: number}>(({theme, $right}) => {
  const {space} = theme.sanity

  return css`
    position: absolute;
    bottom: 0px;
    right: ${$right + space[1]}px;
  `
})

const ContentBox = styled(Box)<{
  $presenceMaxWidth: number
}>(({theme, $presenceMaxWidth}) => {
  const {space} = theme.sanity

  return css`
    // Limit the width to preserve space for presence avatars
    max-width: calc(100% - ${$presenceMaxWidth + space[1]}px);
    min-width: 75%;
  `
})

const SlotBox = styled(Box)<{
  $right: number
  $fieldActionsVisible: boolean
}>(({theme, $right, $fieldActionsVisible}) => {
  const {space} = theme.sanity
  const right = $fieldActionsVisible ? $right + space[1] : $right

  return css`
    position: absolute;
    bottom: 0;
    right: ${right}px;
  `
})

const FieldActionsFloatingCard = styled(Card)(({theme}) => {
  const {space} = theme.sanity

  return css`
    position: absolute;
    bottom: 0;
    right: 0;
    padding: ${space[1] / 2}px;
  `
})

const MAX_AVATARS = 4

interface FormFieldBaseHeaderProps {
  /** @internal @deprecated ONLY USED BY AI ASSIST PLUGIN */
  __internal_slot?: React.ReactNode
  actions?: DocumentFieldActionNode[]
  content: React.ReactNode
  fieldFocused: boolean
  fieldHovered: boolean
  presence?: FormNodePresence[]
}

/** @internal */
export function FormFieldBaseHeader(props: FormFieldBaseHeaderProps) {
  const {__internal_slot: slot, actions, content, presence, fieldFocused, fieldHovered} = props

  // The state refers to if a group field action menu is open
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  const [floatingCardElement, setFloatingCardElement] = useState<HTMLDivElement | null>(null)

  const [slotElement, setSlotElement] = useState<HTMLDivElement | null>(null)

  // The amount the presence box should be offset to the right
  const [floatingCardWidth, setFloatingCardWidth] = useState<number>(0)
  const [slotWidth, setSlotWidth] = useState<number>(0)

  const hasActions = actions && actions.length > 0
  const showFieldActions = hasActions && (fieldFocused || fieldHovered || menuOpen)

  const presenceMaxWidth = calcAvatarStackWidth(MAX_AVATARS)

  // Use the width of the floating card to offset the presence box
  useEffect(() => {
    if (floatingCardElement) {
      const {width} = floatingCardElement.getBoundingClientRect()
      setFloatingCardWidth(width || 0)
    }
  }, [floatingCardElement, showFieldActions])

  useEffect(() => {
    if (slotElement) {
      const {width} = slotElement.getBoundingClientRect()
      setSlotWidth(width || 0)
    }
  }, [slotElement])

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
      <ContentBox flex={1} paddingY={2} $presenceMaxWidth={presenceMaxWidth}>
        {content}
      </ContentBox>

      {presence && presence.length > 0 && (
        <PresenceBox flex="none" paddingBottom={1} $right={floatingCardWidth + slotWidth}>
          <FieldPresence maxAvatars={MAX_AVATARS} presence={presence} />
        </PresenceBox>
      )}

      {slotEl}

      {showFieldActions && (
        <FieldActionsFloatingCard
          display="flex"
          radius={2}
          ref={setFloatingCardElement}
          shadow={2}
          sizing="border"
        >
          <FieldActionMenu nodes={actions} onMenuOpenChange={setMenuOpen} />
        </FieldActionsFloatingCard>
      )}
    </Root>
  )
}
