import {type RenderBlockFunction} from '@portabletext/editor'
import {type CurrentUser} from '@sanity/types'
import {type AvatarSize, Flex, Stack} from '@sanity/ui'
import {useCallback} from 'react'

import {Button, TooltipDelayGroupProvider} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {useUser} from '../../../../store'
import {commentsLocaleNamespace} from '../../../i18n'
import {CommentsAvatar} from '../../avatars'
import {MentionIcon, SendIcon} from '../../icons'
import {AvatarContainer, ButtonDivider, EditableWrap, RootCard} from './CommentInputStyles'
import {Editable} from './Editable'
import {useCommentInput} from './useCommentInput'

interface CommentInputInnerProps {
  avatarSize?: AvatarSize
  currentUser: CurrentUser
  focusLock?: boolean
  onBlur?: (e: React.FormEvent<HTMLDivElement>) => void
  onFocus?: (e: React.FormEvent<HTMLDivElement>) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
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
    <Flex align="flex-start" gap={2}>
      {avatar}

      <RootCard
        id="comment-input-root"
        data-expand-on-focus={expandOnFocus && !canSubmit ? 'true' : 'false'}
        data-focused={focused ? 'true' : 'false'}
        flex={1}
        sizing="border"
        tone={readOnly ? 'transparent' : 'default'}
      >
        <Stack>
          <EditableWrap
            data-ui="CommentInputEditableWrap"
            paddingX={1}
            paddingY={2}
            sizing="border"
          >
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
                  {!mentionOptions.disabled && <ButtonDivider />}

                  <Button
                    aria-label={t('compose.send-comment-aria-label')}
                    data-testid="comment-input-send-button"
                    disabled={!canSubmit || !hasChanges || readOnly}
                    icon={SendIcon}
                    mode={hasChanges && canSubmit ? 'default' : 'bleed'}
                    onClick={onSubmit}
                    tone={hasChanges && canSubmit ? 'primary' : 'default'}
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
