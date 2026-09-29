import startCase from 'lodash-es/startCase.js'
import {useMemo, useState, type RefAttributes, useId} from 'react'
import {Flex} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {type MenuButtonProps} from '../../../../../ui-components/menuButton/MenuButton'
import {CollapseTabList} from '../../../../components/collapseTabList/CollapseTabList'
import {useRovingFocus} from '../../../../components/rovingFocus/useRovingFocus'
import {type Tool} from '../../../../config/types'
import {useColorSchemeValue} from '../../../colorScheme'
import {ToolLink, type ToolLinkProps} from './ToolLink'

const TOOL_COLLAPSE_MENU_STYLE = {minWidth: 0} as const

interface ToolCollapseMenuProps {
  activeToolName?: string
  tools: Tool[]
}

function ToolLinkButton({tool, selected}: {tool: Tool; selected: boolean}) {
  const title = tool?.title || startCase(tool.name)
  const viewTransitionName = useId()

  return (
    <Button
      as={ToolLink}
      data-as="a"
      mode="bleed"
      name={tool.name}
      selected={selected}
      text={title}
      style={{viewTransitionName}}
    />
  )
}

export function ToolCollapseMenu(props: ToolCollapseMenuProps) {
  const {activeToolName, tools} = props
  const scheme = useColorSchemeValue()
  const [collapseMenuEl, setCollapseMenuEl] = useState<HTMLDivElement | null>(null)

  useRovingFocus({
    rootElement: collapseMenuEl,
    navigation: ['arrows'],
  })

  const menuButtonProps: Partial<MenuButtonProps> = useMemo(
    () => ({
      popover: {
        constrainSize: true,
        portal: true,
        scheme: scheme,
        tone: 'default',
      },
    }),
    [scheme],
  )
  const children = useMemo(
    () =>
      tools.map((tool, index) => {
        const title = tool?.title || startCase(tool.name)

        return (
          <ToolLinkButton
            key={`${tool.name}-${title}`}
            tool={tool}
            selected={activeToolName === tool.name}
          />
        )
      }),
    [activeToolName, tools],
  )

  return (
    <Flex justifyContent="center" marginX={4} style={TOOL_COLLAPSE_MENU_STYLE}>
      <CollapseTabList
        data-testid="tool-collapse-menu"
        gap={1}
        menuButtonProps={menuButtonProps}
        ref={setCollapseMenuEl}
      >
        {children}
      </CollapseTabList>
    </Flex>
  )
}
