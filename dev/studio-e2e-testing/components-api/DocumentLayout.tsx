import {Flex} from '@sanity/ui'
import {DocumentLayoutProps} from 'sanity'

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
