import {Flex, Stack} from '@sanity/ui'
import {IntentLink} from 'sanity/router'

export function MovieTitleInput(props) {
  return (
    <Stack space={4}>
      <Flex>
        <IntentLink intent="approve" params={{foo: 'bar'}}>
          Approve
        </IntentLink>
      </Flex>

      {props.renderDefault(props)}
    </Stack>
  )
}
