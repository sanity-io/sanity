import {Flex, Stack} from '@sanity/ui'
import {styled} from 'styled-components'

import {CommentsUpsellProvider} from '../../../context/upsell/CommentsUpsellProvider'
import {useCommentsUpsell} from '../../../hooks/useCommentsUpsell'
import {CommentsUpsellPanel} from '../CommentsUpsellPanel'

const DOCUMENT_INSPECTOR_MAX_WIDTH = 540

const InspectorPanel = styled(Stack)`
  max-width: ${DOCUMENT_INSPECTOR_MAX_WIDTH}px;
`
const noop = () => null
const CommentsUpsellPanelStoryInner = () => {
  const {upsellData} = useCommentsUpsell()
  if (!upsellData) return null
  return (
    <Flex width="fill" justify="center">
      <InspectorPanel paddingX={3} paddingY={5}>
        <CommentsUpsellPanel data={upsellData} onPrimaryClick={noop} onSecondaryClick={noop} />
      </InspectorPanel>
    </Flex>
  )
}

const CommentsUpsellPanelStory = () => {
  return (
    <CommentsUpsellProvider>
      <CommentsUpsellPanelStoryInner />
    </CommentsUpsellProvider>
  )
}

export default CommentsUpsellPanelStory
