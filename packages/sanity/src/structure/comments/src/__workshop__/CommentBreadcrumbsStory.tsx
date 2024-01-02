import React from 'react'
import {Flex} from '@sanity/ui'
import {useNumber} from '@sanity/ui-workshop'
import {CommentBreadcrumbs} from '../components'

export default function CommentBreadcrumbsStory() {
  const maxLength = useNumber('Max length', 3, 'Props') || 3

  return (
    <Flex align="center" height="fill" justify="center">
      <CommentBreadcrumbs
        titlePath={['First', 'Second', 'Third', 'Fourth', 'Sixth']}
        maxLength={maxLength}
      />
    </Flex>
  )
}
