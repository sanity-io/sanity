import {Box, Card, Flex, Theme} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
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

const PresenceBox = styled(Box)(({theme, $right}: {theme: Theme; $right: number}) => {
  const {space} = theme.sanity

  return css`
    position: absolute;
    // Visually align presence vertically with field actions
    bottom: 2px;
    right: ${$right + space[1]}px;
  `
})

const ContentBox = styled(Box)(
  ({theme, $presenceMaxWidth}: {theme: Theme; $presenceMaxWidth: number}) => {
    const {space} = theme.sanity

    return css`
      // Limit the width to preserve space for presence avatars
      max-width: calc(100% - ${$presenceMaxWidth + space[1]}px);
      min-width: 75%;
    `
  }
)

const FieldActionsFloatingCard = styled(Card)`
  position: absolute;
  bottom: 0;
  right: 0;
`

const MAX_AVATARS = 4

interface FormFieldBaseHeaderProps {
  actions?: DocumentFieldActionNode[]
  content: React.ReactNode
  fieldFocused: boolean
  fieldHovered: boolean
  presence?: FormNodePresence[]
}

/** @internal */
export function FormFieldBaseHeader(props: FormFieldBaseHeaderProps) {
  const {actions, content, presence, fieldFocused, fieldHovered} = props

  // The state refers to if a group field action menu is open
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  const [floatingCardElement, setFloatingCardElement] = useState<HTMLDivElement | null>(null)

  // The amount the presence box should be offset to the right
  const [floatingCardWidth, setFloatingCardWidth] = useState<number>(0)

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

  return (
    <Root align="flex-end">
      <ContentBox flex={1} paddingY={2} $presenceMaxWidth={presenceMaxWidth}>
        {content}
      </ContentBox>

      {presence && presence.length > 0 && (
        <PresenceBox flex="none" paddingBottom={1} $right={floatingCardWidth}>
          <FieldPresence maxAvatars={MAX_AVATARS} presence={presence} />
        </PresenceBox>
      )}

      {showFieldActions && (
        <FieldActionsFloatingCard
          display="flex"
          padding={1}
          radius={2}
          ref={setFloatingCardElement}
          shadow={3}
          sizing="border"
        >
          <FieldActionMenu nodes={actions} onMenuOpenChange={setMenuOpen} />
        </FieldActionsFloatingCard>
      )}
    </Root>
  )
}
