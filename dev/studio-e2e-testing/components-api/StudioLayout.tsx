import {type LayoutProps} from 'sanity'
import {Flex} from 'ui5'

export function StudioLayout(props: LayoutProps & {testId: string}) {
  const {testId} = props

  return (
    <Flex data-testid={testId} flexDirection="column" height="100%" overflow="hidden">
      {props.renderDefault(props)}
    </Flex>
  )
}
