import {type ReleaseDocument} from '@sanity/client'
import {LinkIcon} from '@sanity/icons/Link'
import {ShareIcon} from '@sanity/icons/Share'
import {TargetIcon} from '@sanity/icons/Target'
import {TextIcon} from '@sanity/icons/Text'
import {type DefinedTelemetryLog, useTelemetry} from '@sanity/telemetry/react'
import {Menu, useToast} from '@sanity/ui'
import {type ComponentType, useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {Button, MenuButton, MenuItem} from '../../../../ui-components'
import {useStudioUrl} from '../../../hooks/useStudioUrl'
import {useTranslation} from '../../../i18n'
import {
  ReleaseIdCopied,
  ReleaseLinkCopied,
  ReleaseTitleCopied,
} from '../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../i18n'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'

interface CopyReleaseActionsProps {
  release: ReleaseDocument
  /**
   * Button icon. Defaults to ShareIcon (the current header). The menu only copies things (link / id
   * / title) to the clipboard, so callers that want the icon to match that — rather than imply
   * sharing — can pass CopyIcon.
   */
  icon?: ComponentType
}

export function CopyReleaseActions(props: CopyReleaseActionsProps) {
  const {release, icon = ShareIcon} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const telemetry = useTelemetry()
  const toast = useToast()
  const {resolvePathFromState} = useRouter()
  const {buildIntentUrl} = useStudioUrl()

  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)
  const title = release.metadata.title || tCore('release.placeholder-untitled-release')

  const copyToClipboard = useCallback(
    async (text: string, event: DefinedTelemetryLog<void>, toastKey: string) => {
      await navigator.clipboard.writeText(text)
      telemetry.log(event)
      toast.push({
        id: toastKey,
        status: 'info',
        title: t(`toast.${toastKey}.success`),
      })
    },
    [t, telemetry, toast],
  )

  const handleCopyReleaseLink = useCallback(async () => {
    const releasePath = resolvePathFromState({releaseId})
    const url = buildIntentUrl(releasePath)

    await copyToClipboard(url, ReleaseLinkCopied, 'copy-release-link')
  }, [buildIntentUrl, copyToClipboard, releaseId, resolvePathFromState])

  const handleCopyReleaseId = useCallback(async () => {
    await copyToClipboard(releaseId, ReleaseIdCopied, 'copy-release-id')
  }, [copyToClipboard, releaseId])

  const handleCopyReleaseTitle = useCallback(async () => {
    await copyToClipboard(title, ReleaseTitleCopied, 'copy-release-title')
  }, [copyToClipboard, title])

  return (
    <MenuButton
      id="copy-release-actions"
      button={
        <Button
          data-testid="copy-release-actions-button"
          icon={icon}
          mode="bleed"
          tooltipProps={{content: t('action.copy-release.label')}}
        />
      }
      menu={
        <Menu>
          <MenuItem
            icon={LinkIcon}
            onClick={handleCopyReleaseLink}
            text={t('action.copy-release-link.label')}
          />
          <MenuItem
            icon={TargetIcon}
            onClick={handleCopyReleaseId}
            text={t('action.copy-release-id.label')}
          />
          <MenuItem
            icon={TextIcon}
            onClick={handleCopyReleaseTitle}
            text={t('action.copy-release-title.label')}
          />
        </Menu>
      }
      popover={{placement: 'bottom-end'}}
    />
  )
}
