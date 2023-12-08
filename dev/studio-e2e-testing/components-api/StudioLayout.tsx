import {Flex} from '@sanity/ui'
import {LayoutProps} from 'sanity'

export function StudioLayout(props: LayoutProps & {testId: string}) {
  const {testId} = props

  return (
    <Flex data-testid={testId} direction="column" height="fill" overflow="hidden">
      {props.renderDefault(props)}
    </Flex>
  )
}
