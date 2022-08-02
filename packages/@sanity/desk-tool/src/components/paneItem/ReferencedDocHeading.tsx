import React, {ReactNode, useCallback, useEffect, useRef, useState} from 'react'
import {Popover, Box, Text, Heading, Flex, Button, Stack} from '@sanity/ui'
import {LinkIcon} from '@sanity/icons'
import {TitleText, LinkCircle, HorizontalLine, StyledBox} from '../pane/PaneHeader.styles'
import {useDeskToolSetting} from '../../settings'
import {ReferencedDocTooltip} from './ReferencedDocTooltip'

export function ReferencedDocHeading({title}: {title?: ReactNode}) {
  const documentTitleRef = useRef(null)
  const [titleBoxSize, setTitleBoxSize] = useState(0)
  const [hidePopover, setHidePopover] = useDeskToolSetting(
    'desk-tool',
    'referenced-doc-has-confirmed-dialog',
    false
  )
  const handleHidePopover = useCallback(() => setHidePopover(true), [setHidePopover])

  // When the title container changes size (a sibling pane is opened/resized, sidebar opens),
  // a resize observer fires this event. In order to force the info popover to reposition,
  // we set the size of the title box to a state variable and use it as a key on the popover.
  // Ideally, this would automatically be handled by `@sanity/ui`.
  const handleResize = useCallback(
    (e: ResizeObserverEntry[]) => {
      if (!hidePopover) {
        setTitleBoxSize(Math.floor(e[0].borderBoxSize[0].inlineSize))
      }
    },
    [hidePopover, setTitleBoxSize]
  )

  if (hidePopover) {
    return (
      <Flex>
        <TitleText tabIndex={0} textOverflow="ellipsis" weight="semibold">
          {title}
        </TitleText>
        <ReferencedDocTooltip />
      </Flex>
    )
  }

  return (
    <>
      <Popover
        key={`popover-${titleBoxSize}`}
        content={<InnerPopover onClose={handleHidePopover} />}
        placement="bottom-start"
        referenceElement={documentTitleRef.current}
        tone="default"
        portal
        open
      />

      <ObserveElementResize callback={handleResize}>
        <Flex>
          {/* This empty div is added to prevent a jump of the popover pointer once the title is rendered */}
          <div ref={documentTitleRef}>{''}</div>
          <TitleText tabIndex={0} textOverflow="ellipsis" weight="semibold">
            <Box marginBottom={2}>{title}</Box>
          </TitleText>
          <ReferencedDocTooltip />
        </Flex>
      </ObserveElementResize>
    </>
  )
}

function InnerPopover({onClose}: {onClose?: () => void}) {
  return (
    <StyledBox as="div">
      <Box margin={4}>
        <Flex marginBottom={4} align="center">
          <Box marginRight={2}>
            <LinkCircle>
              <LinkIcon fontSize="24" />
            </LinkCircle>
          </Box>
          <Heading size={1}>This is a referenced document</Heading>
        </Flex>
        <Text>Changes to this type of document may affect other documents that reference it</Text>
      </Box>
      <HorizontalLine />
      <Box padding={3}>
        <Stack space={2}>
          <Button onClick={onClose} tone="primary" text="Got it" autoFocus />
        </Stack>
      </Box>
    </StyledBox>
  )
}

function ObserveElementResize(props: {
  children: React.ReactElement
  callback: ResizeObserverCallback
}) {
  const {callback, children, ...rest} = props
  const [el, setEl] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!el || typeof ResizeObserver !== 'function') return undefined

    const io = new ResizeObserver(callback)
    io.observe(el)

    return () => {
      io.unobserve(el)
      io.disconnect()
    }
  }, [el, callback])

  return (
    <div ref={setEl} {...rest}>
      {children}
    </div>
  )
}
