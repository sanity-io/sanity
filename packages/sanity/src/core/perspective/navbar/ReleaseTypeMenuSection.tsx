import {type ReleaseDocument} from '@sanity/client'
import {Card, Flex, Label, Stack} from '@sanity/ui'
import {Box} from 'ui5'

import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {GlobalPerspectiveMenuItem} from './GlobalPerspectiveMenuItem'

/**
 * One divider-separated group of releases in the perspective menu, with an
 * optional heading.
 *
 * The heading is supplied rather than derived from the release type because the
 * document-selected layout groups by type but labels only the first group — see
 * `ReleaseMenuSections`.
 */
export function ReleaseTypeMenuSection({
  releases,
  heading,
  menuItemProps,
  'data-testid': dataTestId,
}: {
  'releases': ReleaseDocument[]
  'heading'?: string
  'menuItemProps'?: ReleasesNavMenuItemPropsGetter
  'data-testid'?: string
}): React.JSX.Element | null {
  if (releases.length === 0) return null

  return (
    <Card padding={1} borderBottom data-testid={dataTestId}>
      <Stack gap={1}>
        {heading && (
          <Box paddingLeft={2} paddingTop={3} paddingBottom={1}>
            <Label muted style={{textTransform: 'uppercase'}} size={1}>
              {heading}
            </Label>
          </Box>
        )}
        <Flex direction="column" gap={1}>
          {releases.map((release) => (
            <GlobalPerspectiveMenuItem
              key={release._id}
              release={release}
              menuItemProps={menuItemProps}
            />
          ))}
        </Flex>
      </Stack>
    </Card>
  )
}
