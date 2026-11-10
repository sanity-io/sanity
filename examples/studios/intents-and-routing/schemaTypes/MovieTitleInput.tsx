import {IntentLink} from 'sanity/router'
import {Flex, VStack} from 'ui5'

export function MovieTitleInput(props) {
  return (
    <VStack gap={4}>
      <Flex>
        <IntentLink intent="approve" params={{foo: 'bar'}}>
          Approve
        </IntentLink>
      </Flex>

      {props.renderDefault(props)}
    </VStack>
  )
}
