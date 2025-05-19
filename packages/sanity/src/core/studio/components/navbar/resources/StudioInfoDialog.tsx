import {LaunchIcon} from '@sanity/icons'
import {SanityMonogram} from '@sanity/logos'
import {Badge, Card, Flex, Stack, Text} from '@sanity/ui'
import {useId} from 'react'
import {styled} from 'styled-components'

import {Button, Dialog, Tooltip} from '../../../../../ui-components'
import {isDev} from '../../../../environment'
import {hasSanityPackageInImportMap} from '../../../../environment/hasSanityPackageInImportMap'
import {useTranslation} from '../../../../i18n'

interface AboutDialogProps {
  latestVersion: string
  currentVersion?: string
  onClose: () => void
}

const MonogramContainer = styled(Card).attrs({
  overflow: 'hidden',
  radius: 4,
})`
  height: ${75}px;
  width: ${75}px;
`

export function StudioInfoDialog(props: AboutDialogProps) {
  const {t} = useTranslation()

  const {onClose} = props

  const latestVersion = ensureVersionPrefix(props.latestVersion)
  const currentVersion = props.currentVersion && ensureVersionPrefix(props.currentVersion)
  const aboutDialogId = useId()

  const isAutoUpdating = hasSanityPackageInImportMap()
  const isUpToDate = latestVersion === removeSuffix(currentVersion || '', '-development')

  return (
    <Dialog
      width={isUpToDate && (isAutoUpdating || isDev) ? 0 : 1}
      onClickOutside={onClose}
      id={aboutDialogId}
    >
      <Stack space={4}>
        <Flex align="center" justify="center">
          <MonogramContainer>
            <SanityMonogram height={75} width={75} />
          </MonogramContainer>
        </Flex>
        <Flex align="center" justify="center" gap={3}>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Text as="h2" size={1} weight="semibold">
            Sanity Studio
          </Text>
          <Tooltip
            content={
              isUpToDate
                ? t('about-dialog.version-info.up-to-date')
                : t('about-dialog.version-info.latest-version.text', {
                    latestVersion: latestVersion,
                  })
            }
          >
            <Badge tone={isUpToDate ? 'neutral' : 'caution'} overflow="hidden">
              {latestVersion}
            </Badge>
          </Tooltip>
          {isUpToDate ? null : (
            <Button
              as="a"
              href="https://www.sanity.io/docs/upgrade"
              target="_blank"
              rel="noopener noreferrer"
              mode="bleed"
              text={t('about-dialog.version-info.how-to-upgrade')}
              iconRight={LaunchIcon}
            />
          )}
        </Flex>
        {isUpToDate ? null : (
          <Flex align="center" justify="center" gap={3}>
            <Text size={1} weight="semibold">
              {t('about-dialog.version-info.latest-version.text')}
            </Text>
            <Badge>{latestVersion}</Badge>
          </Flex>
        )}
        {isAutoUpdating || isDev ? null : (
          <Card tone="transparent" padding={4} radius={3}>
            <Flex align="center" justify="center" gap={3}>
              <Text size={1} muted>
                {t('about-dialog.version-info.auto-updates.disabled')}
              </Text>
              <Button
                as="a"
                href="https://www.sanity.io/docs/auto-updating-studios"
                target="_blank"
                rel="noopener noreferrer"
                mode="ghost"
                text={t('about-dialog.version-info.auto-updates.how-to-enable')}
                iconRight={LaunchIcon}
              />
            </Flex>
          </Card>
        )}
        <Button tone="primary" text="OK" paddingY={3} onClick={onClose} />
      </Stack>
    </Dialog>
  )
}

function removeSuffix(str: string, suffix: string) {
  return str.endsWith(suffix) ? str.slice(0, -suffix.length) : str
}

function ensureVersionPrefix(str: string) {
  return str.startsWith('v') ? str : `v${str}`
}
