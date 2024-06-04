import {Box, Card, Text} from '@sanity/ui'
import {Fragment} from 'react'
import {type Path} from 'sanity'
import {styled} from 'styled-components'

import {type TreeEditingBreadcrumb} from '../../types'
import {TreeEditingBreadcrumbsMenu} from './TreeEditingBreadcrumbsMenu'

const TitleCard = styled(Card)`
  min-height: max-content;
`

interface BreadcrumbSiblingsMenuProps {
  items: TreeEditingBreadcrumb[]
  handlePathSelect: (path: Path) => void
  selectedPath: Path
  parentArrayTitle: string
}

export function BreadcrumbSiblingsMenu(props: BreadcrumbSiblingsMenuProps): JSX.Element {
  const {items, handlePathSelect, selectedPath, parentArrayTitle} = props
  return (
    <Fragment>
      <TitleCard borderBottom padding={3} sizing="border">
        <Box paddingX={1} sizing="border">
          <Text muted size={1} textOverflow="ellipsis" weight="semibold">
            {parentArrayTitle}
          </Text>
        </Box>
      </TitleCard>

      <TreeEditingBreadcrumbsMenu
        items={items}
        onPathSelect={handlePathSelect}
        selectedPath={selectedPath}
        textInputElement={null}
      />
    </Fragment>
  )
}
