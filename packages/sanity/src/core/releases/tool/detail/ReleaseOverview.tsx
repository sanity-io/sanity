import {DocumentsIcon} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'
import {AvatarStack, Box, Card, Flex, Heading, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {
  BundleIconEditorPicker,
  type BundleIconEditorPickerValue,
} from '../../../bundles/components/dialog/BundleIconEditorPicker'
import {RelativeTime} from '../../../components/RelativeTime'
import {UserAvatar} from '../../../components/userAvatar/UserAvatar'
import {type BundleDocument} from '../../../store/bundles/types'
import {useAddonDataset} from '../../../studio/addonDataset/useAddonDataset'
import {Chip} from '../../components/Chip'
import {DocumentTable} from './documentTable'

export function ReleaseOverview(props: {documents: SanityDocument[]; release: BundleDocument}) {
  const {documents, release} = props
  const {client} = useAddonDataset()
  /**
   * This state is created here but will be updated by the DocumentRow component when fetching the history
   */
  const [collaborators, setCollaborators] = useState<string[]>([])
  const [iconValue, setIconValue] = useState<BundleIconEditorPickerValue>({
    hue: release.hue ?? 'gray',
    icon: release.icon ?? 'documents',
  })
  const toast = useToast()
  const handleIconValueChange = useCallback(
    async (value: {hue: BundleDocument['hue']; icon: BundleDocument['icon']}) => {
      if (!client) {
        toast.push({
          closable: true,
          status: 'error',
          title: 'Failed to save changes',
          description: 'AddonDataset client not found',
        })
        return
      }

      setIconValue(value)
      try {
        await client?.patch(release._id).set(value).commit()
      } catch (e) {
        toast.push({
          closable: true,
          status: 'error',
          title: 'Failed to save changes',
        })
      }
    },
    [client, release._id, toast],
  )

  return (
    <Stack paddingX={4} space={5}>
      <Stack space={4}>
        <Flex>
          <BundleIconEditorPicker onChange={handleIconValueChange} value={iconValue} />
        </Flex>

        <Heading size={2} style={{margin: '1px 0'}} as="h1">
          {release.title}
        </Heading>

        {release.description && (
          <Text muted size={2} style={{maxWidth: 600}}>
            {release.description}
          </Text>
        )}

        <Flex>
          <Flex flex={1} gap={2}>
            <Chip
              text={<>{documents.length} documents</>}
              icon={
                <Text size={1}>
                  <DocumentsIcon />
                </Text>
              }
            />

            {/* Created */}
            <Chip
              avatar={<UserAvatar size={0} user={release.authorId} />}
              text={
                <span>
                  Created <RelativeTime time={release._createdAt} useTemporalPhrase />
                </span>
              }
            />

            {/* Published */}
            {!release.archived && (
              <Chip
                avatar={
                  release.publishedBy ? <UserAvatar size={0} user={release.publishedBy} /> : null
                }
                text={
                  release.publishedAt ? (
                    <span>
                      Published <RelativeTime time={release.publishedAt} useTemporalPhrase />
                    </span>
                  ) : (
                    'Not published'
                  )
                }
              />
            )}

            {/* Contributors */}
            <Box padding={1}>
              <AvatarStack size={0} style={{margin: -1}}>
                {collaborators?.map((userId) => <UserAvatar key={userId} user={userId} />)}
              </AvatarStack>
            </Box>
          </Flex>
        </Flex>
      </Stack>

      {documents.length === 0 && (
        <Card border padding={4} radius={3}>
          <Text align="center" muted size={1}>
            No documents
          </Text>
        </Card>
      )}

      {documents.length > 0 && (
        <DocumentTable
          documents={documents}
          release={release}
          setCollaborators={setCollaborators}
        />
      )}
    </Stack>
  )
}
