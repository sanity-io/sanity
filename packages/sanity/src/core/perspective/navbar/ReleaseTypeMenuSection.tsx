import {type ReleaseDocument} from '@sanity/client'
import {Card, Label, Stack, Text} from '@sanity/ui'
import {styled} from 'styled-components'
import {Box, Flex} from 'ui5'

import {stickyMenuHeadingStyle} from '../styles'
import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {GlobalPerspectiveMenuItem} from './GlobalPerspectiveMenuItem'

const StickyHeading = styled.div`
  ${stickyMenuHeadingStyle}
`

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
  searchTerm,
  renderWhenEmpty,
  emptyMessage,
  'data-testid': dataTestId,
}: {
  'releases': ReleaseDocument[]
  'heading'?: string
  'menuItemProps'?: ReleasesNavMenuItemPropsGetter
  /** Passed through so each row can mark where the term appears in its title. */
  'searchTerm'?: string
  /**
   * Render the heading even with no releases under it.
   *
   * The `Releases` label names what the list is, so it has to survive the workspace having no
   * releases yet — that is the state where a reader most needs telling. Every other section drops
   * out when empty, which is what keeps unused time bands from drawing rules.
   */
  'renderWhenEmpty'?: boolean
  /**
   * Statement shown in place of the (empty) list, only while `renderWhenEmpty` is keeping the
   * heading up with no releases underneath it. A no-releases-at-all state is not the same as a
   * filter matching nothing, so this is unrelated to `release-menu-no-results`.
   */
  'emptyMessage'?: string
  'data-testid'?: string
}): React.JSX.Element | null {
  if (releases.length === 0 && !(renderWhenEmpty && heading)) return null

  return (
    <Card padding={1} borderBottom data-testid={dataTestId}>
      {/*
        The stack sets no gap and the heading carries the whole space below it as
        padding instead. A gap would leave a transparent strip that rows flicker
        through as they scroll under the pinned heading.
      */}
      <Stack gap={0}>
        {heading && (
          <StickyHeading>
            <Box paddingLeft={2} paddingTop={3} paddingBottom={2}>
              <Label muted style={{textTransform: 'uppercase'}} size={1}>
                {heading}
              </Label>
            </Box>
          </StickyHeading>
        )}
        {releases.length === 0 && emptyMessage ? (
          <Box paddingLeft={2} paddingBottom={2}>
            <Text data-testid="release-menu-no-releases" muted size={1}>
              {emptyMessage}
            </Text>
          </Box>
        ) : (
          <Flex flexDirection="column" gap={1}>
            {releases.map((release) => (
              <GlobalPerspectiveMenuItem
                key={release._id}
                release={release}
                menuItemProps={menuItemProps}
                searchTerm={searchTerm}
              />
            ))}
          </Flex>
        )}
      </Stack>
    </Card>
  )
}
