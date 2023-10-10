import React, {useCallback, useState} from 'react'
import {Flex, Button, MenuDivider, Box, Card, Stack} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {CurrentUser} from '@sanity/types'
import {CloseIcon} from '@sanity/icons'
import {MentionIcon, SendIcon} from '../../icons'
import {CommentsAvatar} from '../../avatars/CommentsAvatar'
import {useCommentInput} from './useCommentInput'
import {Editable} from './Editable'
import {useUser} from 'sanity'

const EditableWrap = styled(Box)({
  // ...
})

const ButtonDivider = styled(MenuDivider)({
  height: 20,
  width: 1,
})

const ActionButton = styled(Button).attrs({
  fontSize: 1,
  padding: 2,
})`
  /* border-radius: 50%; */
`

const RootCard = styled(Card)(({theme}) => {
  const radii = theme.sanity.radius[2]

  return css`
    border-radius: ${radii}px;

    &:not([data-expand-on-focus='false'], :focus-within) {
      background: transparent;
      box-shadow: unset;
    }

    &[data-focused='true']:focus-within {
      ${EditableWrap} {
        min-height: 1em;
      }

      box-shadow:
        inset 0 0 0 1px var(--card-border-color),
        0 0 0 1px var(--card-bg-color),
        0 0 0 3px var(--card-focus-ring-color);
    }

    &:focus-within {
      ${EditableWrap} {
        min-height: 1em;
      }
    }

    &[data-expand-on-focus='false'] {
      ${EditableWrap} {
        min-height: 1em;
      }
    }

    &[data-expand-on-focus='true'] {
      [data-ui='CommentInputActions']:not([hidden]) {
        display: none;
      }

      &:focus-within {
        [data-ui='CommentInputActions'] {
          display: flex;
        }
      }
    }
  `
})

interface CommentInputInnerProps {
  currentUser: CurrentUser
  focusLock?: boolean
  onEditDiscard: () => void
  onSubmit: () => void
  placeholder?: string
  withAvatar?: boolean
}

export function CommentInputInner(props: CommentInputInnerProps) {
  const {currentUser, onSubmit, onEditDiscard, placeholder, withAvatar, focusLock} = props
  const [discardButtonElement, setDiscardButtonElement] = useState<HTMLButtonElement | null>(null)

  const [user] = useUser(currentUser.id)
  const {openMentions, focused, expandOnFocus, canSubmit, hasChanges, insertAtChar} =
    useCommentInput()

  const avatar = withAvatar ? <CommentsAvatar user={user} /> : null

  const handleDiscardEdit = useCallback(() => {
    onEditDiscard()
    discardButtonElement?.blur()
  }, [discardButtonElement, onEditDiscard])

  const handleMentionButtonClicked = useCallback(() => {
    insertAtChar()
    openMentions()
  }, [insertAtChar, openMentions])

  return (
    <Flex align="flex-start" gap={2}>
      {avatar}

      <RootCard
        data-expand-on-focus={expandOnFocus && !canSubmit ? 'true' : 'false'}
        data-focused={focused ? 'true' : 'false'}
        flex={1}
        paddingX={1}
        paddingY={2}
        paddingBottom={1}
        sizing="border"
        tone="default"
        shadow={1}
      >
        <Stack space={2}>
          <EditableWrap sizing="border">
            <Editable placeholder={placeholder} focusLock={focusLock} />
          </EditableWrap>

          <Flex align="center" gap={1} justify="flex-end" data-ui="CommentInputActions">
            <ActionButton
              aria-label="Mention user"
              icon={MentionIcon}
              mode="bleed"
              onClick={handleMentionButtonClicked}
            />

            <ButtonDivider />

            <ActionButton
              aria-label="Discard edit"
              icon={CloseIcon}
              mode="bleed"
              onClick={handleDiscardEdit}
              ref={setDiscardButtonElement}
            />

            <ActionButton
              aria-label="Send comment"
              disabled={!canSubmit || !hasChanges}
              icon={SendIcon}
              mode={hasChanges && canSubmit ? 'default' : 'bleed'}
              onClick={onSubmit}
              tone={hasChanges && canSubmit ? 'primary' : 'default'}
            />
          </Flex>
        </Stack>
      </RootCard>
    </Flex>
  )
}
