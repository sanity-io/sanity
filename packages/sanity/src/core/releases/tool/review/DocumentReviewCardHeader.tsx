import {EllipsisHorizontalIcon} from '@sanity/icons'
import {AvatarStack, Box, Button, Card, Flex} from '@sanity/ui'
import {type DocumentSchemaType} from 'groq-js'
import {UserAvatar, useSchema} from 'sanity'

import {Chip} from './Chip'

export function DocumentReviewCardHeader(props: {
  documentId: string
  documentTypeName: string
  releaseName: string
}): JSX.Element {
  const {documentId, documentTypeName, releaseName} = props
  const document = {
    _createdAt: '2021-09-01T12:00:00Z',
    _createdBy: 'user-1',
    _updatedAt: '2021-09-01T12:00:00Z',
    _updatedBy: 'user-1',
    _publishedAt: '2021-09-01T12:00:00Z',
    _publishedBy: 'user-1',
    _archivedAt: '2021-09-01T12:00:00Z',
    _users: ['user-1', 'user-2'],
  }
  const {
    _createdBy,
    _createdAt,
    _updatedBy,
    _updatedAt,
    _publishedBy,
    _publishedAt,
    _archivedAt,
    _users,
  } = document // TODO: get these values from the document

  const schema = useSchema()
  const schemaType = schema.get(documentTypeName) as DocumentSchemaType | undefined

  //const {type, id, createdBy, createdAt, updatedBy, updatedAt, publishedBy, publishedAt, users} =

  //const release = useBundles(releaseName)
  //const version = useDocumentVersion(documentId, releaseName)

  /*const {imageUrl, subtitle, title} = useDocumentPreview(
    documentId,
    releaseName,
    schemaType?.options?.valuePreview,
  )

  if (!version) return null*/

  return (
    <Flex>
      <Box flex={1} padding={1}>
        <Card
          as="a"
          //href={`/structure/${version._type}/${version._id}?version=${releaseName}`}
          //onClick={handleLinkClick}
          padding={2}
          radius={2}
        >
          {schemaType && <div>"object preview here" {/*TODO */}</div>}
        </Card>
      </Box>

      <Flex align="center" gap={2} padding={3} sizing="border">
        <Chip
          avatar={_createdBy ? <UserAvatar size={0} user={_createdBy} /> : null}
          text={_createdAt ? `Created ${_createdAt}` : 'Not created'}
        />

        <Chip
          avatar={_updatedBy ? <UserAvatar size={0} user={_updatedBy} /> : null}
          text={_updatedAt ? `Edited ${_updatedAt}` : 'Not edited'}
        />

        {/* Published */}
        {_publishedAt && (
          <Chip
            avatar={_publishedBy ? <UserAvatar size={0} user={_publishedBy} /> : null}
            text={`Published ${_publishedAt}`}
          />
        )}

        <Box padding={1} paddingRight={2}>
          <AvatarStack maxLength={3} size={0} style={{margin: -1}}>
            {_users.map((userId) => (
              <UserAvatar key={userId} user={userId} />
            ))}
          </AvatarStack>
        </Box>
      </Flex>

      <Flex align="center" flex="none" hidden padding={3} paddingLeft={2}>
        <Button
          disabled={Boolean(_archivedAt || _publishedAt)}
          icon={EllipsisHorizontalIcon}
          mode="bleed"
          padding={2}
        />
      </Flex>
    </Flex>
  )
}
