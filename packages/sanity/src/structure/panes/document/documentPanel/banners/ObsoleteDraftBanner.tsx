import {type SanityDocument} from '@sanity/client'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {useTelemetry} from '@sanity/telemetry/react'
import {Flex, Text} from '@sanity/ui'
import {type ComponentType, useCallback, useEffect, useState} from 'react'
import {
  type DocumentPairTarget,
  getDraftId,
  getPublishedId,
  type ObjectSchemaType,
  Translate,
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
  /**
   * When the obsolete draft is a variant-scoped document, operations must target that version
   * rather than the base draft/published pair.
   */
  pairTarget?: DocumentPairTarget | string
  /** Document id to compare as the draft side. Defaults to `drafts.<displayed._id>`. */
  compareDraftId?: string
  /** Document id to compare as the published side. Defaults to the published id of `displayed`. */
  comparePublishedId?: string
}

export const ObsoleteDraftBanner: ComponentType<ObsoleteDraftBannerProps> = ({
  displayed,
  documentId,
  schemaType,
  i18nKey,
  isEditBlocking,
  pairTarget,
  compareDraftId,
  comparePublishedId,
}) => {
  const {t} = useTranslation(structureLocaleNamespace)
  const [isPublishing, setPublishing] = useState(false)
  const [isDiscarding, setDiscarding] = useState(false)
  const telemetry = useTelemetry()

  // Variant leftover drafts pass `pairTarget` so publish/discard hit the variant draft. Base
  // live-edit leftovers omit it and operate on the draft/published pair.
  const {publish, discardChanges} = useDocumentOperation(
    documentId,
    displayed?._type || '',
    pairTarget,
  )

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
        id: comparePublishedId ?? getPublishedId(displayed?._id),
      },
      nextDocument: {
        type: schemaType.name,
        id: compareDraftId ?? getDraftId(displayed?._id),
      },
    })
  }, [diffViewRouter, displayed?._id, schemaType.name, compareDraftId, comparePublishedId])

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
        </Flex>
      }
      data-testid="live-edit-type-banner"
      icon={ErrorOutlineIcon}
    />
  )
}
