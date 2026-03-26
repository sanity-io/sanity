import {AsteriskIcon} from '@sanity/icons'
import {Button, Card, Dialog, TextInput, Stack, Text, Flex} from '@sanity/ui'
import {useState} from 'react'
import {
  useClient,
  type DocumentActionComponent,
  type DocumentActionDescription,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  getPublishedId,
  useSetPerspective,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

export const useCreateAnonymousVersion: DocumentActionComponent = (props) => {
  const [open, setOpen] = useState<boolean>(false)
  const [status, setStatus] = useState<'idle' | 'creating' | 'created' | 'error'>('idle')
  const [error, setError] = useState<Error | null>(null)
  const setPerspective = useSetPerspective()
  const toggleOpen = () => setOpen((v) => !v)
  const {displayed} = useDocumentPane()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!displayed?._id) return
    const formData = new FormData(event.target as HTMLFormElement)
    const name = formData.get('name')
    if (!name || typeof name !== 'string') {
      setError(new Error('Name is required and must be a string'))
      setStatus('error')
      return
    }
    setStatus('creating')
    try {
      const versionId = name.toLocaleLowerCase().replace(/ /g, '-')
      await client.createVersion({
        baseId: displayed._id,
        publishedId: getPublishedId(displayed._id),
        releaseId: versionId,
      })
      setStatus('created')
      toggleOpen()
      setPerspective(versionId)
    } catch (err) {
      setStatus('error')
      if (err instanceof Error) {
        setError(err)
      } else {
        setError(new Error('Unknown error', {cause: err}))
      }
    }
  }

  return {
    label: 'Create anonymous version',
    tone: 'default',
    icon: AsteriskIcon,
    onHandle: toggleOpen,
    dialog: {
      type: 'custom',
      component: open && (
        <Dialog
          header="Create anonymous version"
          id="create-anonymous-version-dialog"
          onClickOutside={toggleOpen}
          onClose={toggleOpen}
          width={1}
        >
          <Card padding={5}>
            <form onSubmit={handleSubmit}>
              <Stack space={3}>
                <Stack space={4}>
                  <Text size={1}>
                    Create an anonymous version of the document. This will create a new document
                    with the same content as the original document, but with a new ID.
                  </Text>
                  <TextInput
                    placeholder="agent-<version-name>"
                    type="text"
                    name="name"
                    label="Name"
                  />
                </Stack>
                {status === 'error' && error && (
                  <Card tone="critical" padding={3}>
                    <Text size={0}>{error.message}</Text>
                  </Card>
                )}
                <Flex justify="flex-end" gap={2}>
                  <Button mode="bleed" onClick={toggleOpen} text="Close" />
                  <Button
                    mode="default"
                    type="submit"
                    text="Create"
                    loading={status === 'creating'}
                    disabled={status === 'creating'}
                  />
                </Flex>
              </Stack>
            </form>
          </Card>
        </Dialog>
      ),
    },
  } satisfies DocumentActionDescription
}

useCreateAnonymousVersion.displayName = 'CreateAnonymousVersion'
