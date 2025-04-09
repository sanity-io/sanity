import {CheckmarkCircleIcon, CopyIcon} from '@sanity/icons'
import {Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useId, useState} from 'react'

import {Button, Dialog} from '../../../../../ui-components'
import {hasSanityPackageInImportMap} from '../../../../environment/hasSanityPackageInImportMap'
import {Translate, useTranslation} from '../../../../i18n'

interface AboutDialogProps {
  latestVersion: string
  currentVersion?: string
  onClose: () => void
}
export function AboutDialog(props: AboutDialogProps) {
  const {t} = useTranslation()

  const {latestVersion, onClose, currentVersion} = props
  const aboutDialogId = useId()
  const [copySuccess, setCopySuccess] = useState(false)

  const {push} = useToast()
  const isAutoUpdating = hasSanityPackageInImportMap()

  const text = `## Current version
${currentVersion}

## Latest version
${latestVersion}

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
    <Dialog
      header={'About'}
      width={1}
      onClickOutside={onClose}
      onClose={onClose}
      id={aboutDialogId}
    >
      <Stack space={4}>
        <Stack space={3}>
          <Text as="h2" size={1} weight="medium">
            {t('about-dialog.version-info.current-version.header')}
          </Text>
          <Text muted size={1}>
            {currentVersion}
          </Text>
        </Stack>
        <Stack space={3}>
          <Text as="h2" size={1} weight="medium">
            {t('about-dialog.version-info.current-version.header')}
          </Text>
          <Text muted size={1}>
            <Translate t={t} i18nKey="" components={{}} />
            {t('about-dialog.version-info.latest-version.text', {latestVersion})}{' '}
            {latestVersion === currentVersion ? (
              <>({t('about-dialog.version-info.up-to-date')})</>
            ) : (
              <>
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
  )
}
