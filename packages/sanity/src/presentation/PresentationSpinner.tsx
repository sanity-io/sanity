import {Spinner} from '@sanity/ui'
import {Flex} from 'ui5'

export function PresentationSpinner(): React.JSX.Element {
  return (
    <Flex
      alignItems="center"
      flexDirection="column"
      height="100%"
      justifyContent="center"
      style={{width: '100%'}}
    >
      <Spinner />
    </Flex>
  )
}
