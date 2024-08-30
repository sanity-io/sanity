import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type ComponentType, type FormEvent, useCallback, useState} from 'react'

import {Button, Dialog} from '../../../../ui-components'
import {BundleForm} from '../../../bundles/components/dialog/BundleForm'
import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {AddonDatasetProvider} from '../../../studio/addonDataset/AddonDatasetProvider'
import {type BundleDocument} from '../types'
import {useBundleOperations} from '../useBundleOperations'
import {useBundles} from '../useBundles'

const withAddonDatasetProvider = <P extends object>(Component: ComponentType<P>): React.FC<P> => {
  const WrappedComponent: React.FC<P> = (props) => (
    <AddonDatasetProvider>
      <Component {...props} />
    </AddonDatasetProvider>
  )
  WrappedComponent.displayName = `WithAddonDatasetProvider(${Component.displayName || Component.name || 'Component'})`

  return WrappedComponent
}

const initialValue = {name: '', title: '', tone: undefined /*, publishAt: undefined*/}

const BundlesStoreStory = () => {
  const {data, loading} = useBundles()
  const {createBundle, deleteBundle, updateBundle} = useBundleOperations()
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [editing, setEditing] = useState<BundleDocument | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [value, setValue] = useState<Partial<BundleDocument>>(initialValue)
  const handleCreateBundle = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      try {
        event.preventDefault()
        setCreating(true)
        await createBundle(value)
        setValue(initialValue)
      } catch (err) {
        console.error(err)
      } finally {
        setCreating(false)
      }
    },
    [createBundle, value],
  )

  const handleUpdateBundle = useCallback(
    async (bundle: BundleDocument) => {
      try {
        setUpdating(true)
        await updateBundle(bundle)
        setUpdating(false)
        setEditing(null)
      } catch (err) {
        console.error(err)
      }
    },
    [updateBundle],
  )

  const handleDeleteBundle = useCallback(
    async (bundle: BundleDocument) => {
      try {
        setDeleting(bundle._id)
        await deleteBundle(bundle)
      } catch (err) {
        console.error(err)
      } finally {
        setDeleting(null)
      }
    },
    [deleteBundle],
  )

  return (
    <Stack space={3}>
      <Flex gap={2}>
        <Card margin={3} padding={3} border style={{maxWidth: '50%'}}>
          <form onSubmit={handleCreateBundle}>
            <Stack space={4}>
              <Text weight="medium">Create a new release</Text>
              <BundleForm onChange={setValue} value={value} onError={() => {}} />
              <Flex justify="flex-end">
                <Button
                  text="Create"
                  tone="primary"
                  type="submit"
                  disabled={creating}
                  loading={creating}
                />
              </Flex>
            </Stack>
          </form>
        </Card>
        <Card margin={3} border padding={3} style={{maxWidth: '50%'}}>
          <div style={{maxHeight: '400px', overflow: 'scroll'}}>
            <Text>Data</Text>
            {loading ? <LoadingBlock /> : <pre>{JSON.stringify(data, null, 2)}</pre>}
          </div>
        </Card>
      </Flex>
      <Card margin={3} border padding={3}>
        <Stack space={3}>
          {data?.map((bundle) => (
            <Card key={bundle._id} padding={3} border radius={3}>
              <Flex align="center" gap={3} justify={'space-between'}>
                <Text>{bundle._id}</Text>
                <Flex align="center" gap={2}>
                  <Button
                    text="Delete"
                    mode="bleed"
                    tone="critical"
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick={() => handleDeleteBundle(bundle)}
                    disabled={deleting === bundle._id}
                    loading={deleting === bundle._id}
                  />
                  <Button
                    text="Edit"
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick={() => setEditing(bundle)}
                    disabled={deleting === bundle._id}
                    loading={deleting === bundle._id}
                  />
                </Flex>
              </Flex>
            </Card>
          ))}
        </Stack>
      </Card>
      {editing && (
        <Dialog
          id="edit-bundle-dialog"
          header="Edit release"
          onClose={() => setEditing(null)}
          footer={{
            confirmButton: {
              onClick: () => handleUpdateBundle(editing),
              disabled: updating,
              loading: updating,
              tone: 'primary',
            },
          }}
        >
          {editing && (
            <BundleForm
              onError={() => {}}
              // eslint-disable-next-line react/jsx-no-bind
              onChange={(bundle) =>
                setEditing((prev) => ({
                  ...(prev as BundleDocument),
                  ...bundle,
                }))
              }
              value={editing}
            />
          )}
        </Dialog>
      )}
    </Stack>
  )
}

export default withAddonDatasetProvider(BundlesStoreStory)
