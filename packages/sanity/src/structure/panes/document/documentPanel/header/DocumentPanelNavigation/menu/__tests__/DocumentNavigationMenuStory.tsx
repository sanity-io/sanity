import {Card} from '@sanity/ui'
import {type ReactNode, useState} from 'react'
import {Flex, Text} from 'ui5'

import {TestWrapper} from '../../../../../../../../../test/browser/TestWrapper'
import {MenuItem} from '../../../../../../../../ui-components/menuItem/MenuItem'
import {DropdownButton} from '../../DropdownButton'
import {RhombusIcon} from '../../RhombusIcons'
import {DocumentNavigationMenu} from '../DocumentNavigationMenu'

const OTHER_ITEMS = ['Alpha', 'Beta']

function toItem(text: string): ReactNode {
  return <MenuItem data-testid={`item-${text}`} key={text} text={text} />
}

/**
 * Chromatic sentinel for the document-panel navigation picker menu: filter
 * field, a leading item, an always-shown empty section with its info icon,
 * and a populated section. `initialFilter` pins the no-matches chrome.
 */
export function DocumentNavigationMenuStory(props: {initialFilter?: string}) {
  const [filterQuery, setFilterQuery] = useState(props.initialFilter ?? '')
  const matches = (text: string) => text.toLowerCase().includes(filterQuery.trim().toLowerCase())

  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{minHeight: 420}}>
        <Flex alignItems="flex-start" flexDirection="column" gap={2}>
          <Text as="div" muted size={1} trim={true} weight="medium">
            document navigation menu
          </Text>
          <DocumentNavigationMenu
            button={
              <DropdownButton
                data-testid="document-navigation-menu-trigger"
                icon={RhombusIcon}
                text="Variants"
              />
            }
            filterPlaceholder="Find a variant"
            filterQuery={filterQuery}
            leadingItems={matches('Default') ? toItem('Default') : null}
            onFilterChange={setFilterQuery}
            sections={[
              {
                alwaysShow: true,
                items: [],
                key: 'document',
                label: 'In the document',
                tooltip: 'This document has no variants yet.',
              },
              {
                items: OTHER_ITEMS.filter(matches).map(toItem),
                key: 'other',
                label: 'Other',
              },
            ]}
            testId="document-navigation-menu"
          />
        </Flex>
      </Card>
    </TestWrapper>
  )
}
