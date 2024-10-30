import {useTelemetry} from '@sanity/telemetry/react'
import {type BadgeTone, Box, Flex, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {
  CreatedRelease,
  createReleaseId,
  DEFAULT_RELEASE_TYPE,
  type EditableReleaseDocument,
  LoadingBlock,
  Preview,
  ReleaseAvatar,
  ReleaseForm,
  useReleaseOperations,
  useSchema,
} from 'sanity'

import {Dialog} from '../../../../../../../ui-components'

export function CreateReleaseDialog(props: {
  onClose: () => void
  documentId: string
  documentType: string
  tone: BadgeTone
  title: string
  onCreateVersion: (releaseId: string) => void
}): JSX.Element {
  const {onClose, documentId, documentType, tone, title, onCreateVersion} = props
  const toast = useToast()

  const schema = useSchema()
  const schemaType = schema.get(documentType)

  const [newReleaseId] = useState(createReleaseId())

  const [value, setValue] = useState((): EditableReleaseDocument => {
    return {
      _id: newReleaseId,
      metadata: {
        title: '',
        description: '',
        releaseType: DEFAULT_RELEASE_TYPE,
      },
    } as const
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const telemetry = useTelemetry()
  const {createRelease} = useReleaseOperations()

  const handleOnChange = useCallback((changedValue: EditableReleaseDocument) => {
    setValue(changedValue)
  }, [])

  const handleAddVersion = useCallback(async () => {
    onCreateVersion(newReleaseId)
  }, [onCreateVersion, newReleaseId])

  const handleCreateRelease = useCallback(async () => {
    try {
      setIsSubmitting(true)

      await createRelease(value)

      handleAddVersion()
      telemetry.log(CreatedRelease, {origin: 'document-panel'})
    } catch (err) {
      console.error(err)
      toast.push({
        closable: true,
        status: 'error',
        title: `Failed to create release`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [createRelease, handleAddVersion, telemetry, toast, value])

  return (
    <Dialog
      id={'create-release-dialog'}
      header={'Copy version to new release'}
      onClickOutside={onClose}
      onClose={onClose}
      padding={false}
      width={1}
      footer={{
        cancelButton: {
          disabled: isSubmitting,
          onClick: onClose,
        },
        confirmButton: {
          text: 'Add to release',
          onClick: handleCreateRelease,
          disabled: isSubmitting,
          tone: 'primary',
        },
      }}
    >
      <Box
        paddingX={2}
        marginBottom={2}
        style={{borderBottom: '1px solid var(--card-border-color)'}}
      >
        <Flex align="center" padding={4} paddingTop={1} justify="space-between">
          {schemaType ? (
            <Preview value={{_id: documentId}} schemaType={schemaType} />
          ) : (
            <LoadingBlock />
          )}

          <Flex
            align="center"
            gap={2}
            padding={1}
            paddingRight={2}
            style={{borderRadius: 999, border: '1px solid var(--card-border-color)'}}
          >
            <ReleaseAvatar padding={1} tone={tone} />
            <Text size={1}>{title}</Text>
          </Flex>
        </Flex>
      </Box>

      <Box paddingX={5} paddingY={3}>
        <ReleaseForm onChange={handleOnChange} value={value} />
      </Box>
    </Dialog>
  )
}
