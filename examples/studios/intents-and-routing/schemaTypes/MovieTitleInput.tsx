import {Stack} from '@sanity/ui'
import {IntentLink} from 'sanity/router'
import {Flex} from 'ui5'

export function MovieTitleInput(props) {
  return (
    <Stack gap={4}>
      <Flex>
        <IntentLink intent="approve" params={{foo: 'bar'}}>
          Approve
        </IntentLink>
      </Flex>

      {props.renderDefault(props)}
    </Stack>
  )
}
