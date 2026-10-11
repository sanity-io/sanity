import startCase from 'lodash-es/startCase.js'
import {useMemo, type RefAttributes} from 'react'
import {VStack} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {type Tool} from '../../../../config/types'
import {ToolLink, type ToolLinkProps} from './ToolLink'

interface ToolVerticalMenuProps {
  activeToolName?: string
  isVisible: boolean
  tools: Tool[]
}

export function ToolVerticalMenu(props: ToolVerticalMenuProps) {
  const {activeToolName, isVisible, tools} = props

  return useMemo(
    () => (
      <VStack as="ul" gap={1}>
        {tools.map((tool) => {
          const title = tool?.title || startCase(tool.name)

          function Link(linkProps: ToolLinkProps & RefAttributes<HTMLAnchorElement>) {
            const {ref, ...rest} = linkProps
            return (
              <ToolLink {...rest} ref={ref} name={tool.name}>
                {linkProps.children}
              </ToolLink>
            )
          }

          return (
            <VStack key={tool.name} as="li">
              <Button
                as={Link}
                justify="flex-start"
                mode="bleed"
                selected={activeToolName === tool.name}
                size="large"
                tabIndex={isVisible ? 0 : -1}
                text={title}
              />
            </VStack>
          )
        })}
      </VStack>
    ),
    [activeToolName, isVisible, tools],
  )
}
