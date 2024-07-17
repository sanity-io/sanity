import {type PreviewValue, type SanityDocument} from '@sanity/types'
import {AvatarStack, Box, Flex} from '@sanity/ui'

import {RelativeTime} from '../../../../components/RelativeTime'
import {UserAvatar} from '../../../../components/userAvatar/UserAvatar'
import {type BundleDocument} from '../../../../store/bundles/types'
import {Chip} from '../../../components/Chip'
import {ReleaseDocumentPreview} from '../../../components/ReleaseDocumentPreview'

export function DocumentReviewHeader({
  previewValues,
  document,
  isLoading,
  history,
  release,
}: {
  document: SanityDocument
  previewValues: PreviewValue
  isLoading: boolean
  release: BundleDocument
  history?: {
    createdBy: string
    lastEditedBy: string
    editors: string[]
  }
}) {
  return (
    <Flex justify="space-between" align="center">
      <Box padding={1} style={{flex: '1'}}>
        <ReleaseDocumentPreview
          documentId={document._id}
          documentTypeName={document._type}
          releaseSlug={release.slug}
          previewValues={previewValues}
          isLoading={isLoading}
        />
      </Box>
      <Flex gap={2} padding={3} style={{flexShrink: 0}}>
        {history?.createdBy && (
          <Chip
            avatar={<UserAvatar size={0} user={history?.createdBy} />}
            text={
              <span>
                Created <RelativeTime time={document._createdAt} useTemporalPhrase />
              </span>
            }
          />
        )}
        {history?.lastEditedBy && (
          <Chip
            avatar={<UserAvatar size={0} user={history?.lastEditedBy} />}
            text={
              <span>
                Edited <RelativeTime time={document._updatedAt} useTemporalPhrase />
              </span>
            }
          />
        )}
        <Box padding={1}>
          <AvatarStack size={0} style={{margin: -1}}>
            {history?.editors?.map((userId) => <UserAvatar key={userId} user={userId} />)}
          </AvatarStack>
        </Box>
      </Flex>
    </Flex>
  )
}
