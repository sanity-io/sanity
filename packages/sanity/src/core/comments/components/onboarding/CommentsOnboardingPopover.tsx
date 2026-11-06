import {Text, Box, Flex, VStack} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {Popover, type PopoverProps} from '../../../../ui-components/popover/Popover'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
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
          <VStack gap={3}>
            <Text weight="medium" size={1} as="div" trim={true}>
              {t('onboarding.header')}
            </Text>

            <Text size={1} as="div" trim={true}>
              {t('onboarding.body')}
            </Text>

            <Flex justifyContent="flex-end" marginTop={2}>
              <Button text={t('onboarding.dismiss')} tone="primary" onClick={onDismiss} />
            </Flex>
          </VStack>
        </Box>
      }
      open
      portal
      {...rest}
    />
  )
}
