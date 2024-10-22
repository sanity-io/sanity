import {useTelemetry} from '@sanity/telemetry/react'
import {type BadgeTone, Box, Flex, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {filter, firstValueFrom} from 'rxjs'
import {
  AddedVersion,
  CreatedRelease,
  createReleaseId,
  DEFAULT_RELEASE_TYPE,
  type FormReleaseDocument,
  getCreateVersionOrigin,
  getPublishedId,
  getVersionFromId,
  getVersionId,
  LoadingBlock,
  Preview,
  ReleaseAvatar,
  ReleaseForm,
  useDocumentOperation,
  useDocumentStore,
  usePerspective,
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
}): JSX.Element {
  const {onClose, documentId, documentType, tone, title} = props
  const toast = useToast()

  const {setPerspective} = usePerspective()
  const schema = useSchema()
  const schemaType = schema.get(documentType)

  const documentStore = useDocumentStore()
  const [newReleaseId] = useState(createReleaseId())

  const [value, setValue] = useState((): FormReleaseDocument => {
    return {
      _id: newReleaseId,
      _type: 'release',
      title: '',
      description: '',
      hue: 'gray',
      icon: 'cube',
      releaseType: DEFAULT_RELEASE_TYPE,
    } as const
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const telemetry = useTelemetry()
  const {createRelease} = useReleaseOperations()

  const publishedId = getPublishedId(documentId)

  const {createVersion} = useDocumentOperation(
    publishedId,
    documentType,
    getVersionFromId(documentId),
  )

  const handleOnChange = useCallback((changedValue: FormReleaseDocument) => {
    setValue(changedValue)
  }, [])

  const handleAddVersion = useCallback(async () => {
    // set up the listener before executing
    const createVersionSuccess = firstValueFrom(
      documentStore.pair
        .operationEvents(getPublishedId(documentId), documentType)
        .pipe(filter((e) => e.op === 'createVersion' && e.type === 'success')),
    )

    const docId = getVersionId(publishedId, newReleaseId)

    createVersion.execute(docId, getCreateVersionOrigin(documentId))

    // only change if the version was created successfully
    await createVersionSuccess
    setPerspective(newReleaseId)

    telemetry.log(AddedVersion, {
      schemaType: documentType,
      documentOrigin: origin,
    })
  }, [
    createVersion,
    documentId,
    documentStore.pair,
    documentType,
    newReleaseId,
    publishedId,
    setPerspective,
    telemetry,
  ])

  const handleCreateRelease = useCallback(async () => {
    try {
      setIsSubmitting(true)

      createRelease(value)

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
