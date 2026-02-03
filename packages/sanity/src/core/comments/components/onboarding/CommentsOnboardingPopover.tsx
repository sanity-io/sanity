import {Box, Flex, Stack, Text} from '@sanity/ui'
import {keyframes, styled} from 'styled-components'

import {Button, Popover, type PopoverProps} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {commentsLocaleNamespace} from '../../i18n'

const Root = styled(Box)`
  max-width: 280px;
`

const fadeInKeyFrame = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`

const StyledPopover = styled(Popover)`
  opacity: 0;
  // Fade in the popover after 500ms
  animation: ${fadeInKeyFrame} 200ms 500ms forwards;
`

interface CommentsOnboardingPopoverProps extends Omit<PopoverProps, 'content'> {
  //   ...
  onDismiss: () => void
}

export function CommentsOnboardingPopover(props: CommentsOnboardingPopoverProps) {
  const {onDismiss, ...rest} = props
  const {t} = useTranslation(commentsLocaleNamespace)

  return (
    <StyledPopover
      content={
        <Root padding={4}>
          <Stack space={3}>
            <Text weight="medium" size={1}>
              {t('onboarding.header')}
            </Text>

            <Text size={1}>{t('onboarding.body')}</Text>

            <Flex justify="flex-end" marginTop={2}>
              <Button text={t('onboarding.dismiss')} tone="primary" onClick={onDismiss} />
            </Flex>
          </Stack>
        </Root>
      }
      open
      portal
      {...rest}
    />
  )
}
