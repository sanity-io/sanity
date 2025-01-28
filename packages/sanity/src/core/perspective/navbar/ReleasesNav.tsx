import {CloseIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Box, Button, Card, Flex} from '@sanity/ui'
import {AnimatePresence} from 'framer-motion'

import {usePerspective} from '../../perspective/usePerspective'
import {useSetPerspective} from '../../perspective/useSetPerspective'
import {LATEST} from '../../releases/util/const'
import {isDraftPerspective} from '../../releases/util/util'
import {useWorkspace} from '../../studio'
import {ReleasesToolLink} from '../ReleasesToolLink'
import {CurrentGlobalPerspectiveLabel} from './currentGlobalPerspectiveLabel'
import {GlobalPerspectiveMenu} from './GlobalPerspectiveMenu'

export function ReleasesNav(): React.JSX.Element {
  const areReleasesEnabled = !!useWorkspace().releases?.enabled

  const {selectedPerspective, selectedReleaseId} = usePerspective()
  const setPerspective = useSetPerspective()

  const handleClearPerspective = () => setPerspective(LATEST)

  return (
    <Card flex="none" border marginRight={1} radius="full" tone="inherit" style={{margin: -1}}>
      <Flex gap={0}>
        {areReleasesEnabled && (
          <Box data-testid="releases-tool-link" flex="none">
            <ReleasesToolLink />
          </Box>
        )}
        <AnimatePresence>
          <CurrentGlobalPerspectiveLabel selectedPerspective={selectedPerspective} />
        </AnimatePresence>
        <GlobalPerspectiveMenu
          selectedReleaseId={selectedReleaseId}
          areReleasesEnabled={areReleasesEnabled}
        />
        {!isDraftPerspective(selectedPerspective) && (
          <div>
            <Button
              icon={CloseIcon}
              mode="bleed"
              onClick={handleClearPerspective}
              data-testid="clear-perspective-button"
              padding={2}
              radius="full"
            />
          </div>
        )}
      </Flex>
    </Card>
  )
}
