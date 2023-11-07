import React, {useEffect, useMemo, useState} from 'react'
import styled, {css, keyframes} from 'styled-components'
import {Box, Card, Flex, Theme} from '@sanity/ui'
import {FieldPresence, FormNodePresence} from '../../../presence'
import {DocumentFieldActionNode} from '../../../config'
import {calcAvatarStackWidth} from '../../../presence/utils'
import {FieldActionMenu} from '../../field'
import {FieldCommentsProps} from '../../types'

const fadeInKeyFrame = keyframes`
  from {
    opacity: 0;
    pointer-events: none;
  }
  to {
    opacity: 1;
    pointer-events: auto;
  }
`

const Root = styled(Flex)`
  /* Prevent buttons from taking up extra vertical space */
  line-height: 1;
  /* For floating actions menu */
  position: relative;
`

const PresenceBox = styled(Box)<{$right: number}>(({theme, $right}) => {
  const {space} = theme.sanity
  return css`
    position: absolute;
    bottom: 0;
    right: ${$right + space[1]}px;
  `
})

const ContentBox = styled(Box)<{
  $presenceMaxWidth: number
}>(({theme, $presenceMaxWidth}) => {
  const {space} = theme.sanity
  return css`
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

const FADE_IN_DURATION_MS = 200
const FADE_IN_DELAY_MS = 300

const FieldActionsFloatingCard = styled(Card)(({theme}: {theme: Theme}) => {
  const {space} = theme.sanity
  return css`
    align-items: center;
    bottom: 0;
    gap: ${space[1] / 2}px;
    padding: ${space[1] / 2}px;
    position: absolute;
    right: 0;

    // Hide/show the floating card only if hover is supported (ie not on touch devices)
    @media (hover: hover) {
      opacity: 0;
      pointer-events: none;

      &[data-actions-visible='false']:not(:focus-within) {
        // Remove the shadow when the field actions are not visible
        box-shadow: none;
        // The field actions will always be present in the DOM – which leads to that the
        // width of the floating card will be affected by the width of the field actions
        // even if the field actions are not visible. To avoid this, we set the background of
        // the floating card to transparent when the field actions are not visible to.
        background: transparent;
      }

      &[data-visible='true'] {
        &[data-delayed='true'] {
          animation: ${fadeInKeyFrame} ${FADE_IN_DURATION_MS}ms ${FADE_IN_DELAY_MS}ms forwards;
        }

        &[data-delayed='false'] {
          opacity: 1;
          pointer-events: auto;
        }
      }

      &:focus-within {
        opacity: 1;

        [data-ui='FieldActionsFlex'] {
          opacity: 1;
        }
      }
    }
  `
})

const FieldActionsFlex = styled(Flex)`
  // Inherit the gap from the parent (FieldActionsFloatingCard)
  gap: inherit;

  // Hide/show the floating card only if hover is supported (ie not on touch devices)
  @media (hover: hover) {
    opacity: 0;

    &[data-visible='true'] {
      opacity: 1;
    }
  }
`

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

      {(hasCommentsButtonOrActions || hasComments) && (
        <FieldActionsFloatingCard
          data-actions-visible={showFieldActions ? 'true' : 'false'}
          data-delayed={fieldFocused || isAddingComment || menuOpen ? 'false' : 'true'}
          data-visible={showFieldActions || hasComments ? 'true' : 'false'}
          display="flex"
          radius={2}
          ref={setFloatingCardElement}
          shadow={2}
          sizing="border"
        >
          {hasActions && (
            <FieldActionsFlex
              align="center"
              data-ui="FieldActionsFlex"
              data-visible={showFieldActions ? 'true' : 'false'}
            >
              <FieldActionMenu nodes={actions} onMenuOpenChange={setMenuOpen} />
            </FieldActionsFlex>
          )}

          {commentButton}
        </FieldActionsFloatingCard>
      )}
    </Root>
  )
}
