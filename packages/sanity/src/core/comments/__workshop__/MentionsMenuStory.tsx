import {Container, Flex} from '@sanity/ui'

import {useUserListWithPermissions} from '../../hooks/useUserListWithPermissions'
import {MentionsMenu} from '../components/mentions/MentionsMenu'

const DOC = {
  documentValue: {
    _id: 'xyz123',
    _type: 'author',
    _rev: '1',
    _createdAt: '2021-05-04T14:54:37Z',
    _updatedAt: '2021-05-04T14:54:37Z',
  },
  permission: 'read' as const,
}

export default function MentionsMenuStory() {
  const {data, loading} = useUserListWithPermissions(DOC)

  return (
    <Flex height="fill" align="center">
      <Container width={0}>
        <MentionsMenu
          options={data}
          loading={loading}
          onSelect={() => {
            //...
          }}
        />
      </Container>
    </Flex>
  )
}
