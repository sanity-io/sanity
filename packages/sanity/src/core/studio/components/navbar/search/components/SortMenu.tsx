import {SortIcon} from '@sanity/icons'
import {Card, Flex, Menu, MenuDivider} from '@sanity/ui'
import {isEqual} from 'lodash'
import {useCallback, useId, useMemo} from 'react'
import {styled} from 'styled-components'

import {Button, MenuButton, MenuItem} from '../../../../../../ui-components'
import {useTranslation} from '../../../../../i18n'
import {useWorkspace} from '../../../../workspace'
import {useSearchState} from '../contexts/search/useSearchState'
import {getOrderings} from '../definitions/getOrderings'
import {type SearchOrdering} from '../types'

interface SearchDivider {
  type: 'divider'
}

const SortMenuContentFlex = styled(Flex)`
  box-sizing: border-box;
`

function isSearchDivider(item: SearchDivider | SearchOrdering): item is SearchDivider {
  return (item as SearchDivider).type === 'divider'
}

function CustomMenuItem({ordering}: {ordering: SearchOrdering}) {
  const {t} = useTranslation()
  const {
    dispatch,
    state: {ordering: currentOrdering},
  } = useSearchState()

  const handleClick = useCallback(() => {
    dispatch({ordering, type: 'ORDERING_SET'})
  }, [dispatch, ordering])

  const isSelected = useMemo(() => isEqual(currentOrdering, ordering), [currentOrdering, ordering])

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
  const {
    state: {ordering},
  } = useSearchState()

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
      <SortMenuContentFlex align="center" flex={1} padding={2}>
        <MenuButton
          button={<Button mode="bleed" icon={SortIcon} text={t(currentMenuItem.titleKey)} />}
          id={menuButtonId || ''}
          menu={
            <Menu>
              {menuOrderings.map((item, index) => {
                if (isSearchDivider(item)) {
                  // eslint-disable-next-line react/no-array-index-key
                  return <MenuDivider key={index} />
                }
                return (
                  <CustomMenuItem
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    ordering={item}
                  />
                )
              })}
            </Menu>
          }
          placement="bottom-start"
          popover={{portal: true, radius: 2}}
        />
      </SortMenuContentFlex>
    </Card>
  )
}
