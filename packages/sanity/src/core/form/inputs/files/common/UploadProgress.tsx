import {type UploadState} from '@sanity/types'
import {Card, Flex, Inline, Text} from '@sanity/ui'
import {useEffect} from 'react'

import {Button} from '../../../../../ui-components'
import {LinearProgress} from '../../../../components'
import {Translate, useTranslation} from '../../../../i18n'
import {STALE_UPLOAD_MS} from '../constants'
import {CardWrapper, CodeWrapper, FlexWrapper, LeftSection} from './UploadProgress.styled'

type Props = {
  uploadState: UploadState
  onCancel?: () => void
  onStale?: () => void
}
const elapsedMs = (date: string): number => new Date().getTime() - new Date(date).getTime()

export function UploadProgress({uploadState, onCancel, onStale}: Props) {
  const filename = uploadState.file.name

  useEffect(() => {
    if (elapsedMs(uploadState.updatedAt) > STALE_UPLOAD_MS) {
      onStale?.()
    }
  }, [uploadState.updatedAt, onStale])

  const {t} = useTranslation()
  return (
    <CardWrapper tone="primary" border>
      <FlexWrapper
        padding={4}
        align="center"
        justify="space-between"
        height="fill"
        direction="row"
        gap={2}
      >
        <LeftSection>
          <Flex justify="center" gap={[3, 3, 2, 2]} direction={['column', 'column', 'row']}>
            <Text size={1}>
              <Inline space={2}>
                <Translate
                  t={t}
                  i18nKey="input.files.common.upload-progress"
                  components={{
                    FileName: () => <CodeWrapper size={1}>{filename ? filename : '…'}</CodeWrapper>,
                  }}
                />
              </Inline>
            </Text>
          </Flex>

          <Card border marginTop={3} radius={5}>
            <LinearProgress value={uploadState.progress} />
          </Card>
        </LeftSection>

        {onCancel ? (
          <Button
            mode="ghost"
            onClick={onCancel}
            text={t('input.files.common.cancel-upload')}
            tone="critical"
          />
        ) : null}
      </FlexWrapper>
    </CardWrapper>
  )
}
