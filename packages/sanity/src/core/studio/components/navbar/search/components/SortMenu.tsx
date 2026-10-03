import {SortIcon} from '@sanity/icons/Sort'
import {Card} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {dequal as isEqual} from 'dequal/lite'
import {useCallback, useId, useMemo} from 'react'
import {Flex} from 'ui5'

import {Button} from '../../../../../../ui-components/button/Button'
import {MenuButton} from '../../../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {useWorkspace} from '../../../../workspace'
import {useSearchSelector, useSearchState} from '../contexts/search/useSearchState'
import {getOrderings} from '../definitions/getOrderings'
import {type SearchOrdering} from '../types'
import {sortMenuContentFlex} from './SortMenu.css'

interface SearchDivider {
  type: 'divider'
}

function isSearchDivider(item: SearchDivider | SearchOrdering): item is SearchDivider {
  return (item as SearchDivider).type === 'divider'
}

function CustomMenuItem({ordering}: {ordering: SearchOrdering}) {
  const {t} = useTranslation()
  const {searchActorRef} = useSearchState()
  const isSelected = useSearchSelector((snapshot) => isEqual(snapshot.context.ordering, ordering))

  const handleClick = useCallback(() => {
    searchActorRef.send({ordering, type: 'ORDERING_SET'})
  }, [ordering, searchActorRef])

  return (
    <MenuItem
      onClick={handleClick}
      pressed={isSelected}
      tone="default"
      text={t(ordering.titleKey)}
    />
  )
}

export function SortMenu() {
  const {t} = useTranslation()
  const {strategy: searchStrategy} = useWorkspace().search
  const ordering = useSearchSelector((snapshot) => snapshot.context.ordering)

  const menuButtonId = useId()

  const menuOrderings: (SearchDivider | SearchOrdering)[] = useMemo(() => {
    const orderings = getOrderings({searchStrategy})
    return [
      orderings.relevance,
      {type: 'divider'},
      orderings.createdAsc,
      orderings.createdDesc,
      {type: 'divider'},
      orderings.updatedAsc,
      orderings.updatedDesc,
    ]
  }, [searchStrategy])

  const currentMenuItem = menuOrderings.find(
    (item): item is SearchOrdering => isEqual(ordering, item) && !isSearchDivider(item),
  )

  if (!currentMenuItem) {
    return null
  }

  return (
    <Card borderBottom>
      <Flex
        alignItems="center"
        className={sortMenuContentFlex}
        flexBasis="0%"
        flexGrow={1}
        padding={2}
      >
        <MenuButton
          button={<Button mode="bleed" icon={SortIcon} text={t(currentMenuItem.titleKey)} />}
          id={menuButtonId || ''}
          menu={
            <Menu>
              {menuOrderings.map((item, index) => {
                if (isSearchDivider(item)) {
                  // oxlint-disable-next-line no-array-index-key
                  return <MenuDivider key={index} />
                }
                return (
                  <CustomMenuItem
                    // oxlint-disable-next-line no-array-index-key
                    key={index}
                    ordering={item}
                  />
                )
              })}
            </Menu>
          }
          popover={{placement: 'bottom-start', portal: true, radius: 2}}
        />
      </Flex>
    </Card>
  )
}
