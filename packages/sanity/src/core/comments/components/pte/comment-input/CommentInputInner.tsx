import {type RenderBlockFunction} from '@portabletext/editor'
import {type CurrentUser} from '@sanity/types'
import {Box, Card, Flex, MenuDivider, Stack} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {type AvatarSize} from '@sanity/ui/theme'
import {useCallback} from 'react'
import {css, styled} from 'styled-components'

import {Button, TooltipDelayGroupProvider} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {useUser} from '../../../../store'
import {commentsLocaleNamespace} from '../../../i18n'
import {CommentsAvatar} from '../../avatars'
import {MentionIcon, SendIcon} from '../../icons'
import {Editable} from './Editable'
import {useCommentInput} from './useCommentInput'

const EditableWrap = styled(Box)`
  max-height: 20vh;
  overflow-y: auto;
`

const ButtonDivider = styled(MenuDivider)({
  height: 20,
  width: 1,
})

const RootCard = styled(Card)(({theme}) => {
  const radii = vars.radius[2]

  return css`
    border-radius: ${radii};
    box-shadow: var(--input-box-shadow);

    &:not([data-expand-on-focus='false'], :focus-within) {
      background: transparent;
      box-shadow: unset;
    }

    &[data-focused='true']:focus-within {
      ${EditableWrap} {
        min-height: 1em;
      }
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
    &:hover {
    }
  `
})

const AvatarContainer = styled.div((props) => {
  return `
    min-height: ${vars.avatar.scale[1].size};
    display: flex;
    align-items: center;
  `
})

interface CommentInputInnerProps {
  avatarSize?: AvatarSize
  currentUser: CurrentUser
  focusLock?: boolean
  onBlur?: (e: React.FormEvent<HTMLDivElement>) => void
  onFocus?: (e: React.FormEvent<HTMLDivElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<Element>) => void
  onSubmit?: () => void
  placeholder?: React.ReactNode
  renderBlock: RenderBlockFunction
  withAvatar?: boolean
}

export function CommentInputInner(props: CommentInputInnerProps) {
  const {
    avatarSize = 1,
    currentUser,
    focusLock,
    onBlur,
    onFocus,
    onKeyDown,
    onSubmit,
    placeholder,
    renderBlock,
    withAvatar,
  } = props

  const [user] = useUser(currentUser.id)
  const {
    canSubmit,
    expandOnFocus,
    focused,
    hasChanges,
    insertAtChar,
    openMentions,
    readOnly,
    mentionOptions,
  } = useCommentInput()

  const {t} = useTranslation(commentsLocaleNamespace)
  const avatar = withAvatar ? (
    <AvatarContainer>
      <CommentsAvatar user={user} size={avatarSize} />
    </AvatarContainer>
  ) : null

  const handleMentionButtonClicked = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      insertAtChar()
      openMentions()
    },
    [insertAtChar, openMentions],
  )

  return (
    <Flex align="flex-start" gap={1}>
      {avatar}

      <RootCard
        id="comment-input-root"
        data-expand-on-focus={expandOnFocus && !canSubmit ? 'true' : 'false'}
        data-focused={focused ? 'true' : 'false'}
        flex={1}
        sizing="border"
        tone={readOnly ? 'neutral' : 'default'}
      >
        <Stack>
          <EditableWrap data-ui="CommentInputEditableWrap" padding={2} sizing="border">
            <Editable
              focusLock={focusLock}
              onBlur={onBlur}
              onFocus={onFocus}
              onKeyDown={onKeyDown}
              onSubmit={onSubmit}
              placeholder={placeholder}
              renderBlock={renderBlock}
            />
          </EditableWrap>

          <Flex align="center" data-ui="CommentInputActions" gap={1} justify="flex-end" padding={1}>
            <TooltipDelayGroupProvider>
              {!mentionOptions.disabled && (
                <Button
                  aria-label={t('compose.mention-user-aria-label')}
                  data-testid="comment-input-mention-button"
                  disabled={readOnly}
                  icon={MentionIcon}
                  mode="bleed"
                  type="button"
                  onClick={handleMentionButtonClicked}
                  tooltipProps={{content: t('compose.mention-user-tooltip')}}
                />
              )}
              {onSubmit && (
                <>
                  {/* {!mentionOptions.disabled && <ButtonDivider />} */}

                  <Button
                    aria-label={t('compose.send-comment-aria-label')}
                    data-testid="comment-input-send-button"
                    disabled={!canSubmit || !hasChanges || readOnly}
                    icon={SendIcon}
                    // mode={hasChanges && canSubmit ? 'default' : 'bleed'}
                    onClick={onSubmit}
                    // tone={hasChanges && canSubmit ? 'primary' : 'default'}
                    tooltipProps={{content: t('compose.send-comment-tooltip')}}
                  />
                </>
              )}
            </TooltipDelayGroupProvider>
          </Flex>
        </Stack>
      </RootCard>
    </Flex>
  )
}
