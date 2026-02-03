import {CommentBreadcrumbs} from '../components'
import {Flex} from '@sanity/ui'
import {useNumber} from '@sanity/ui-workshop'

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
