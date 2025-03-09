import {type SanityDocument} from '@sanity/client'
import {ErrorOutlineIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Flex, Text} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {type ObjectSchemaType, Translate, useDocumentOperation, useTranslation} from 'sanity'

import {Button} from '../../../../../ui-components'
import {structureLocaleNamespace} from '../../../../i18n'
import {ResolvedLiveEdit} from './__telemetry__/DraftLiveEditBanner.telemetry'
import {Banner} from './Banner'

interface DraftLiveEditBannerProps {
  displayed: Partial<SanityDocument> | null
  documentId: string
  schemaType: ObjectSchemaType
}

export function DraftLiveEditBanner({
  displayed,
  documentId,
  schemaType,
}: DraftLiveEditBannerProps): React.JSX.Element | null {
  const {t} = useTranslation(structureLocaleNamespace)
  const [isPublishing, setPublishing] = useState(false)
  const [isDiscarding, setDiscarding] = useState(false)
  const telemetry = useTelemetry()

  const {publish, discardChanges} = useDocumentOperation(documentId, displayed?._type || '')

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

  return (
    <Banner
      content={
        <Flex align="center" justify="space-between" gap={2}>
          <Text size={1} weight="medium">
            <Translate
              t={t}
              i18nKey={'banners.live-edit-draft-banner.text'}
              values={{schemaType: schemaType.title}}
            />
          </Text>

          <Button
            onClick={handlePublish}
            text={t('action.publish.live-edit.label')}
            tooltipProps={{content: t('banners.live-edit-draft-banner.publish.tooltip')}}
            loading={isPublishing}
          />

          <Button
            onClick={handleDiscard}
            text={t('banners.live-edit-draft-banner.discard.tooltip')}
            tooltipProps={{content: t('banners.live-edit-draft-banner.discard.tooltip')}}
            loading={isDiscarding}
          />
        </Flex>
      }
      data-testid="live-edit-type-banner"
      icon={ErrorOutlineIcon}
    />
  )
}
