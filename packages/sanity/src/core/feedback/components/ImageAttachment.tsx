import {BinaryDocumentIcon} from '@sanity/icons/BinaryDocument'
import {UploadIcon} from '@sanity/icons/Upload'
import {Card} from '@sanity/ui'
import {Text, VStack, Flex, Icon} from 'ui5'

import {Button} from '../../../ui-components/button/Button'
import {FileInputButton} from '../../form/inputs/files/common/FileInputButton/FileInputButton'
import {fileTarget} from '../../form/inputs/files/common/fileTarget/fileTarget'
import {useFeedbackTranslation} from '../i18n/useFeedbackTranslation'

const FileTargetCard = fileTarget(Card)

/** @internal */
export interface ImageAttachmentProps {
  imageFile: File | null
  showAttachment: boolean
  dragOver: boolean
  error: string | null
  onFiles: (files: File[]) => void
  onFilesOver: () => void
  onFilesOut: () => void
  onRemove: () => void
  onExpand: () => void
}

/** @internal */
export function ImageAttachment(props: ImageAttachmentProps) {
  const {
    imageFile,
    showAttachment,
    dragOver,
    error,
    onFiles,
    onFilesOver,
    onFilesOut,
    onRemove,
    onExpand,
  } = props
  const {t} = useFeedbackTranslation()

  if (!showAttachment && !imageFile) {
    return (
      <Flex>
        <Button
          mode="bleed"
          tone="primary"
          icon={UploadIcon}
          text={t('feedback.attachment.label')}
          onClick={onExpand}
          style={{cursor: 'pointer'}}
        />
      </Flex>
    )
  }

  if (imageFile) {
    return (
      <VStack gap={3}>
        <Text size={1} weight="medium" as="div" trim={true}>
          {t('feedback.attachment.label')}
        </Text>
        <Card padding={3} radius={2} border>
          <Flex alignItems="center" justifyContent="space-between">
            <Text size={1} muted as="div" trim={true}>
              {imageFile.name}
            </Text>
            <Button
              mode="bleed"
              tone="critical"
              text={t('feedback.attachment.remove')}
              onClick={onRemove}
            />
          </Flex>
        </Card>
      </VStack>
    )
  }

  return (
    <VStack gap={3}>
      <Text size={1} weight="medium" as="div" trim={true}>
        {t('feedback.attachment.label')}
      </Text>
      <FileTargetCard
        padding={3}
        radius={2}
        border
        tone={dragOver ? 'primary' : 'default'}
        onFiles={onFiles}
        onFilesOver={onFilesOver}
        onFilesOut={onFilesOut}
      >
        <Flex alignItems="center" justifyContent="space-between">
          <Flex alignItems="center" gap={2}>
            <Icon icon={BinaryDocumentIcon} size={1} muted />
            <Text size={1} muted as="div" trim={true}>
              {t('feedback.attachment.drop-zone')}
            </Text>
          </Flex>
          <FileInputButton
            mode="ghost"
            text={t('feedback.attachment.browse')}
            accept="image/*"
            onSelect={onFiles}
          />
        </Flex>
      </FileTargetCard>
      {error && (
        <Text size={1} style={{color: 'var(--card-badge-critical-fg-color)'}} as="div" trim={true}>
          {error}
        </Text>
      )}
    </VStack>
  )
}
