import React, {useCallback} from 'react'
import {Flex, MenuDivider, Box, Card, Stack, TooltipDelayGroupProvider} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {CurrentUser} from '@sanity/types'
import {Button, TOOLTIP_DELAY_PROPS} from 'sanity/ui-components'
import {MentionIcon, SendIcon} from '../../icons'
import {CommentsAvatar} from '../../avatars/CommentsAvatar'
import {useCommentInput} from './useCommentInput'
import {Editable} from './Editable'
import {useUser} from 'sanity'

const EditableWrap = styled(Box)`
  max-height: 20vh;
  overflow-y: auto;
`

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

    &[data-focused='true']:focus-within {
      ${EditableWrap} {
        min-height: 1em;
      }

      box-shadow: inset 0 0 0 1px var(--card-focus-ring-color);
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
  onBlur?: (e: React.FormEvent<HTMLDivElement>) => void
  onFocus?: (e: React.FormEvent<HTMLDivElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<Element>) => void
  onSubmit: () => void
  placeholder?: React.ReactNode
  withAvatar?: boolean
}

export function CommentInputInner(props: CommentInputInnerProps) {
  const {currentUser, focusLock, onBlur, onFocus, onKeyDown, onSubmit, placeholder, withAvatar} =
    props

  const [user] = useUser(currentUser.id)
  const {canSubmit, expandOnFocus, focused, hasChanges, insertAtChar, openMentions, readOnly} =
    useCommentInput()

  const avatar = withAvatar ? <CommentsAvatar user={user} /> : null

  const handleMentionButtonClicked = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      insertAtChar()
      openMentions()
    },
    [insertAtChar, openMentions],
  )

  return (
    <Flex align="flex-start" gap={2}>
      {avatar}

      <RootCard
        data-expand-on-focus={expandOnFocus && !canSubmit ? 'true' : 'false'}
        data-focused={focused ? 'true' : 'false'}
        flex={1}
        shadow={1}
        sizing="border"
        tone={readOnly ? 'transparent' : 'default'}
      >
        <Stack>
          <EditableWrap paddingX={1} paddingY={2} sizing="border">
            <Editable
              focusLock={focusLock}
              onBlur={onBlur}
              onFocus={onFocus}
              onKeyDown={onKeyDown}
              onSubmit={onSubmit}
              placeholder={placeholder}
            />
          </EditableWrap>

          <Flex align="center" data-ui="CommentInputActions" gap={1} justify="flex-end" padding={1}>
            <TooltipDelayGroupProvider delay={TOOLTIP_DELAY_PROPS}>
              <Button
                aria-label="Mention user"
                data-testid="comment-mention-button"
                disabled={readOnly}
                icon={MentionIcon}
                mode="bleed"
                onClick={handleMentionButtonClicked}
                tooltipProps={{content: 'Mention user'}}
              />

              <ButtonDivider />

              <Button
                aria-label="Send comment"
                disabled={!canSubmit || !hasChanges || readOnly}
                icon={SendIcon}
                mode={hasChanges && canSubmit ? 'default' : 'bleed'}
                onClick={onSubmit}
                tone={hasChanges && canSubmit ? 'primary' : 'default'}
                tooltipProps={{content: 'Send comment'}}
              />
            </TooltipDelayGroupProvider>
          </Flex>
        </Stack>
      </RootCard>
    </Flex>
  )
}
