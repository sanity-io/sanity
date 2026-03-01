import {type CurrentUser} from '@sanity/types'
import {type AvatarSize, Box, Flex, Stack, Text} from '@sanity/ui'
import {type ReactNode} from 'react'

import {Button, TooltipDelayGroupProvider} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {useUser} from '../../../../store'
import {commentsLocaleNamespace} from '../../../i18n'
import {CommentsAvatar} from '../../avatars'
import {MentionIcon, SendIcon} from '../../icons'
import {AvatarContainer, ButtonDivider, EditableWrap, RootCard} from './CommentInputStyles'

interface CommentInputPlaceholderProps {
  avatarSize?: AvatarSize
  currentUser: CurrentUser
  onSubmit?: () => void
  placeholder?: ReactNode
  withAvatar?: boolean
}

export function CommentInputPlaceholder(props: CommentInputPlaceholderProps) {
  const {avatarSize = 1, currentUser, onSubmit, placeholder, withAvatar = true} = props

  const [user] = useUser(currentUser.id)
  const {t} = useTranslation(commentsLocaleNamespace)

  const avatar = withAvatar ? (
    <AvatarContainer>
      <CommentsAvatar user={user} size={avatarSize} />
    </AvatarContainer>
  ) : null

  return (
    <Flex align="flex-start" gap={2}>
      {avatar}

      <RootCard
        data-expand-on-focus="false"
        data-focused="false"
        flex={1}
        sizing="border"
        tone="default"
      >
        <Stack>
          <EditableWrap
            data-ui="CommentInputEditableWrap"
            paddingX={1}
            paddingY={2}
            sizing="border"
          >
            <Box padding={2}>
              <Text muted size={1}>
                {t('compose.loading')}
              </Text>
            </Box>
          </EditableWrap>

          <Flex align="center" data-ui="CommentInputActions" gap={1} justify="flex-end" padding={1}>
            <TooltipDelayGroupProvider>
              <Button
                aria-label={t('compose.mention-user-aria-label')}
                disabled
                icon={MentionIcon}
                mode="bleed"
                type="button"
                tooltipProps={{content: t('compose.mention-user-tooltip')}}
              />
              {onSubmit && (
                <>
                  <ButtonDivider />
                  <Button
                    aria-label={t('compose.send-comment-aria-label')}
                    disabled
                    icon={SendIcon}
                    mode="bleed"
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
