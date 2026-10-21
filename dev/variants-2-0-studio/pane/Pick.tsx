import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {SearchIcon} from '@sanity/icons/Search'
import {Box, Text, TextInput} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type CSSProperties, type ReactElement, useState} from 'react'

import {Chip} from '../../../packages/sanity/src/core/releases/components/Chip'
import {MenuButton} from '../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'

/** A list longer than this gets a search field, like the global state menu. */
const SEARCH_ABOVE = 7
/** The list scrolls inside this height; a long list never leaves the screen. */
const MAX_LIST_HEIGHT = 'min(360px, calc(100vh - 220px))'

interface PickItem {
  key: string
  text: string
  icon?: ReactElement
  selected: boolean
  onClick: () => void
  disabled?: boolean
}

/** The list inside the menu: scrolls, and filters once it is long. The width stays where it was when the first character is typed. */
function PickList({
  items,
  testId,
  onChoose,
}: {
  items: PickItem[]
  testId: string
  onChoose: () => void
}) {
  const [query, setQuery] = useState('')
  const [width, setWidth] = useState<number | undefined>(undefined)
  const [wrap, setWrap] = useState<HTMLDivElement | null>(null)
  const searchable = items.length > SEARCH_ABOVE
  const needle = query.trim().toLowerCase()
  const shown = needle ? items.filter((item) => item.text.toLowerCase().includes(needle)) : items
  return (
    <div ref={setWrap} style={{width}}>
      {searchable ? (
        <Box padding={1}>
          <TextInput
            autoFocus
            data-testid={`${testId}-search`}
            fontSize={1}
            icon={SearchIcon}
            onChange={(event) => {
              const el = event.currentTarget
              if (!width && el.value) setWidth(wrap?.getBoundingClientRect().width)
              setQuery(el.value)
              if (!el.value) setWidth(undefined)
            }}
            onKeyDown={(event) => event.stopPropagation()}
            placeholder="Search"
            value={query}
          />
        </Box>
      ) : null}
      <div data-testid={`${testId}-list`} style={{maxHeight: MAX_LIST_HEIGHT, overflowY: 'auto'}}>
        {shown.map((item) => (
          <MenuItem
            disabled={item.disabled}
            icon={item.icon}
            key={item.key}
            onClick={() => {
              item.onClick()
              setQuery('')
              setWidth(undefined)
              onChoose()
            }}
            pressed={item.selected}
            text={item.text}
          />
        ))}
        {shown.length === 0 ? (
          <Box data-testid={`${testId}-empty`} padding={3}>
            <Text muted size={1}>{`Nothing matches “${query}”.`}</Text>
          </Box>
        ) : null}
      </div>
    </div>
  )
}

/** A chip that opens a menu of choices (the layer, the variant, the Against address). Its own file so the review surfaces can use it without importing the pane. */
export function Pick(props: {
  text: string
  testId: string
  items: PickItem[]
  icon?: ReactElement
  style?: CSSProperties
}) {
  return (
    <MenuButton
      button={
        <Chip
          data-testid={props.testId}
          icon={props.icon}
          iconRight={ChevronDownIcon}
          mode="ghost"
          style={props.style}
          text={props.text}
        />
      }
      id={props.testId}
      menu={
        <Menu padding={1}>
          <PickList items={props.items} onChoose={() => undefined} testId={props.testId} />
        </Menu>
      }
      popover={{constrainSize: true, placement: 'bottom-start', portal: true}}
    />
  )
}
