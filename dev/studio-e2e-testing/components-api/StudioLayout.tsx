import {Flex} from '@sanity/ui'
import {LayoutProps} from 'sanity'

export function StudioLayout(props: LayoutProps) {
  return (
    <Flex data-testid="config-studio-layout" direction="column" height="fill" overflow="hidden">
      {props.renderDefault(props)}
    </Flex>
  )
}
