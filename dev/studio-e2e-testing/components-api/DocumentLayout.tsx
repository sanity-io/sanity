import {Flex} from '@sanity/ui'
import {type DocumentLayoutProps} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

export function DocumentLayout(props: DocumentLayoutProps & {testId: string}) {
  const {testId} = props

  if (props.documentType !== 'formComponentsApi') {
    return props.renderDefault(props)
  }

  return (
    <Flex data-testid={testId} direction="column" flex={1} height="fill" overflow="hidden">
      {props.renderDefault(props)}
    </Flex>
  )
}
