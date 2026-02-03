import {MetaInfo} from '../diff'
import {ImageIcon} from '@sanity/icons'
import {Box, Card} from '@sanity/ui'

export default function MetaInfoStory() {
  return (
    <Box padding={4}>
      <MetaInfo action="Action" icon={ImageIcon} markRemoved title="Title">
        <Card tone="transparent">(children)</Card>
      </MetaInfo>
    </Box>
  )
}
