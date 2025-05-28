import {PanelLeftIcon} from '@sanity/icons'
import {type Path} from '@sanity/types'
import {Box, Card, Stack, Text} from '@sanity/ui'
import {AnimatePresence, motion, type Variants} from 'framer-motion'
import {memo, useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {styled} from 'styled-components'

import {Button} from '../../../../../../ui-components'
import {Resizable} from '../../../../../components/resizer/Resizable'
import {type TreeEditingMenuItem} from '../../types'
import {TreeEditingSearch} from '../search'
import {TreeEditingMenu} from '../tree-menu'
import {FixedHeightFlex} from './styles'

const ANIMATION_VARIANTS: Variants = {
  initial: {opacity: 0},
  animate: {opacity: 1},
  exit: {opacity: 0},
}

const SidebarCard = styled(Card)`
  flex-direction: column;
`

const SidebarStack = styled(motion.create(Stack))`
  overflow-x: hidden;
`

const SearchStack = styled(Stack)`
  min-height: max-content;
`

interface TreeEditingLayoutSidebarProps {
  items: TreeEditingMenuItem[]
  onOpenToggle: () => void
  onPathSelect: (path: Path) => void
  open: boolean
  selectedPath: Path
  title: string
}

export const TreeEditingLayoutSidebar = memo(function TreeEditingLayoutSidebar(
  props: TreeEditingLayoutSidebarProps,
) {
  const {items, onPathSelect, selectedPath, onOpenToggle, open, title} = props
  const {t} = useTranslation()

  const tooltipProps = useMemo(
    () => ({
      content: open
        ? t('tree-editing-dialog.sidebar.action.close')
        : t('tree-editing-dialog.sidebar.action.open'),
    }),
    [open, t],
  )

  const content = (
    <SidebarCard
      borderRight={!open}
      data-testid="tree-editing-sidebar"
      data-ui="SidebarCard"
      display="flex"
      forwardedAs="aside"
      height="fill"
      overflow="hidden"
      tone="transparent"
    >
      <FixedHeightFlex align="center" gap={2}>
        <Button
          data-testid="tree-editing-sidebar-toggle"
          icon={PanelLeftIcon}
          mode="bleed"
          onClick={onOpenToggle}
          selected={open}
          tooltipProps={tooltipProps}
        />

        {open && (
          <Box flex={1}>
            <Text size={1} muted weight="medium" textOverflow="ellipsis">
              {title}
            </Text>
          </Box>
        )}
      </FixedHeightFlex>

      {open && (
        <SearchStack padding={2} sizing="border">
          <TreeEditingSearch items={items} onPathSelect={onPathSelect} />
        </SearchStack>
      )}

      <AnimatePresence mode="wait">
        {open && (
          <SidebarStack
            animate="animate"
            exit="exit"
            initial="initial"
            overflow="auto"
            padding={3}
            sizing="border"
            variants={ANIMATION_VARIANTS}
          >
            <TreeEditingMenu
              items={items}
              onPathSelect={onPathSelect}
              selectedPath={selectedPath}
            />
          </SidebarStack>
        )}
      </AnimatePresence>
    </SidebarCard>
  )

  if (open) {
    return (
      <Resizable maxWidth={450} minWidth={150} initialWidth={250}>
        {content}
      </Resizable>
    )
  }

  return content
})
