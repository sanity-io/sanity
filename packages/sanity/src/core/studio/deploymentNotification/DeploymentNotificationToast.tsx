import {RefreshIcon} from '@sanity/icons'
import {Box, Flex, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useRef} from 'react'

import {Button} from '../../../ui-components'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useDeploymentNotification} from './useDeploymentNotification'

/**
 * Component that displays a toast notification when a new deployment is detected
 * @internal
 */
export function DeploymentNotificationToast() {
  const {t} = useTranslation()
  const {hasNewDeployment} = useDeploymentNotification()
  const {push: pushToast} = useToast()
  const hasShownToastRef = useRef(false)

  const handleReload = useCallback(() => {
    window.location.reload()
  }, [])

  useEffect(() => {
    // Only show toast once when deployment changes
    if (hasNewDeployment && !hasShownToastRef.current) {
      hasShownToastRef.current = true

      pushToast({
        status: 'info',
        title: t('deployment-notifier.title'),
        closable: true,
        duration: +Infinity,
        description: (
          <Stack space={3}>
            <Text size={1}>{t('deployment-notifier.description')}</Text>
            <Box>
              <Flex justify="flex-end">
                <Button
                  icon={RefreshIcon}
                  mode="ghost"
                  onClick={handleReload}
                  text={t('deployment-notifier.reload')}
                  tone="primary"
                />
              </Flex>
            </Box>
          </Stack>
        ),
      })
    }
  }, [t, hasNewDeployment, pushToast, handleReload])

  return null
}
