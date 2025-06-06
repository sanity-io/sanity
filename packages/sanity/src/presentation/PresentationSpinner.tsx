import {Flex, Spinner} from '@sanity/ui-v3'

export function PresentationSpinner(): React.JSX.Element {
  return (
    <Flex align="center" direction="column" height="fill" justify="center" style={{width: '100%'}}>
      <Spinner />
    </Flex>
  )
}
