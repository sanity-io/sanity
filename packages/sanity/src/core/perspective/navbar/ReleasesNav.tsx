import {Card} from '@sanity/ui'
import {styled} from 'styled-components'

import {usePerspective} from '../../perspective/usePerspective'
import {useReleasesToolAvailable} from '../../releases/hooks/useReleasesToolAvailable'
import {ReleasesToolLink} from '../ReleasesToolLink'
import {CurrentGlobalPerspectiveLabel} from './currentGlobalPerspectiveLabel'
import {GlobalPerspectiveMenu} from './GlobalPerspectiveMenu'

const ReleasesNavContainer = styled(Card)`
  position: relative;
  display: flex;
  &:not([hidden]) {
    display: flex;
  }
  align-items: center;
  gap: 2px;
  padding: 2px;
  margin: -3px 0;

  // The children in button is rendered inside a span, we need to absolutely position the dot for the error.
  span:has(> [data-ui='error-status-icon']) {
    position: absolute;
    top: 6px;
    right: 6px;
    padding: 0;
  }

  a:hover,
  button:hover {
    position: relative;
    z-index: 2;
  }
`

export function ReleasesNav(): React.JSX.Element {
  const releasesToolAvailable = useReleasesToolAvailable()
  const {selectedPerspective, selectedReleaseId} = usePerspective()

  return (
    <ReleasesNavContainer flex="none" tone="inherit" radius="full" data-ui="ReleasesNav" border>
      {releasesToolAvailable && <ReleasesToolLink />}
      <CurrentGlobalPerspectiveLabel selectedPerspective={selectedPerspective} />
      <GlobalPerspectiveMenu
        selectedReleaseId={selectedReleaseId}
        areReleasesEnabled={releasesToolAvailable}
      />
    </ReleasesNavContainer>
  )
}
