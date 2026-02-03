import {Flex} from '@sanity/ui'

import {ResourcesButton} from '../resources/ResourcesButton'

export default function ResourcesButtonStory() {
  return (
    <Flex justify="center" align="center" paddingTop={3}>
      <ResourcesButton />
    </Flex>
  )
}
