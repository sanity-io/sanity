import {Flex} from '@sanity/ui'
// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {type DocumentLayoutProps} from 'sanity'

export function DocumentLayout(props: DocumentLayoutProps & {testId: string}) {
  const {testId} = props

  if (props.documentType !== 'formComponentsApi') {
    return props.renderDefault(props)
  }

  return (
    // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
    <Flex data-testid={testId} direction="column" flex={1} height="fill" overflow="hidden">
      {props.renderDefault(props)}
    </Flex>
  )
}
