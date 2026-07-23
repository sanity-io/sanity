import {Flex} from '@sanity/ui'
// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {type LayoutProps} from 'sanity'

export function StudioLayout(props: LayoutProps & {testId: string}) {
  const {testId} = props

  return (
    // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
    <Flex data-testid={testId} direction="column" height="fill" overflow="hidden">
      {props.renderDefault(props)}
    </Flex>
  )
}
