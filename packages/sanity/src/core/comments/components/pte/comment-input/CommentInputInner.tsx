import {type CurrentUser} from '@sanity/types'
import {type AvatarSize, Card, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {MenuDivider} from '@sanity/ui/menu'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useCallback} from 'react'
import {Box, Flex, VStack} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {TooltipDelayGroupProvider} from '../../../../../ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useUser} from '../../../../store/user/hooks'
import {commentsLocaleNamespace} from '../../../i18n'
import {CommentsAvatar} from '../../avatars/CommentsAvatar'
import {MentionIcon} from '../../icons/MentionIcon'
import {SendIcon} from '../../icons/SendIcon'
import {type CommentInputRenderBlock} from './CommentInput'
import {
  avatarContainer,
  avatarSize1Var,
  buttonDivider,
  commentInputActions,
  editableWrap,
  inputBorderWidthVar,
  inputEnabledBorderColorVar,
  inputHoveredBorderColorVar,
  radius2Var,
  rootCard,
} from './CommentInputInner.css'
import {Editable} from './Editable'
import {useCommentInput} from './useCommentInput'

interface CommentInputInnerProps {
  avatarSize?: AvatarSize
  currentUser: CurrentUser
  focusLock?: boolean
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  onBlur?: (e: React.FormEvent<HTMLDivElement>) => void
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  onFocus?: (e: React.FormEvent<HTMLDivElement>) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  onSubmit?: () => void
  placeholder?: React.ReactNode
  renderBlock: CommentInputRenderBlock
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
  const {avatar: avatarTheme, color, input, radius} = useThemeV2()
  const avatarSize1 = avatarTheme.sizes[1]?.size
  const avatar = withAvatar ? (
    <div
      className={avatarContainer}
      style={assignInlineVars({
        [avatarSize1Var]: avatarSize1 === undefined ? undefined : `${avatarSize1}px`,
      })}
    >
      <CommentsAvatar user={user} size={avatarSize} />
    </div>
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
    <Flex alignItems="flex-start" gap={2}>
      {avatar}

      <Card
        id="comment-input-root"
        className={rootCard}
        data-expand-on-focus={expandOnFocus && !canSubmit ? 'true' : 'false'}
        data-focused={focused ? 'true' : 'false'}
        flex={1}
        sizing="border"
        style={assignInlineVars({
          [radius2Var]: `${radius[2]}px`,
          [inputBorderWidthVar]: `${input.border.width}px`,
          [inputEnabledBorderColorVar]: color.input.default.enabled.border,
          [inputHoveredBorderColorVar]: color.input.default.hovered.border,
        })}
        tone={readOnly ? 'transparent' : 'default'}
      >
        <VStack>
          <Box
            className={editableWrap}
            data-ui="CommentInputEditableWrap"
            paddingX={1}
            paddingY={2}
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
          </Box>

          <Flex
            alignItems="center"
            className={commentInputActions}
            data-ui="CommentInputActions"
            gap={1}
            justifyContent="flex-end"
            padding={1}
          >
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
                  {!mentionOptions.disabled && <MenuDivider className={buttonDivider} />}

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
        </VStack>
      </Card>
    </Flex>
  )
}
