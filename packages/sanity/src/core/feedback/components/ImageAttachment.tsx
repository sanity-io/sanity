import {BinaryDocumentIcon, UploadIcon} from '@sanity/icons'
import {Card, Flex, Stack, Text} from '@sanity/ui'

import {Button} from '../../../ui-components'
import {FileInputButton} from '../../form/inputs/files/common/FileInputButton/FileInputButton'
import {fileTarget} from '../../form/inputs/files/common/fileTarget'
import {useTranslation} from '../../i18n'

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
  const {t} = useTranslation()

  if (!showAttachment && !imageFile) {
    return (
      <Flex
        as="span"
        align="center"
        gap={1}
        style={{color: 'var(--card-link-color)', cursor: 'pointer'}}
        onClick={onExpand}
      >
        <UploadIcon style={{fontSize: '1em'}} />
        <Text size={1} as="span" style={{color: 'inherit'}}>
          {t('feedback.attachment.label')}
        </Text>
      </Flex>
    )
  }

  if (imageFile) {
    return (
      <Stack space={3}>
        <Text size={1} weight="medium">
          {t('feedback.attachment.label')}
        </Text>
        <Card padding={3} radius={2} border>
          <Flex align="center" justify="space-between">
            <Text size={1} muted>
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
      </Stack>
    )
  }

  return (
    <Stack space={3}>
      <Text size={1} weight="medium">
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
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={2}>
            <Text size={1} muted>
              <BinaryDocumentIcon />
            </Text>
            <Text size={1} muted>
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
        <Text size={1} style={{color: 'var(--card-badge-critical-fg-color)'}}>
          {error}
        </Text>
      )}
    </Stack>
  )
}
