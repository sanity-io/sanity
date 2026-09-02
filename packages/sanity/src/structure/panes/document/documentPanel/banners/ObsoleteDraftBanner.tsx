import {type SanityDocument} from '@sanity/client'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {useTelemetry} from '@sanity/telemetry/react'
import {Flex, Text} from '@sanity/ui'
import {type ComponentType, useCallback, useState} from 'react'
import {
  getTargetSiblings,
  type ObjectSchemaType,
  Translate,
  useDocumentOperation,
  usePerspective,
  useTranslation,
} from 'sanity'

import {Button} from '../../../../../ui-components/button/Button'
import {useDiffViewRouter} from '../../../../diffView/hooks/useDiffViewRouter'
import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
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
  const [actionRequested, setActionRequested] = useState<'publish' | 'discard'>()
  const telemetry = useTelemetry()
  const {selectedVariant} = usePerspective()
  const {targetDocumentState} = useDocumentPane()
  const siblings = getTargetSiblings(targetDocumentState)
  const publishedId = siblings?.published?._id
  const draftId = siblings?.draft?._id
  const isPublishing = actionRequested === 'publish' && Boolean(draftId)
  const isDiscarding = actionRequested === 'discard' && Boolean(draftId)
  // Variant leftover drafts pass `pairTarget` so publish/discard hit the variant draft. Base
  // live-edit leftovers omit it and operate on the draft/published pair.
  const target = selectedVariant
    ? siblings?.draft?._system.scopeId
      ? ({
          kind: 'variant',
          scopeId: siblings.draft._system.scopeId,
          variantId: selectedVariant._id,
        } as const)
      : ({kind: 'target-missing', variantId: selectedVariant._id} as const)
    : undefined

  const {publish, discardChanges} = useDocumentOperation(documentId, displayed?._type || '', target)

  const handlePublish = useCallback(() => {
    publish.execute()
    setActionRequested('publish')
    telemetry.log(ResolvedLiveEdit, {liveEditResolveType: 'publish'})
  }, [publish, telemetry])

  const handleDiscard = useCallback(() => {
    discardChanges.execute()
    setActionRequested('discard')
    telemetry.log(ResolvedLiveEdit, {liveEditResolveType: 'discard'})
  }, [discardChanges, telemetry])

  const diffViewRouter = useDiffViewRouter()
  if (!draftId) {
    return null
  }

  const compareDraft = () => {
    if (!publishedId) {
      return
    }
    diffViewRouter.navigateDiffView({
      mode: 'version',
      previousDocument: {type: schemaType.name, id: publishedId},
      nextDocument: {type: schemaType.name, id: draftId},
    })
  }

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
            disabled={!publishedId || Boolean(actionRequested)}
            tooltipProps={{
              content: t('banners.obsolete-draft.actions.compare-draft.tooltip'),
              disabled: Boolean(publishedId),
            }}
            onClick={compareDraft}
          />
          <Button
            onClick={handlePublish}
            text={t('banners.obsolete-draft.actions.publish-draft.text')}
            disabled={Boolean(actionRequested)}
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
          <Button
            onClick={handleDiscard}
            disabled={!draftId || Boolean(actionRequested)}
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
        </Flex>
      }
      data-testid="live-edit-type-banner"
      icon={ErrorOutlineIcon}
    />
  )
}
