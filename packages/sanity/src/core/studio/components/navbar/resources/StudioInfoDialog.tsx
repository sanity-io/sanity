import {CogIcon, GithubIcon, LaunchIcon, RefreshIcon} from '@sanity/icons'
import {SanityMonogram} from '@sanity/logos'
import {Badge, Card, Flex, Grid, Spinner, Stack, Text} from '@sanity/ui'
import {useEffect, useId} from 'react'
import semver from 'semver'
import {styled} from 'styled-components'

import {Button, Dialog, Tooltip} from '../../../../../ui-components'
import {isProd} from '../../../../environment'
import {useTranslation} from '../../../../i18n'
import {SANITY_VERSION} from '../../../../version'
import {usePackageVersionStatus} from '../../../packageVersionStatus/usePackageVersionStatus'
import {useWorkspace} from '../../../workspace'

interface StudioInfoDialogProps {
  // Note: this is coming from brett, and should be used for non auto-updating studios
  latestVersion?: string
  onClose: () => void
}

const MonogramContainer = styled(Card).attrs({
  overflow: 'hidden',
  radius: 4,
})`
  height: ${75}px;
  width: ${75}px;
`

function reload() {
  window.location.reload()
}

export function StudioInfoDialog(props: StudioInfoDialogProps) {
  const {t} = useTranslation()
  const {onClose} = props
  const dialogId = useId()
  const {projectId} = useWorkspace()

  const currentVersionParsed = semver.parse(SANITY_VERSION, {includePrerelease: true})
  const latestVersion = props.latestVersion ? semver.parse(props.latestVersion) : null

  const {isAutoUpdating, packageVersionInfo, versionCheckStatus, checkForUpdates} =
    usePackageVersionStatus()

  const isUpToDate =
    latestVersion &&
    currentVersionParsed &&
    // let prereleases that's higher than latest count as up-to-date
    currentVersionParsed.compareMain(latestVersion) >= 0

  const preids = (currentVersionParsed && semver.prerelease(currentVersionParsed)) || []

  const isPrerelease = preids.length > 0

  // Note: in theory, and in the future, there might be multiple auto-updateable packages
  // but for now, we only care about the `sanity`-package
  const sanityPkgUpdateInfo = packageVersionInfo.find((p) => p.name === 'sanity')!

  useEffect(() => {
    checkForUpdates()
    // check for updates every 10s while dialog is open
    const interval = setInterval(checkForUpdates, 10_000)
    return () => clearInterval(interval)
  }, [checkForUpdates])

  return (
    <Dialog width={0} onClickOutside={onClose} id={dialogId} padding={false}>
      {versionCheckStatus?.checking ? (
        <Flex margin={2} padding={2} style={{position: 'absolute', right: 0}}>
          <Spinner size={0} />
        </Flex>
      ) : null}

      <Stack space={3} paddingY={3}>
        <Flex align="center" justify="center" paddingY={4}>
          <MonogramContainer>
            <SanityMonogram height={75} width={75} />
          </MonogramContainer>
        </Flex>
        <Grid columns={2} gap={2}>
          <Flex justify="flex-end" align="center">
            {/* eslint-disable-next-line i18next/no-literal-string */}
            <Text as="h2" size={1} weight="semibold">
              Sanity Studio
            </Text>
          </Flex>
          <Flex justify="flex-start" align="center" gap={2}>
            <Tooltip
              content={
                isPrerelease
                  ? t('about-dialog.version-info.tooltip.prerelease')
                  : t('about-dialog.version-info.tooltip.up-to-date')
              }
            >
              <Badge tone={isPrerelease ? 'suggest' : 'neutral'} overflow="hidden">
                {currentVersionParsed
                  ? ensureVersionPrefix(currentVersionParsed.version)
                  : 'unknown'}
              </Badge>
            </Tooltip>

            {currentVersionParsed?.build?.length === 1 ? (
              <Button
                as="a"
                target="_blank"
                rel="noopener noreferrer"
                icon={GithubIcon}
                mode="bleed"
                tooltipProps={{
                  content: t('about-dialog.version-info.browse-on-github'),
                }}
                href={`https://github.com/sanity-io/sanity/tree/${currentVersionParsed.build[0]}`}
              />
            ) : null}
          </Flex>

          {isAutoUpdating ? (
            <>
              <Flex justify="flex-end" align="center">
                <Text size={1} weight="semibold">
                  {/* Note that this is not necessary a *higher* version than current, it's the new version made available for auto updates,
                   which in some cases could even be a downgrade compared to current */}
                  {t('about-dialog.version-info.new-version.text')}
                </Text>
              </Flex>
              <Flex justify="flex-start" align="center" gap={2}>
                <Badge tone={sanityPkgUpdateInfo.canUpdate ? 'primary' : 'neutral'}>
                  {ensureVersionPrefix(
                    sanityPkgUpdateInfo.canUpdate
                      ? sanityPkgUpdateInfo.available!
                      : sanityPkgUpdateInfo.current,
                  )}
                </Badge>
                {sanityPkgUpdateInfo.canUpdate ? (
                  <Button
                    onClick={reload}
                    mode="bleed"
                    tone="primary"
                    text={t('about-dialog.version-info.update-button.text')}
                    tooltipProps={{
                      content: (
                        <Text size={1}>{t('about-dialog.version-info.reload-to-update')}</Text>
                      ),
                    }}
                    icon={RefreshIcon}
                  />
                ) : null}
              </Flex>
            </>
          ) : !isUpToDate || isPrerelease ? (
            <>
              <Flex justify="flex-end" align="center">
                <Text size={1} weight="semibold">
                  {t('about-dialog.version-info.latest-version.header')}
                </Text>
              </Flex>
              <Flex justify="flex-start" align="center" gap={2}>
                <Badge tone="primary">
                  {latestVersion ? ensureVersionPrefix(latestVersion.raw) : 'unknown'}
                </Badge>
                {isPrerelease ? null : (
                  <Button
                    as="a"
                    href="https://www.sanity.io/docs/upgrade"
                    target="_blank"
                    rel="noopener noreferrer"
                    mode="bleed"
                    tooltipProps={{content: t('about-dialog.version-info.update-button.tooltip')}}
                    text={t('about-dialog.version-info.update-button.text')}
                    iconRight={LaunchIcon}
                  />
                )}
              </Flex>
            </>
          ) : null}
        </Grid>
        <Stack space={2} paddingY={3}>
          {isAutoUpdating ? (
            <Card tone="transparent" padding={2} radius={3} marginX={2}>
              <Flex align="center" justify="space-evenly" gap={2}>
                <Text size={1} muted>
                  {t('about-dialog.version-info.auto-updates.enabled')}
                </Text>
                <Button
                  as="a"
                  href={`https://sanity.io/manage/project/${projectId}/studios?manage=${'TODO'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  mode="ghost"
                  text={t('about-dialog.version-info.auto-updates.manage-version')}
                  icon={CogIcon}
                />
              </Flex>
            </Card>
          ) : isProd ? (
            // note: in dev we currently can't tell if auto updates is enabled or not,
            // so instead of showing misleading info, we just don't show anything
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
          ) : null}
        </Stack>

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
