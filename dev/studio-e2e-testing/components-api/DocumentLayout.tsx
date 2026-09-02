import {type DocumentLayoutProps} from 'sanity'
import {Flex} from 'ui5'

export function DocumentLayout(props: DocumentLayoutProps & {testId: string}) {
  const {testId} = props

  if (props.documentType !== 'formComponentsApi') {
    return props.renderDefault(props)
  }

  return (
    <Flex
      data-testid={testId}
      flexDirection="column"
      flexBasis="0%"
      flexGrow={1}
      height="100%"
      overflow="hidden"
    >
      {props.renderDefault(props)}
    </Flex>
  )
}
