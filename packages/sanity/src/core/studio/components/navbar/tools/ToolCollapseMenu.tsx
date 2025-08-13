import {Flex} from '@sanity/ui'
import {startCase} from 'lodash'
import {forwardRef, type Ref, useMemo, useState} from 'react'

import {Button} from '../../../../../ui-components/button/Button'
import type {MenuButtonProps} from '../../../../../ui-components/menuButton/MenuButton'
import {useRovingFocus} from '../../../../components/rovingFocus/useRovingFocus'
import {CollapseTabList} from '../../../../components/collapseTabList/CollapseTabList'
import type {Tool} from '../../../../config/types'
import {useColorSchemeValue} from '../../../colorScheme'
import {ToolLink, type ToolLinkProps} from './ToolLink'

interface ToolCollapseMenuProps {
  activeToolName?: string
  tools: Tool[]
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

        const Link = forwardRef(function Link(
          linkProps: ToolLinkProps,
          ref: Ref<HTMLAnchorElement>,
        ) {
          return (
            <ToolLink {...linkProps} ref={ref} name={tool.name}>
              {linkProps.children}
            </ToolLink>
          )
        })

        return (
          <Button
            key={`${tool.name}-${index}`}
            as={Link}
            data-as="a"
            mode="bleed"
            selected={activeToolName === tool.name}
            text={title}
          />
        )
      }),
    [activeToolName, tools],
  )

  return (
    <Flex justify="center" marginX={4}>
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
