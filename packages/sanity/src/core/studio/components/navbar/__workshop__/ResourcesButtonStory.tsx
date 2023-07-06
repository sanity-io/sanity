import {Flex} from '@sanity/ui'
import React from 'react'
import {ResourcesButton} from '../resources/ResourcesButton'

export default function ResourcesButtonStory() {
  return (
    <Flex justify="center" align="center" paddingTop={3}>
      <ResourcesButton />
    </Flex>
  )
}
