import React, {useCallback, useRef, useState} from 'react'
import {ArrowRightIcon, CheckmarkIcon} from '@sanity/icons'
import {Button, Flex, Popover, Stack, Text} from '@sanity/ui'
import {useDeskRenameOnboarding} from './onboardingStore'

const RENAME_ANNOUNCEMENT_URL = 'https://sanity.io/blog/desk-is-now-structure'

/**
 * @internal
 */
export function wrapIconInDeskRenamePrompt(Icon: React.ComponentType): React.ComponentType {
  return function DeskRenamedIcon() {
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
          open={showOnboarding && isShown}
          portal
          placement="bottom"
          fallbackPlacements={['top', 'bottom']}
          __unstable_margins={[9, 0, 0, 0]}
          tone="default"
          width={0}
        >
          <Icon />
        </Popover>
      </div>
    )
  }
}

function DeskRenamedCard(props: {onDismiss: () => void}) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // prevent this from propagating upwards in the dom tree as this component is rendered inside an anchor element already,
    // and we don't want the anchor element to handle clicks in here
    event.stopPropagation()
  }, [])

  return (
    <Stack as="section" padding={3} space={3} onClick={handleClick}>
      <Stack padding={2} space={4}>
        <Flex gap={2} align="center">
          <Text as="h1" size={1} weight="semibold">
            "Desk" is now "Structure"
          </Text>
        </Flex>

        <Stack space={3}>
          <Text as="p" muted size={1}>
            This tool was previously named <strong>"Desk"</strong>, but has now been renamed to
            <strong>"Structure"</strong> to better reflect its purpose.{' '}
            <a href={RENAME_ANNOUNCEMENT_URL} target="_blank" rel="noreferrer">
              Learn more <ArrowRightIcon />
            </a>
          </Text>
        </Stack>
      </Stack>

      <Button
        fontSize={1}
        icon={CheckmarkIcon}
        onClick={props.onDismiss}
        padding={3}
        ref={buttonRef}
        text="Ok, good to know!"
        tone="primary"
      />
    </Stack>
  )
}
