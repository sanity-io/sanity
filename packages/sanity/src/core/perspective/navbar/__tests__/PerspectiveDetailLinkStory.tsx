import {Card} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {
  PerspectiveDetailLink,
  renderWithDetailLinkSpace,
  usePerspectiveDetailLink,
} from '../PerspectiveDetailLink'

function DetailLinkRow(props: {releaseId: string; testId: string; title: string}) {
  const {releaseId, testId, title} = props
  const {menuItemProps, linkProps} = usePerspectiveDetailLink()

  return (
    <div data-detail-link-row="" data-testid={testId} style={{position: 'relative'}}>
      <MenuItem
        {...menuItemProps}
        data-testid={`${testId}-item`}
        renderMenuItem={renderWithDetailLinkSpace}
        text={title}
      />
      <PerspectiveDetailLink
        {...linkProps}
        alignItems="center"
        aria-label={`View ${title}`}
        data-testid={`release-detail-link-${releaseId}`}
        intent="release"
        paddingRight={3}
        params={{id: releaseId}}
        tooltip="View release"
      />
    </div>
  )
}

/**
 * Chromatic sentinel for the perspective-menu detail link: a Launch ghost
 * button laid over the end of its row, with the same width reserved inside
 * the menu item. The first list is the idle reserved-space layout. The
 * second forces the link visible the way hover / focus-within would, without
 * a pointer play — Storybook play does not toggle those CSS states.
 */
export function PerspectiveDetailLinkStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <style>
        {`[data-testid="detail-link-row-revealed"] > :last-child { opacity: 1 !important; }`}
      </style>
      <Card padding={4} style={{maxWidth: 320}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              reserved space
            </Text>
            <Card padding={1} radius={2} shadow={2}>
              <Menu>
                <DetailLinkRow
                  releaseId="rSummer"
                  testId="detail-link-row"
                  title="Summer campaign"
                />
                <DetailLinkRow
                  releaseId="rLong"
                  testId="detail-link-row-long"
                  title="Returning customers from the Nordic region"
                />
              </Menu>
            </Card>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              revealed
            </Text>
            <Card padding={1} radius={2} shadow={2}>
              <Menu>
                <DetailLinkRow
                  releaseId="rRevealed"
                  testId="detail-link-row-revealed"
                  title="Summer campaign"
                />
              </Menu>
            </Card>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
