import {CheckmarkCircleIcon, CopyIcon, HelpCircleIcon} from '@sanity/icons'
import {Menu, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useId, useState} from 'react'
import {styled} from 'styled-components'

import {Button, Dialog, MenuButton} from '../../../../../ui-components'
import {hasSanityPackageInImportMap} from '../../../../environment/hasSanityPackageInImportMap'
import {Translate, useTranslation} from '../../../../i18n'
import {SANITY_VERSION} from '../../../../version'
import {useGetHelpResources} from './helper-functions/hooks'
import {ResourcesMenuItems} from './ResourcesMenuItems'

const StyledMenu = styled(Menu)`
  max-width: 300px;
  min-width: 200px;
`

export function ResourcesButton() {
  const {t} = useTranslation()

  const {value, error, isLoading} = useGetHelpResources()
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false)

  const latestStudioVersion = value?.latestVersion
  const handleAboutDialogClose = useCallback(() => {
    setAboutDialogOpen(false)
  }, [])
  const handleAboutDialogOpen = useCallback(() => {
    setAboutDialogOpen(true)
  }, [])
  const aboutDialogId = useId()
  const [copySuccess, setCopySuccess] = useState(false)

  const {push} = useToast()
  const isAutoUpdating = hasSanityPackageInImportMap()

  const text = `## Current version
${SANITY_VERSION}

## Latest version
${latestStudioVersion}

## Auto updates
${isAutoUpdating ? 'Enabled' : 'Disabled'}

## Page URL
${document.location.href}

## User agent
${navigator.userAgent}
`

  const handleCopyDetails = useCallback(() => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess(true)
      },
      (err: unknown) => {
        push({
          status: 'warning',
          title: `Unable to write to clipboard: ${(err && typeof err === 'object' && 'message' in err && err.message) || 'unknown error'}`,
        })
      },
    )
  }, [push, text])

  useEffect(() => {
    const timer = setTimeout(() => setCopySuccess(false), 3000)
    return () => clearTimeout(timer)
  }, [copySuccess])

  return (
    <>
      {aboutDialogOpen && (
        <Dialog
          header={'About'}
          width={1}
          onClickOutside={handleAboutDialogClose}
          onClose={handleAboutDialogClose}
          id={aboutDialogId}
        >
          <Stack space={4}>
            <Stack space={3}>
              <Text as="h2" size={1} weight="medium">
                {t('about-dialog.version-info.current-version.header')}
              </Text>
              <Text muted size={1}>
                {SANITY_VERSION}
              </Text>
            </Stack>
            <Stack space={3}>
              <Text as="h2" size={1} weight="medium">
                {t('about-dialog.version-info.current-version.header')}
              </Text>
              <Text muted size={1}>
                <Translate t={t} i18nKey="" components={{}} />
                {t('about-dialog.version-info.latest-version.text', {latestStudioVersion})}
                {latestStudioVersion === SANITY_VERSION ? (
                  <>({t('about-dialog.version-info.up-to-date')})</>
                ) : (
                  <>
                    {' '}
                    (
                    <a href="https://www.sanity.io/docs/upgrade">
                      {t('about-dialog.version-info.how-to-upgrade')}
                    </a>
                    )
                  </>
                )}
              </Text>
            </Stack>
            <Stack space={3}>
              <Text as="h2" size={1} weight="medium">
                {t('about-dialog.version-info.auto-updates.header')}
              </Text>
              {isAutoUpdating ? (
                <Text muted size={1}>
                  {t('about-dialog.version-info.auto-updates.enabled')}
                </Text>
              ) : (
                <Text muted size={1}>
                  {t('about-dialog.version-info.auto-updates.disabled')} (
                  <a href="https://www.sanity.io/docs/auto-updating-studios">
                    {t('about-dialog.version-info.auto-updates.how-to-enable')}
                  </a>
                  )
                </Text>
              )}
            </Stack>
            <Stack space={3}>
              <Text as="h2" size={1} weight="medium">
                {t('about-dialog.version-info.user-agent.header')}
              </Text>
              <Text muted size={1}>
                {navigator.userAgent}
              </Text>
            </Stack>
            <Button
              icon={copySuccess ? CheckmarkCircleIcon : CopyIcon}
              mode="bleed"
              text={
                copySuccess
                  ? t('about-dialog.version-info.copy-to-clipboard-button.copied-text')
                  : t('about-dialog.version-info.copy-to-clipboard-button.text')
              }
              paddingY={3}
              onClick={handleCopyDetails}
            />
          </Stack>
        </Dialog>
      )}
      <MenuButton
        button={
          <Button
            aria-label={t('help-resources.title')}
            icon={HelpCircleIcon}
            mode="bleed"
            tooltipProps={{content: t('help-resources.title')}}
          />
        }
        id="menu-button-resources"
        menu={
          <StyledMenu data-testid="menu-button-resources">
            <ResourcesMenuItems
              error={error}
              isLoading={isLoading}
              value={value}
              onAboutDialogOpen={handleAboutDialogOpen}
            />
          </StyledMenu>
        }
        popover={{constrainSize: true, tone: 'default'}}
      />
    </>
  )
}
