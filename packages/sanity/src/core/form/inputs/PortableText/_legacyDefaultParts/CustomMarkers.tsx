/* oxlint-disable i18next/no-literal-string */
import {Text} from 'ui5'

// This is the fallback marker renderer if the block editor didn't get the 'renderCustomMarkers' prop
// You will probably only see this when you first start to play with custom markers as a developer
export function DefaultCustomMarkers() {
  return (
    <Text size={1} as="div" trim={true}>
      This is a example custom marker, please implement <code>renderCustomMarkers</code> function.
    </Text>
  )
}
