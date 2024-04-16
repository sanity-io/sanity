// https://github.com/sanity-io/sanity/blob/next/packages/@sanity/desk-tool/src/components/DraftStatus.tsx

import {EditIcon} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'
import {Box, Text} from '@sanity/ui'

import {Tooltip} from '../../../../../ui-components'
import {TextWithTone} from '../../../../components/textWithTone'
import {TimeAgo} from './TimeAgo'

export const DraftStatus = ({document}: {document?: SanityDocument | null}) => (
  <Tooltip
    content={
      <Box padding={2}>
        <Text size={1}>
          {document ? (
            <>Edited {document?._updatedAt && <TimeAgo time={document?._updatedAt} />}</>
          ) : (
            <>No unpublished edits</>
          )}
        </Text>
      </Box>
    }
    portal
  >
    <TextWithTone tone="caution" dimmed={!document} muted={!document} size={1}>
      <EditIcon />
    </TextWithTone>
  </Tooltip>
)
