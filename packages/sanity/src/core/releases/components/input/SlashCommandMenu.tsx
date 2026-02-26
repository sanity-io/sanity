import {Card, Flex, Text} from '@sanity/ui'
import {
  forwardRef,
  type Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {styled} from 'styled-components'

import {CommandList, type CommandListHandle} from '../../../components'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {type SlashCommand} from './useSlashCommands'

export type {SlashCommand}

export interface SlashCommandMenuHandle {
  setSearchTerm: (term: string) => void
}

interface SlashCommandMenuProps {
  commands: SlashCommand[]
  inputElement: HTMLDivElement | null
  onSelect: (command: SlashCommand) => void
}

const ITEM_HEIGHT = 35
const LIST_PADDING = 4
const MAX_ITEMS = 4

const Root = styled(Flex)({
  maxWidth: '220px',
  maxHeight: ITEM_HEIGHT * MAX_ITEMS + LIST_PADDING * 2 + ITEM_HEIGHT / 2,
})

export const SlashCommandMenu = forwardRef(function SlashCommandMenu(
  props: SlashCommandMenuProps,
  ref: Ref<SlashCommandMenuHandle>,
) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {commands, inputElement, onSelect} = props
  const [searchTerm, setSearchTerm] = useState<string>('')
  const commandListRef = useRef<CommandListHandle>(null)

  useImperativeHandle(ref, () => ({setSearchTerm}), [])

  const filteredCommands = useMemo(() => {
    if (!searchTerm) return commands

    const lowerSearchTerm = searchTerm.toLowerCase()
    return commands.filter((command) => command.label.toLowerCase().includes(lowerSearchTerm))
  }, [commands, searchTerm])

  const renderItem = useCallback(
    (command: SlashCommand) => {
      return (
        <Card
          as="button"
          onClick={() => onSelect(command)}
          padding={2}
          radius={2}
          style={{cursor: 'pointer'}}
        >
          <Flex align="center" gap={3}>
            <Text size={1}>
              <command.icon />
            </Text>
            <Text size={1} weight="medium">
              {command.label}
            </Text>
          </Flex>
        </Card>
      )
    },
    [onSelect],
  )

  if (filteredCommands.length === 0) {
    return null
  }

  return (
    <Root direction="column" flex={1} overflow="hidden">
      <CommandList
        activeItemDataAttr="data-hovered"
        ariaLabel={t('description.command-list.aria-label')}
        fixedHeight
        inputElement={inputElement as unknown as HTMLInputElement}
        itemHeight={ITEM_HEIGHT}
        items={filteredCommands}
        padding={1}
        ref={commandListRef}
        renderItem={renderItem}
        wrapAround
      />
    </Root>
  )
})
