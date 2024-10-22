import {AddIcon, EditIcon} from '@sanity/icons'
import {Badge, Box, Flex, Stack, Text, Tooltip} from '@sanity/ui'

import {type ReleasesMetadata} from '../../../store/release/useReleasesMetadata'

type Props = {
  releaseDocumentMetadata: ReleasesMetadata
}

export const ReleaseDocumentsCounter = ({releaseDocumentMetadata}: Props) => {
  const {documentCount, existingDocumentCount: changedExistingDocumentCount} =
    releaseDocumentMetadata
  const newDocumentCount = documentCount - changedExistingDocumentCount

  return (
    <Tooltip
      content={
        <Stack space={1}>
          {newDocumentCount > 0 && (
            <Flex gap={3} padding={2}>
              <Box flex="none">
                <Text size={1}>
                  <AddIcon color="primary" />
                </Text>
              </Box>
              <Box flex={1}>
                <Text size={1}>{newDocumentCount} added documents</Text>
              </Box>
            </Flex>
          )}
          {changedExistingDocumentCount > 0 && (
            <Flex gap={3} padding={2}>
              <Box flex="none">
                <Text size={1}>
                  <EditIcon color="caution" />
                </Text>
              </Box>
              <Box flex={1}>
                <Text size={1}>{changedExistingDocumentCount} changed documents</Text>
              </Box>
            </Flex>
          )}
        </Stack>
      }
      padding={1}
      portal
      style={{overflow: 'hidden'}}
    >
      <Flex gap={1}>
        {newDocumentCount > 0 && (
          <Badge tone="primary" style={{minWidth: 9, textAlign: 'center'}}>
            {newDocumentCount}
          </Badge>
        )}
        {changedExistingDocumentCount > 0 && (
          <Badge tone="caution" style={{minWidth: 9, textAlign: 'center'}}>
            {changedExistingDocumentCount}
          </Badge>
        )}
      </Flex>
    </Tooltip>
  )
}
