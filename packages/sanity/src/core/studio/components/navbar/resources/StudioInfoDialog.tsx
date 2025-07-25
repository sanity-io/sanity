import {LaunchIcon} from '@sanity/icons'
import {SanityMonogram} from '@sanity/logos'
import {Badge, Card, Flex, Stack, Text} from '@sanity/ui'
import {useId} from 'react'
import {coerce, parse, prerelease} from 'semver'
import {styled} from 'styled-components'

import {Button, Dialog, Tooltip} from '../../../../../ui-components'
import {isProd} from '../../../../environment'
import {hasSanityPackageInImportMap} from '../../../../environment/hasSanityPackageInImportMap'
import {useTranslation} from '../../../../i18n'

interface StudioInfoDialogProps {
  latestVersion?: string
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

export function StudioInfoDialog(props: StudioInfoDialogProps) {
  const {t} = useTranslation()
  const {onClose} = props
  const dialogId = useId()

  const currentVersionParsed = props.currentVersion ? parse(props.currentVersion) : null

  const currentVersionCoerced = (props.currentVersion && coerce(props.currentVersion)) || null
  const latestVersionCoerced = (props.latestVersion && coerce(props.latestVersion)) || null

  const isAutoUpdating = hasSanityPackageInImportMap()

  const isUpToDate =
    latestVersionCoerced &&
    currentVersionCoerced &&
    // let prereleases / ahead-of-latest count as up-to-date
    currentVersionCoerced.compare(latestVersionCoerced) >= 0

  const preids = (currentVersionParsed && prerelease(currentVersionParsed)) || []

  const isPrerelease = preids.length > 0
  return (
    <Dialog width={0} onClickOutside={onClose} id={dialogId} padding={false}>
      <Stack space={4} paddingY={3}>
        <Flex align="center" justify="center" paddingY={4}>
          <MonogramContainer>
            <SanityMonogram height={75} width={75} />
          </MonogramContainer>
        </Flex>
        <Flex align="center" justify="center" gap={2}>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Text as="h2" size={1} weight="semibold">
            Sanity Studio
          </Text>
          <Tooltip
            content={
              isUpToDate
                ? isPrerelease
                  ? t('about-dialog.version-info.tooltip.prerelease')
                  : t('about-dialog.version-info.tooltip.up-to-date')
                : t('about-dialog.version-info.tooltip.new-version-available')
            }
          >
            <Badge
              tone={isUpToDate ? (isPrerelease ? 'suggest' : 'neutral') : 'caution'}
              overflow="hidden"
            >
              {currentVersionParsed ? ensureVersionPrefix(currentVersionParsed.raw) : 'unknown'}
            </Badge>
          </Tooltip>
        </Flex>
        {!isUpToDate || isPrerelease ? (
          <Flex align="center" justify="center" gap={2}>
            <Text size={1} weight="semibold">
              {t('about-dialog.version-info.latest-version.text')}
            </Text>
            <Badge>
              {latestVersionCoerced ? ensureVersionPrefix(latestVersionCoerced.raw) : 'unknown'}
            </Badge>
            {isPrerelease ? null : (
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
        ) : null}
        {
          // note: in dev we currently don't know whether auto updates is enabled
          //  so instead of showing misleading info, we just don't show anything here
          isProd && !isAutoUpdating ? (
            <Card tone="transparent" padding={2} radius={3} marginX={2}>
              <Flex align="center" justify="space-evenly" gap={2}>
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
          ) : null
        }

        <Stack paddingX={3}>
          <Button tone="primary" text="OK" paddingY={3} onClick={onClose} />
        </Stack>
      </Stack>
    </Dialog>
  )
}

function ensureVersionPrefix(str: string) {
  return str.startsWith('v') ? str : `v${str}`
}
