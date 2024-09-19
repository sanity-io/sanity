import {ErrorOutlineIcon} from '@sanity/icons'
import {Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {isDraftId, useDocumentOperation, useTranslation} from 'sanity'

import {Button} from '../../../../../ui-components'
import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {Banner} from './Banner'

export function DraftLiveEditBanner(): JSX.Element | null {
  const {displayed, documentId} = useDocumentPane()
  const {t} = useTranslation(structureLocaleNamespace)
  const [isPublishing, setPublishing] = useState(false)

  const {publish} = useDocumentOperation(documentId, displayed?._type || '')

  const handlePublish = useCallback(() => {
    publish.execute()
    setPublishing(true)
  }, [publish])

  if (displayed && displayed._id && !isDraftId(displayed._id)) {
    return null
  }

  return (
    <Banner
      content={
        <Flex align="center" justify="space-between">
          <Stack space={2}>
            <Text size={1} weight="medium">
              {t('banners.live-edit-draft-banner.text')}
            </Text>
          </Stack>
          <Button
            onClick={handlePublish}
            text={t('action.publish.live-edit.label')}
            tooltipProps={{content: t('banners.live-edit-draft-banner.tooltip')}}
            loading={isPublishing}
          />
        </Flex>
      }
      data-testid="live-edit-type-banner"
      icon={ErrorOutlineIcon}
    />
  )
}
