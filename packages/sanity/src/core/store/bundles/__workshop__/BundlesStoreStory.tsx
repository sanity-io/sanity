import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type ComponentType, type FormEvent, useCallback, useState} from 'react'

import {Button} from '../../../../ui-components'
import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {AddonDatasetProvider} from '../../../studio/addonDataset/AddonDatasetProvider'
import {BundleForm} from '../../../versions/components/dialog/BundleForm'
import {BundlesProvider, useBundles} from '../BundlesProvider'
import {type BundleDocument} from '../types'
import {useBundleOperations} from '../useBundleOperations'

const WithAddonDatasetProvider = <P extends object>(Component: ComponentType<P>): React.FC<P> => {
  const WrappedComponent: React.FC<P> = (props) => (
    <AddonDatasetProvider>
      <BundlesProvider>
        <Component {...props} />
      </BundlesProvider>
    </AddonDatasetProvider>
  )
  WrappedComponent.displayName = `WithAddonDatasetProvider(${Component.displayName || Component.name || 'Component'})`

  return WrappedComponent
}

const initialValue = {name: '', title: '', tone: undefined, publishAt: undefined}
const BundlesStoreStory = () => {
  const {data, loading} = useBundles()
  const {createBundle, deleteBundle} = useBundleOperations()
  const [creating, setCreating] = useState(false)
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

  const handleDeleteBundle = useCallback(
    async (id: string) => {
      try {
        setDeleting(id)
        await deleteBundle(id)
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
        <Card margin={3} padding={3} border>
          <form onSubmit={handleCreateBundle}>
            <Stack space={4}>
              <Text weight="medium">Create a new release</Text>
              <BundleForm onChange={setValue} value={value} />
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
        <Card margin={3} border padding={3}>
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
                <Text>{bundle.name}</Text>
                <Button
                  text="Delete"
                  tone="critical"
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={() => handleDeleteBundle(bundle._id)}
                  disabled={deleting === bundle._id}
                  loading={deleting === bundle._id}
                />
              </Flex>
            </Card>
          ))}
        </Stack>
      </Card>
    </Stack>
  )
}

export default WithAddonDatasetProvider(BundlesStoreStory)
