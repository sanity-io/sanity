import startCase from 'lodash-es/startCase.js'
import {useMemo} from 'react'
import {VStack} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {type Tool} from '../../../../config/types'
import {ToolLink} from './ToolLink'

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

          return (
            <VStack key={tool.name} as="li">
              <Button
                as={ToolLink}
                name={tool.name}
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
