import {Flex, Spinner} from '@sanity/ui'

export function PresentationSpinner(): React.JSX.Element {
  return (
    <Flex align="center" direction="column" height="fill" justify="center" style={{width: '100%'}}>
      <Spinner />
    </Flex>
  )
}
