import {type SanityDocument} from '@sanity/client'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {useTelemetry} from '@sanity/telemetry/react'
import {Flex, Text} from '@sanity/ui'
import {type ComponentType, useCallback, useEffect, useState} from 'react'
import {
  getDraftId,
  getPublishedId,
  type ObjectSchemaType,
  Translate,
  useConfiguredDocumentActionIds,
  useDocumentOperation,
  useTranslation,
} from 'sanity'

import {Button} from '../../../../../ui-components/button/Button'
import {useDiffViewRouter} from '../../../../diffView/hooks/useDiffViewRouter'
import {structureLocaleNamespace} from '../../../../i18n'
import {ResolvedLiveEdit} from './__telemetry__/DraftLiveEditBanner.telemetry'
import {Banner} from './Banner'

interface ObsoleteDraftBannerProps {
  displayed: Partial<SanityDocument> | null
  documentId: string
  schemaType: ObjectSchemaType
  i18nKey: string
  /**
   * Whether the user is blocked from editing the document while an obsolete draft exists.
   */
  isEditBlocking?: boolean
}

export const ObsoleteDraftBanner: ComponentType<ObsoleteDraftBannerProps> = ({
  displayed,
  documentId,
  schemaType,
  i18nKey,
  isEditBlocking,
}) => {
  const {t} = useTranslation(structureLocaleNamespace)
  const [isPublishing, setPublishing] = useState(false)
  const [isDiscarding, setDiscarding] = useState(false)
  const telemetry = useTelemetry()

  // No `getTargetScopeId(useTargetDocumentState())` here: resolving an obsolete draft deliberately operates on
  // the draft/published pair, so no version scope applies.
  const {publish, discardChanges} = useDocumentOperation(documentId, displayed?._type || '')
  // Gate on the context this button acts on rather than the pane's: both banner buttons target the
  // obsolete draft, while the pane resolves as `published` whenever the draft model is inactive.
  const configuredActionIds = useConfiguredDocumentActionIds({
    schemaType: schemaType.name,
    documentId,
    versionType: 'draft',
    releaseId: undefined,
  })
  const showDiscardDraft = configuredActionIds.has('discardChanges')

  const handlePublish = useCallback(() => {
    publish.execute()
    setPublishing(true)
    telemetry.log(ResolvedLiveEdit, {liveEditResolveType: 'publish'})
  }, [publish, telemetry])

  const handleDiscard = useCallback(() => {
    discardChanges.execute()
    setDiscarding(true)
    telemetry.log(ResolvedLiveEdit, {liveEditResolveType: 'discard'})
  }, [discardChanges, telemetry])

  useEffect(() => {
    return () => {
      setPublishing(false)
      setDiscarding(false)
    }
  })

  const diffViewRouter = useDiffViewRouter()

  const compareDraft = useCallback(() => {
    if (typeof displayed?._id === 'undefined') {
      return
    }

    diffViewRouter.navigateDiffView({
      mode: 'version',
      previousDocument: {
        type: schemaType.name,
        id: getPublishedId(displayed?._id),
      },
      nextDocument: {
        type: schemaType.name,
        id: getDraftId(displayed?._id),
      },
    })
  }, [diffViewRouter, displayed?._id, schemaType.name])

  return (
    <Banner
      content={
        <Flex align="center" justify="space-between" gap={2}>
          <Text size={1} weight="medium">
            <Translate t={t} i18nKey={i18nKey} values={{schemaType: schemaType.title}} />
          </Text>
          <Button
            text={t('banners.obsolete-draft.actions.compare-draft.text')}
            mode="ghost"
            onClick={compareDraft}
          />
          {/* Deliberately ungated: `usePublishAction` resolves to null in both states that render this
              banner, so the status bar never offers Publish here and gating would leave no way to
              clear the draft forward. */}
          <Button
            onClick={handlePublish}
            text={t('banners.obsolete-draft.actions.publish-draft.text')}
            tooltipProps={
              isEditBlocking
                ? {
                    content: t('banners.live-edit-draft-banner.publish.tooltip'),
                  }
                : {}
            }
            loading={isPublishing}
            tone="positive"
          />
          {showDiscardDraft ? (
            <Button
              onClick={handleDiscard}
              text={t('banners.obsolete-draft.actions.discard-draft.text')}
              tooltipProps={
                isEditBlocking
                  ? {
                      content: t('banners.live-edit-draft-banner.discard.tooltip'),
                    }
                  : {}
              }
              loading={isDiscarding}
              tone="caution"
            />
          ) : null}
        </Flex>
      }
      data-testid="live-edit-type-banner"
      icon={ErrorOutlineIcon}
    />
  )
}
