/* eslint-disable @sanity/i18n/no-attribute-string-literals */
/* eslint-disable i18next/no-literal-string */
import React, {useCallback, useState} from 'react'
import {Flex, Heading, Stack, Text} from '@sanity/ui'
import {generateHelpUrl} from '@sanity/generate-help-url'
import {Button, Popover} from '../../ui-components'
import {useDeskRenameOnboarding} from './onboardingStore'

const RENAME_ANNOUNCEMENT_URL = generateHelpUrl('desk-is-now-structure')

interface DeskRenameToolMenuButtonPopoverProps {
  children: React.ReactNode
}

/**
 * @internal
 */
export function DeskRenameToolMenuButtonPopover(props: DeskRenameToolMenuButtonPopoverProps) {
  const {children} = props
  const [isShown, setIsShown] = useState<boolean | undefined>(undefined)
  const {showOnboarding, dismissOnboarding} = useDeskRenameOnboarding()

  /**
   * The `CollapseMenu` component which is a parent that renders the icon for the tool
   * renders the menu in several places, in order to measure the width and automatically collapse the menu if
   * there is not enough space for all elements.
   */
  const setRootElement = useCallback((element: HTMLDivElement) => {
    const disabledParent = element?.closest('[data-hidden]')
    // If there's a parent with data-hidden=true, we are in a subtree rendered as part of the CollapseMenu's
    // available space measurement
    setIsShown(disabledParent?.getAttribute('data-hidden') !== 'true')
  }, [])

  return (
    <div ref={setRootElement}>
      <Popover
        content={<DeskRenamedCard onDismiss={dismissOnboarding} />}
        fallbackPlacements={['top', 'bottom']}
        open={showOnboarding && isShown}
        placement="bottom"
        portal
        tone="default"
        width={0}
      >
        <span>{children}</span>
      </Popover>
    </div>
  )
}

function DeskRenamedCard(props: {onDismiss: () => void}) {
  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // prevent this from propagating upwards in the dom tree as this component is rendered inside an anchor element already,
    // and we don't want the anchor element to handle clicks in here
    event.stopPropagation()
  }, [])

  return (
    <Stack as="section" padding={3} space={3} onClick={handleClick}>
      <Stack padding={2} space={4}>
        <Flex gap={2} align="center">
          <Heading size={1}>Desk is now structure</Heading>
        </Flex>

        <Stack space={3}>
          <Text as="p" muted size={1}>
            We've renamed this tool to better reflect its purpose alongside the new Presentation
            tool.
          </Text>
        </Stack>
      </Stack>

      <Flex width="full" gap={3} justify="flex-end">
        <Button
          as="a"
          data-as="a"
          href={RENAME_ANNOUNCEMENT_URL}
          target="_blank"
          rel="noreferrer"
          text="Learn more"
          mode="bleed"
        />
        <Button onClick={props.onDismiss} text="Got it" tone="primary" />
      </Flex>
    </Stack>
  )
}
