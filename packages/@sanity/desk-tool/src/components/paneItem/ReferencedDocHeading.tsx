import React, {ReactNode, useCallback, useEffect, useRef, useState} from 'react'
import {Popover, Box, Text, Heading, Flex, Button, Grid} from '@sanity/ui'
import {LinkIcon} from '@sanity/icons'
import {TitleText, LinkCircle, HorizontalLine, StyledBox} from '../pane/PaneHeader.styles'
import {useDeskToolSetting} from '../../settings'
import {ReferencedDocTooltip} from './ReferencedDocTooltip'

interface ReferenceDocHeadingProps {
  title?: ReactNode
  totalReferenceCount: number
}

interface InnerPopoverProps {
  onClose: () => void
  totalReferenceCount: number
}

export function ReferencedDocHeading(props: ReferenceDocHeadingProps) {
  const {title, totalReferenceCount} = props
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
      if (!hidePopover && e?.[0]?.borderBoxSize?.[0]?.inlineSize) {
        setTitleBoxSize(Math.floor(e[0].borderBoxSize[0].inlineSize))
      }
    },
    [hidePopover, setTitleBoxSize]
  )

  if (hidePopover) {
    return (
      <Flex>
        <Box paddingBottom={3}>
          <TitleText tabIndex={0} textOverflow="ellipsis" weight="semibold">
            {title}
          </TitleText>
        </Box>
        <ReferencedDocTooltip totalReferenceCount={totalReferenceCount} />
      </Flex>
    )
  }

  return (
    <>
      <Popover
        key={`popover-${titleBoxSize}`}
        content={
          <InnerPopover onClose={handleHidePopover} totalReferenceCount={totalReferenceCount} />
        }
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
          <Box marginBottom={3}>
            <TitleText tabIndex={0} textOverflow="ellipsis" weight="semibold">
              {title}
            </TitleText>
          </Box>
          <ReferencedDocTooltip totalReferenceCount={totalReferenceCount} />
        </Flex>
      </ObserveElementResize>
    </>
  )
}

function InnerPopover(props: InnerPopoverProps) {
  const {onClose, totalReferenceCount} = props
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
        <Text>
          This document is referenced by {totalReferenceCount} other
          {totalReferenceCount === 1 ? ' document' : ' documents'}. Changes made here will be
          reflected anywhere content from this document is used.
        </Text>
      </Box>
      <HorizontalLine />
      <Box marginX={1} padding={3}>
        <Grid columns={2} gap={3}>
          <Button
            as="a"
            target="_blank"
            mode="ghost"
            href="https://www.sanity.io/docs/connected-content"
            text="Learn more"
          />
          <Button onClick={onClose} tone="primary" text="Got it" autoFocus />
        </Grid>
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
