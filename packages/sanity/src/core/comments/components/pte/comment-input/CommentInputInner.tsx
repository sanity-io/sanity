import React, {useCallback, useRef, useState} from 'react'
import {Avatar, Flex, Button, MenuDivider, Box, Card, Stack} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {CurrentUser} from '@sanity/types'
import {ArrowUpIcon, CloseIcon} from '@sanity/icons'
import {useUser} from '../../../../store'
import {UserAvatar} from '../../../../components'
import {MentionIcon} from '../../icons'
import {useCommentInput} from './useCommentInput'
import {Editable} from './Editable'

const EditableWrap = styled(Box)({
  // ...
})

const ButtonDivider = styled(MenuDivider)({
  height: 20,
  width: 1,
})

const RootCard = styled(Card)(({theme}) => {
  const radii = theme.sanity.radius[2]

  return css`
    border-radius: ${radii}px;

    &:not([data-expand-on-focus='false'], :focus-within) {
      background: transparent;
      box-shadow: unset;
    }

    &[data-focused='true'] {
      ${EditableWrap} {
        min-height: 2em;
      }

      box-shadow:
        inset 0 0 0 1px var(--card-border-color),
        0 0 0 1px var(--card-bg-color),
        0 0 0 3px var(--card-focus-ring-color);
    }

    &:focus-within {
      ${EditableWrap} {
        min-height: 2em;
      }
    }

    &[data-expand-on-focus='false'] {
      ${EditableWrap} {
        min-height: 2em;
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
  const {openMentions, focused, expandOnFocus, canSubmit, hasChanges} = useCommentInput()

  const avatar = user ? <UserAvatar size={0} user={user} /> : <Avatar size={0} />

  const handleDiscardEdit = useCallback(() => {
    onEditDiscard()
    discardButtonElement?.blur()
  }, [discardButtonElement, onEditDiscard])

  return (
    <Flex align="flex-start" gap={1}>
      {withAvatar ? avatar : null}

      <RootCard
        data-expand-on-focus={expandOnFocus && !canSubmit ? 'true' : 'false'}
        data-focused={focused ? 'true' : 'false'}
        flex={1}
        padding={2}
        paddingBottom={1}
        sizing="border"
        tone="default"
        shadow={1}
      >
        <Stack space={3}>
          <EditableWrap sizing="border">
            <Editable placeholder={placeholder} focusLock={focusLock} />
          </EditableWrap>

          <Flex align="center" gap={1} justify="flex-end" data-ui="CommentInputActions">
            <Button
              aria-label="Mention user"
              fontSize={1}
              icon={MentionIcon}
              mode="bleed"
              onClick={openMentions}
              padding={2}
            />

            <ButtonDivider />

            <Button
              aria-label="Discard edit"
              fontSize={1}
              icon={CloseIcon}
              mode="bleed"
              onClick={handleDiscardEdit}
              padding={2}
              ref={setDiscardButtonElement}
            />

            <Button
              aria-label="Send comment"
              disabled={!canSubmit || !hasChanges}
              fontSize={1}
              icon={ArrowUpIcon}
              mode={hasChanges && canSubmit ? 'default' : 'bleed'}
              onClick={onSubmit}
              padding={2}
              tone={hasChanges && canSubmit ? 'primary' : 'default'}
            />
          </Flex>
        </Stack>
      </RootCard>
    </Flex>
  )
}
