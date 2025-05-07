import {type SanityDocument} from '@sanity/client'
import {ComposeSparklesIcon} from '@sanity/icons'
import {useCallback, useEffect, useMemo, useState} from 'react'

import {
  type DocumentActionComponent,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {useGetFormValue} from '../../../form/contexts/GetFormValue'
import {useSchema} from '../../../hooks/useSchema'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {usePerspective} from '../../../perspective/usePerspective'
import {isReleaseDocument} from '../../../releases/store/types'
import {useProjectOrganizationId} from '../../../store/_legacy/project/useProjectOrganizationId'
import {useRenderingContext} from '../../../store/renderingContext/useRenderingContext'
import {getDraftId, getPublishedId} from '../../../util/draftUtils'
import {canvasLocaleNamespace} from '../../i18n'
import {useCanvasTelemetry} from '../../useCanvasTelemetry'
import {useCanvasCompanionDoc} from '../useCanvasCompanionDoc'
import {LinkToCanvasDialog} from './LinkToCanvasDialog'

const useIsExcludedType = (type: string) => {
  const schema = useSchema()
  const isExcludedType = schema.get(type)?.options?.sanityCreate?.exclude
  return isExcludedType
}

export const LinkToCanvasAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const {t} = useTranslation(canvasLocaleNamespace)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const {selectedPerspective} = usePerspective()
  const {isLinked, loading} = useCanvasCompanionDoc(
    props.liveEditSchemaType ? getPublishedId(props.id) : getDraftId(props.id),
  )
  const {value: organizationId} = useProjectOrganizationId()
  const {linkCtaClicked} = useCanvasTelemetry()

  const isExcludedType = useIsExcludedType(props.type)

  const handleCloseDialog = useCallback(() => setIsDialogOpen(false), [])
  const renderingContext = useRenderingContext()
  const isInDashboard = renderingContext?.name === 'coreUi'
  const isVersionDocument = Boolean(props.release)
  const getFormValue = useGetFormValue()
  const [formValue, setFormValue] = useState<SanityDocument | undefined>()

  const handleOpenDialog = useCallback(() => {
    linkCtaClicked()
    const value = getFormValue([]) as SanityDocument
    setFormValue({
      ...value,
      _id: props.liveEditSchemaType ? getPublishedId(value._id) : getDraftId(value._id),
    })
    setIsDialogOpen(true)
  }, [getFormValue, props.liveEditSchemaType, linkCtaClicked])

  const disabled = useMemo(() => {
    if (!organizationId) {
      return {disabled: true, reason: t('action.link-document-disabled.missing-permissions')}
    }
    if (!isInDashboard) {
      return {disabled: true, reason: t('action.link-document-disabled.not-in-dashboard')}
    }
    if (isVersionDocument) {
      return {disabled: true, reason: t('action.link-document-disabled.version-document')}
    }
    if (!props.initialValueResolved) {
      return {disabled: true, reason: t('action.link-document-disabled.initial-value-not-resolved')}
    }

    return {disabled: false, reason: undefined}
  }, [isVersionDocument, t, props.initialValueResolved, isInDashboard, organizationId])

  useEffect(() => {
    if (isLinked) {
      handleCloseDialog()
    }
  }, [isLinked, handleCloseDialog])

  if (isLinked || loading || isExcludedType) return null
  // Hide the action in published perspective unless the document is live editable
  if (selectedPerspective === 'published' && !props.liveEditSchemaType) return null
  // Release documents are not yet supported in Canvas
  if (isReleaseDocument(selectedPerspective)) return null

  // Hide the action in the dashboard - TODO Remove this once dashboard is released
  if (!isInDashboard) return null

  return {
    disabled: disabled.disabled,
    icon: ComposeSparklesIcon,
    dialog:
      isDialogOpen && formValue
        ? {
            type: 'custom',
            component: <LinkToCanvasDialog onClose={handleCloseDialog} document={formValue} />,
          }
        : undefined,
    label: t('action.link-document'),
    title: disabled.reason,
    onHandle: handleOpenDialog,
  }
}

LinkToCanvasAction.action = 'linkToCanvas'
LinkToCanvasAction.displayName = 'LinkToCanvasAction'
