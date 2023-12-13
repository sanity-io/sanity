import React, {useEffect} from 'react'
import {Flex, Text, Inline, Card} from '@sanity/ui'
import {UploadState} from '@sanity/types'
import {LinearProgress} from '../../../../components'
import {Button} from '../../../../../ui'
import {Translate, useTranslation} from '../../../../i18n'
import {STALE_UPLOAD_MS} from '../constants'
import {CardWrapper, FlexWrapper, LeftSection, CodeWrapper} from './UploadProgress.styled'

type Props = {
  uploadState: UploadState
  onCancel?: () => void
  onStale?: () => void
  height?: number
}
const elapsedMs = (date: string): number => new Date().getTime() - new Date(date).getTime()

export function UploadProgress({uploadState, onCancel, onStale, height}: Props) {
  const filename = uploadState.file.name

  useEffect(() => {
    if (elapsedMs(uploadState.updatedAt) > STALE_UPLOAD_MS) {
      onStale?.()
    }
  }, [uploadState.updatedAt, onStale])

  const {t} = useTranslation()
  return (
    <CardWrapper tone="primary" padding={4} border style={{height: `${height}px`}}>
      <FlexWrapper align="center" justify="space-between" height="fill" direction="row" gap={2}>
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
