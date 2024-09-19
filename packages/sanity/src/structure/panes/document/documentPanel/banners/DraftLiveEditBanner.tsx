import {ErrorOutlineIcon} from '@sanity/icons'
import {Flex, Text} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {isDraftId, useDocumentOperation, useTranslation} from 'sanity'

import {Button} from '../../../../../ui-components'
import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {Banner} from './Banner'

export function DraftLiveEditBanner(): JSX.Element | null {
  const {displayed, documentId} = useDocumentPane()
  const {t} = useTranslation(structureLocaleNamespace)
  const [isPublishing, setPublishing] = useState(false)
  const [isDiscarding, setDiscarding] = useState(false)

  const {publish, discardChanges} = useDocumentOperation(documentId, displayed?._type || '')

  const handlePublish = useCallback(() => {
    publish.execute()
    setPublishing(true)
  }, [publish])

  const handleDiscard = useCallback(() => {
    discardChanges.execute()
    setDiscarding(true)
  }, [discardChanges])

  useEffect(() => {
    return () => {
      setPublishing(false)
      setDiscarding(false)
    }
  })

  if (displayed && displayed._id && !isDraftId(displayed._id)) {
    return null
  }

  return (
    <Banner
      content={
        <Flex align="center" justify="space-between" gap={1}>
          <Text size={1} weight="medium">
            {t('banners.live-edit-draft-banner.text')}
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
