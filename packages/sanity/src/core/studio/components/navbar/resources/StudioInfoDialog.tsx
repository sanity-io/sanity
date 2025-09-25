import {CogIcon, GithubIcon, LaunchIcon, RefreshIcon, WarningOutlineIcon} from '@sanity/icons'
import {SanityMonogram} from '@sanity/logos'
import {Badge, Card, Flex, Grid, Spinner, Stack, Text} from '@sanity/ui'
import {useEffect, useId} from 'react'
import semver, {type SemVer} from 'semver'
import {styled} from 'styled-components'

import {Button, Dialog, Tooltip} from '../../../../../ui-components'
import {TextWithTone} from '../../../../components'
import {isProd} from '../../../../environment'
import {Translate, useTranslation} from '../../../../i18n'
import {useEnvAwareSanityWebsiteUrl} from '../../../hooks/useEnvAwareSanityWebsiteUrl'
import {usePackageVersionStatus} from '../../../packageVersionStatus/usePackageVersionStatus'
import {useWorkspace} from '../../../workspace'

interface StudioInfoDialogProps {
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

function isPrerelease(ver: SemVer) {
  return ver.prerelease.length > 0
}

const HEX_ONLY = /^[0-9a-fA-F]+$/i
function resolveGithubURLFromVersion(ver: SemVer) {
  const preids = ver.prerelease
  if (preids.length === 0) {
    return `https://github.com/sanity-io/sanity/releases/tag/v${ver.version}`
  }
  const isPR = preids[0] === 'pr' && typeof preids[1] === 'number'
  if (isPR) {
    return `https://github.com/sanity-io/sanity/pull/${preids[1]}`
  }
  const isNextWithCommitHash =
    preids[0] === 'next' && ver.build.length === 1 && HEX_ONLY.test(ver.build[0])
  if (isNextWithCommitHash) {
    return `https://github.com/sanity-io/sanity/tree/${ver.build[0]}`
  }
  return undefined
}
export function StudioInfoDialog(props: StudioInfoDialogProps) {
  const {t} = useTranslation()
  const {onClose} = props
  const dialogId = useId()
  const {projectId} = useWorkspace()

  const {
    isAutoUpdating,
    autoUpdatingVersion,
    currentVersion,
    importMapInfo,
    latestTaggedVersion,
    versionCheckStatus,
    checkForUpdates,
  } = usePackageVersionStatus()

  const isUpToDate =
    latestTaggedVersion &&
    currentVersion &&
    // let prereleases that's higher than latest count as up-to-date
    currentVersion.compareMain(latestTaggedVersion) >= 0

  const currentVersionIsPrerelease = currentVersion && isPrerelease(currentVersion)

  const newAutoUpdateVersionAvailable =
    currentVersion && autoUpdatingVersion ? semver.neq(currentVersion, autoUpdatingVersion) : false

  useEffect(() => {
    checkForUpdates()
    // check for updates every 10s while dialog is open
    const interval = setInterval(checkForUpdates, 10_000)
    return () => clearInterval(interval)
  }, [checkForUpdates])

  const githubUrl = resolveGithubURLFromVersion(currentVersion)
  const sanityWebsiteUrl = useEnvAwareSanityWebsiteUrl()

  const importMapWarning =
    importMapInfo?.valid && !importMapInfo.appId ? (
      <Card padding={4} tone="caution">
        <Flex align="flex-start" gap={3}>
          <TextWithTone tone="caution">
            <WarningOutlineIcon />
          </TextWithTone>
          <Stack gap={4}>
            <TextWithTone size={1} tone="caution" weight="medium">
              {t('about-dialog.configuration-issue.header')}
            </TextWithTone>
            <TextWithTone size={1} tone="caution">
              <Translate t={t} i18nKey="about-dialog.configuration-issue.missing-appid" />
            </TextWithTone>
            <TextWithTone size={1} tone="caution">
              <Text muted size={1}>
                <a
                  href="https://www.sanity.io/docs/studio/latest-version-of-sanity"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('about-dialog.configuration-issue.missing-appid.view-documentation')} &rarr;
                </a>
              </Text>
            </TextWithTone>
          </Stack>
        </Flex>
        <Stack gap={2} />
      </Card>
    ) : null
  return (
    <Dialog width={0} onClickOutside={onClose} id={dialogId} padding={false}>
      {versionCheckStatus?.checking ? (
        <Flex margin={2} padding={2} style={{position: 'absolute', right: 0}}>
          <Spinner size={0} />
        </Flex>
      ) : null}

      <Stack gap={3} paddingY={3}>
        <Flex align="center" justify="center" paddingY={4}>
          <MonogramContainer>
            <SanityMonogram height={75} width={75} />
          </MonogramContainer>
        </Flex>
        <Grid gridTemplateColumns={2} gap={2}>
          <Flex justify="flex-end" align="center">
            {/* eslint-disable-next-line i18next/no-literal-string */}
            <Text as="h2" size={1} weight="semibold">
              Sanity Studio
            </Text>
          </Flex>
          <Flex justify="flex-start" align="center" gap={2}>
            <Tooltip
              content={
                currentVersionIsPrerelease
                  ? t('about-dialog.version-info.tooltip.prerelease')
                  : t('about-dialog.version-info.tooltip.up-to-date')
              }
            >
              <Badge tone={currentVersionIsPrerelease ? 'suggest' : 'neutral'}>
                {currentVersion ? ensureVersionPrefix(currentVersion.version) : 'unknown'}
              </Badge>
            </Tooltip>

            {githubUrl && (
              <Button
                as="a"
                target="_blank"
                rel="noopener noreferrer"
                icon={GithubIcon}
                mode="bleed"
                tooltipProps={{
                  content: t('about-dialog.version-info.view-on-github'),
                }}
                href={githubUrl}
              />
            )}
          </Flex>

          {isAutoUpdating && newAutoUpdateVersionAvailable ? (
            <>
              <Flex justify="flex-end" align="center">
                <Text size={1} weight="semibold">
                  {/* Note that this is not necessary a *higher* version than current, it's the new version made available for auto updates,
                   which in some cases could even be a downgrade compared to current */}
                  {t('about-dialog.version-info.new-version.text')}
                </Text>
              </Flex>
              <Flex justify="flex-start" align="center" gap={2}>
                <Badge tone="primary">
                  {autoUpdatingVersion && ensureVersionPrefix(autoUpdatingVersion?.version)}
                </Badge>
                <Button
                  onClick={reload}
                  mode="bleed"
                  tone="primary"
                  text={
                    // save some space by not showing text on button if prerelease
                    autoUpdatingVersion && isPrerelease(autoUpdatingVersion)
                      ? undefined
                      : t('about-dialog.version-info.update-button.text')
                  }
                  tooltipProps={{
                    content: (
                      <Text size={1}>{t('about-dialog.version-info.reload-to-update')}</Text>
                    ),
                  }}
                  icon={RefreshIcon}
                />
              </Flex>
            </>
          ) : !isUpToDate || currentVersionIsPrerelease ? (
            <>
              <Flex justify="flex-end" align="center">
                <Text size={1} weight="semibold">
                  {t('about-dialog.version-info.latest-version.header')}
                </Text>
              </Flex>
              <Flex justify="flex-start" align="center" gap={2}>
                <Badge tone="primary">
                  {latestTaggedVersion
                    ? ensureVersionPrefix(latestTaggedVersion.version)
                    : 'unknown'}
                </Badge>

                {
                  // save some space by not showing "how to update"-button
                  currentVersionIsPrerelease ? null : (
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
                  )
                }
              </Flex>
            </>
          ) : null}
        </Grid>
        <Stack gap={2} paddingY={3}>
          {isAutoUpdating ? (
            <Card tone="transparent" padding={2} radius={3} marginX={2}>
              <Flex align="center" justify="space-evenly" gap={2}>
                <Text size={1} muted>
                  {t('about-dialog.version-info.auto-updates.enabled')}
                </Text>
                <Button
                  as="a"
                  href={`${sanityWebsiteUrl}/manage/project/${projectId}/studios?host=${document.location.hostname}`}
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
          {importMapWarning}
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
