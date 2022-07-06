/* eslint-disable react/jsx-pascal-case */
import {Box, Card, Flex, Inline, KBD, Popover, TextInput, useGlobalKeyDown} from '@sanity/ui'
import React, {
  forwardRef,
  KeyboardEvent as ReactKeyboardEvent,
  Ref,
  useCallback,
  useRef,
  useState,
} from 'react'
import {SearchIcon} from '@sanity/icons'
import styled from 'styled-components'
import isHotkey from 'is-hotkey'
import {IS_MAC} from './helpers'
import {OmnisearchPopover} from './OmnisearchPopover'
import {SearchContextProvider, useSearchState} from './state/SearchContext'

interface OmnisearchFieldProps {
  // eslint-disable-next-line react/no-unused-prop-types
  portalElement?: HTMLDivElement | null
}

const ParentCard = styled(Card)`
  position: relative;
`

const isSearchHotKey = isHotkey('mod+k')
const isEscape = isHotkey('escape')

export function OmnisearchField(props: OmnisearchFieldProps) {
  const popoverEl = useRef<HTMLDivElement>()
  const dummyInputEl = useRef<HTMLInputElement>()
  const dummyInputWrapperEl = useRef<HTMLDivElement>()
  const [open, setOpened, setClosed] = useOpen()

  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isSearchHotKey(event)) {
        event.preventDefault()
        setOpened()
      }
      if (isEscape(event) && open) {
        setClosed()
        dummyInputEl.current?.focus()
      }
    },
    [setOpened, setClosed, open]
  )

  useGlobalKeyDown(handleGlobalKeyDown)

  return (
    <SearchContextProvider>
      <Popover
        content={<OmnisearchPopover close={setClosed} />}
        padding={4}
        portal
        open={open}
        arrow={false}
        placement="left-start"
        ref={popoverEl}
        style={{position: 'relative'}}
      >
        <ParentCard border ref={dummyInputWrapperEl}>
          <DummyInput setOpened={setOpened} ref={dummyInputEl} />
        </ParentCard>
      </Popover>
    </SearchContextProvider>
  )
}

const DummyInput = forwardRef(function DummyInput(
  {setOpened}: {setOpened: () => void},
  ref: Ref<HTMLInputElement>
) {
  const state = useSearchState()
  const keyboardOpen = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        setOpened()
      }
    },
    [setOpened]
  )
  return (
    <Flex align="center" gap={2}>
      <Box flex={1}>
        <TextInput
          icon={SearchIcon}
          id="studio-search"
          placeholder="Search (new)"
          onClick={setOpened}
          border={false}
          ref={ref}
          value={state.query}
          onChange={setOpened}
          onKeyDown={keyboardOpen}
        />
      </Box>
      <Inline marginRight={2}>
        <KBD>{IS_MAC ? 'Cmd' : 'Ctrl'}</KBD>
        <KBD>K</KBD>
      </Inline>
    </Flex>
  )
})

function useOpen() {
  const [open, setOpen] = useState(false)
  const setOpened = useCallback(() => setOpen(true), [setOpen])
  const setClosed = useCallback(() => setOpen(false), [setOpen])
  return [open, setOpened, setClosed] as [typeof open, typeof setOpened, typeof setClosed]
}
