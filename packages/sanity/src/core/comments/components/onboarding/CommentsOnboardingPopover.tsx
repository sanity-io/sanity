import {Box, Flex, Stack, Text} from '@sanity/ui'

import {Button, Popover, type PopoverProps} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {commentsLocaleNamespace} from '../../i18n'
import {root, styledPopover} from './CommentsOnboardingPopover.css'

interface CommentsOnboardingPopoverProps extends Omit<PopoverProps, 'content'> {
  //   ...
  onDismiss: () => void
}

export function CommentsOnboardingPopover(props: CommentsOnboardingPopoverProps) {
  const {onDismiss, ...rest} = props
  const {t} = useTranslation(commentsLocaleNamespace)

  return (
    <Popover
      className={styledPopover}
      content={
        <Box className={root} padding={4}>
          <Stack space={3}>
            <Text weight="medium" size={1}>
              {t('onboarding.header')}
            </Text>

            <Text size={1}>{t('onboarding.body')}</Text>

            <Flex justify="flex-end" marginTop={2}>
              <Button text={t('onboarding.dismiss')} tone="primary" onClick={onDismiss} />
            </Flex>
          </Stack>
        </Box>
      }
      open
      portal
      {...rest}
    />
  )
}
