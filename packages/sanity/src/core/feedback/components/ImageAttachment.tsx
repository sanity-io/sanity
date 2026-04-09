import {BinaryDocumentIcon, UploadIcon} from '@sanity/icons'
import {Card, Flex, Stack, Text} from '@sanity/ui'

import {Button} from '../../../ui-components'
import {FileInputButton} from '../../form/inputs/files/common/FileInputButton/FileInputButton'
import {fileTarget} from '../../form/inputs/files/common/fileTarget'

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

  if (!showAttachment && !imageFile) {
    return (
      <Flex>
        <Button
          mode="bleed"
          tone="primary"
          icon={UploadIcon}
          text="Attach an image"
          onClick={onExpand}
          style={{cursor: 'pointer'}}
        />
      </Flex>
    )
  }

  if (imageFile) {
    return (
      <Stack space={3}>
        <Text size={1} weight="medium">
          Attach an image
        </Text>
        <Card padding={3} radius={2} border>
          <Flex align="center" justify="space-between">
            <Text size={1} muted>
              {imageFile.name}
            </Text>
            <Button mode="bleed" tone="critical" text="Remove" onClick={onRemove} />
          </Flex>
        </Card>
      </Stack>
    )
  }

  return (
    <Stack space={3}>
      <Text size={1} weight="medium">
        Attach an image
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
              Drag or paste file here
            </Text>
          </Flex>
          <FileInputButton mode="ghost" text="Browse" accept="image/*" onSelect={onFiles} />
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
