import {ChevronDownIcon, ChevronUpIcon, InfoOutlineIcon} from '@sanity/icons'
import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button,
  Card,
  Flex,
  Stack,
  Text,
} from '@sanity/ui'
import {useCallback, useId, useState} from 'react'

import {Dialog} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {createLocaleNamespace} from '../i18n'

export function CreateLinkingDialog() {
  const {t} = useTranslation(createLocaleNamespace)
  const id = useId()

  const [troubleshootingOpen, setTroubleshootingOpen] = useState(false)

  const handleToggleTroubleshooting = useCallback(() => {
    setTroubleshootingOpen((prev) => !prev)
  }, [])

  return (
    <Dialog header={t('linking-in-progress-dialog.header')} id={id} width={0}>
      <Stack space={4}>
        <Text size={1} weight="semibold">
          {t('linking-in-progress-dialog.lede')}
        </Text>
        <Text size={1}>{t('linking-in-progress-dialog.details')}</Text>
        <Card border marginTop={2} padding={1} radius={2} tone="caution">
          <Stack space={2}>
            <Button
              mode="bleed"
              onClick={handleToggleTroubleshooting}
              padding={2}
              tone="caution"
              width="fill"
            >
              <Flex align="center" flex={1} justify="space-between">
                <Flex align="center" gap={2}>
                  <Text size={0} weight="medium">
                    <InfoOutlineIcon />
                  </Text>
                  <Text size={1} weight="medium">
                    {t('linking-in-progress-dialog.troubleshooting.button.title')}
                  </Text>
                </Flex>
                <Text size={1} weight="medium">
                  {troubleshootingOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </Text>
              </Flex>
            </Button>
            {troubleshootingOpen && (
              <Box padding={2}>
                <Text muted size={1}>
                  {t('linking-in-progress-dialog.troubleshooting.content')}
                </Text>
              </Box>
            )}
          </Stack>
        </Card>
      </Stack>
    </Dialog>
  )
}
