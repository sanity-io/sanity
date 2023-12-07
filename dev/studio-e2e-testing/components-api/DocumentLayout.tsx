import {Flex} from '@sanity/ui'
import {DocumentLayoutProps} from 'sanity'

export function DocumentLayout(props: DocumentLayoutProps) {
  if (props.documentType !== 'formComponentsApi') {
    return props.renderDefault(props)
  }

  return (
    <Flex
      data-testid="config-document-layout"
      direction="column"
      flex={1}
      height="fill"
      overflow="hidden"
    >
      {props.renderDefault(props)}
    </Flex>
  )
}
