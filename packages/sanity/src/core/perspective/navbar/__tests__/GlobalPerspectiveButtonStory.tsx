import {Card} from '@sanity/ui'
import {Flex, Text} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {RhombusIcon} from '../../../components/temporary-icons/Rhombus'
import {GlobalPerspectiveButton} from '../GlobalPerspectiveButton'
import {suggestIconColor} from '../variants/VariantsNav.css'

/** The selected chip only needs the control mounted; the story does not change selection. */
function handleClearPerspective() {
  return undefined
}

/**
 * The shared navbar perspective chip in its two states. With no perspective
 * selected the chip is the trigger alone ("Default"). Once one is selected
 * the clear control sits beside the label. `TestWrapper` supplies studio i18n
 * so that control's label resolves to "Clear selection". The glyph is the
 * variants navbar icon, the only caller so far.
 */
export function GlobalPerspectiveButtonStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <Flex alignItems="flex-start" flexDirection="column" gap={5}>
          <Flex alignItems="flex-start" flexDirection="column" gap={2}>
            <Text as="div" muted size={1} trim={true} weight="medium">
              No selection
            </Text>
            <div data-testid="global-perspective-button-idle">
              <GlobalPerspectiveButton
                icon={<RhombusIcon className={suggestIconColor} />}
                text="Default"
              />
            </div>
          </Flex>
          <Flex alignItems="flex-start" flexDirection="column" gap={2}>
            <Text as="div" muted size={1} trim={true} weight="medium">
              Selected
            </Text>
            <div data-testid="global-perspective-button-selected">
              <GlobalPerspectiveButton
                handleClearPerspective={handleClearPerspective}
                icon={<RhombusIcon className={suggestIconColor} />}
                text="Norwegian market"
              />
            </div>
          </Flex>
        </Flex>
      </Card>
    </TestWrapper>
  )
}
