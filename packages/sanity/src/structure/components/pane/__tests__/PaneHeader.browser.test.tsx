import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {StarIcon} from '@sanity/icons/Star'
import {Text} from '@sanity/ui'
import {expect, test} from 'vitest'
import {render} from 'vitest-browser-react'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {Button} from '../../../../ui-components/button/Button'
import {PaneHeader} from '../PaneHeader'

// Alignment is computed CSS (TitleCard padding vs bleed Button height). jsdom
// disables vanilla-extract runtime styles, so this cannot live in the unit suite.

function PaneHeaderBackButtonStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <PaneHeader
        title="Metronomy"
        backButton={
          <Button
            data-testid="pane-back"
            icon={ArrowLeftIcon}
            mode="bleed"
            tooltipProps={{content: 'Back'}}
          />
        }
        appendTitle={
          <Button
            data-testid="pane-star"
            mode="bleed"
            aria-label="Add to favorites"
            tooltipProps={{
              content: <Text size={1}>Add to favorites</Text>,
              placement: 'right',
            }}
          >
            <Text size={1}>
              <StarIcon />
            </Text>
          </Button>
        }
      />
    </TestWrapper>
  )
}

function verticalCentre(rect: DOMRect): number {
  return rect.top + rect.height / 2
}

test('vertically centres the back button with appendTitle when both are bleed Buttons', async () => {
  const {container} = await render(<PaneHeaderBackButtonStory />)

  await expect.poll(() => container.querySelector('[data-testid="pane-back"]')).not.toBeNull()
  await expect.poll(() => container.querySelector('[data-testid="pane-star"]')).not.toBeNull()

  const backButton = container.querySelector('[data-testid="pane-back"]')
  const starButton = container.querySelector('[data-testid="pane-star"]')
  if (!backButton || !starButton) {
    throw new Error('Expected to find the pane back button and favourite toggle')
  }

  expect(
    Math.abs(
      verticalCentre(backButton.getBoundingClientRect()) -
        verticalCentre(starButton.getBoundingClientRect()),
    ),
  ).toBeLessThan(2)
})
