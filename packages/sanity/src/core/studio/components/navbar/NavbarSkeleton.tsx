import {Card, TextSkeleton} from '@sanity/ui'
import {Box} from 'ui5'

/**
 * Placeholder for the studio navbar while a lazy navbar component loads. Uses the navbar's card
 * padding and a button's padding around a size 2 text line, the tallest row item in `StudioNavbar`
 * (the releases tool link is a size 2 icon button), so the tool area does not shift when the navbar
 * mounts.
 *
 * @internal
 */
export function NavbarSkeleton() {
  return (
    <Card borderBottom data-testid="studio-navbar-skeleton" padding={3} sizing="border">
      <Box padding={2}>
        <TextSkeleton animated radius={1} size={2} style={{width: 120}} />
      </Box>
    </Card>
  )
}
