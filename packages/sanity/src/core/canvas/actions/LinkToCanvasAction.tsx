import {ComposeSparklesIcon} from '@sanity/icons'
import {useCallback, useMemo, useState} from 'react'

import {type DocumentActionComponent, type DocumentActionProps} from '../../config/document/actions'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useRenderingContext} from '../../store/renderingContext/useIsInRenderContext'
import {canvasLocaleNamespace} from '../i18n'
import {LinkToCanvasDialog} from './LinkToCanvasDialog'

export const LinkToCanvasAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const {t} = useTranslation(canvasLocaleNamespace)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const isDocumentLinked = false
  const handleCloseDialog = useCallback(() => setIsDialogOpen(false), [])
  const handleOpenDialog = useCallback(() => setIsDialogOpen(true), [])
  const renderingContext = useRenderingContext()

  const isInDashboard = renderingContext?.name === 'coreUi'
  const isVersionDocument = Boolean(props.release)
  const disabled = useMemo(() => {
    if (!isInDashboard) {
      return {disabled: true, reason: t('action.link-document-disabled.not-in-dashboard')}
    }
    if (isVersionDocument) {
      return {disabled: true, reason: t('action.link-document-disabled.version-document')}
    }
    return {disabled: false, reason: undefined}
  }, [isInDashboard, isVersionDocument, t])

  if (isDocumentLinked) return null

  // TODO: Remove this after dashboard has been released, we want to show the action outside dashboard with a disabled state
  if (!isInDashboard) return null
  return {
    disabled: disabled.disabled,
    icon: ComposeSparklesIcon,
    dialog: isDialogOpen
      ? {
          type: 'custom',
          component: <LinkToCanvasDialog onClose={handleCloseDialog} />,
        }
      : undefined,
    label: t('action.link-document'),
    title: disabled.reason,
    onHandle: handleOpenDialog,
  }
}

LinkToCanvasAction.action = 'linkToCanvas'
LinkToCanvasAction.displayName = 'LinkToCanvasAction'
