import {Card} from '@sanity/ui'
import {type ReactNode} from 'react'
import {Flex, Text} from 'ui5'

import {TestWrapper} from '../../../../../../../../test/browser/TestWrapper'
import {DropdownButton} from '../DropdownButton'
import {RhombusIcon} from '../RhombusIcons'

/** The selected chip only needs the control mounted; the story does not change selection. */
function handleClear() {
  return undefined
}

function Labelled(props: {label: string; testId: string; children: ReactNode}) {
  return (
    <Flex alignItems="flex-start" flexDirection="column" gap={2}>
      <Text as="div" muted size={1} trim={true} weight="medium">
        {props.label}
      </Text>
      <div data-testid={props.testId}>{props.children}</div>
    </Flex>
  )
}

/**
 * The document panel navigation pill in its states: the default option (the trigger alone), a
 * selection in the suggest tone with the remove control beside it, and a long label. `TestWrapper`
 * supplies studio i18n, so the remove control is labelled "Clear selection".
 */
export function DropdownButtonStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <Flex alignItems="flex-start" flexDirection="column" gap={5}>
          <Labelled label="No selection" testId="dropdown-button-idle">
            <DropdownButton icon={RhombusIcon} text="Variants" />
          </Labelled>
          <Labelled label="Selected" testId="dropdown-button-selected">
            <DropdownButton
              icon={RhombusIcon}
              onClear={handleClear}
              tone="suggest"
              text="First-time visitors"
            />
          </Labelled>
          <Labelled label="Long label" testId="dropdown-button-long">
            <DropdownButton
              icon={RhombusIcon}
              onClear={handleClear}
              tone="suggest"
              text="Returning customers from the Nordic region"
            />
          </Labelled>
        </Flex>
      </Card>
    </TestWrapper>
  )
}
