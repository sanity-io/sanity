/* eslint-disable i18next/no-literal-string */
import {AnimatePresence, Transition, Variants, motion} from 'framer-motion'
import {Box, Card, Flex, Portal, PortalProvider, Stack, Text, useClickOutside} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {CloseIcon, PanelRightIcon} from '@sanity/icons'
import {useCallback, useRef} from 'react'
import {rgba} from '@sanity/ui/theme'
import {TasksLayout} from '../components'
import {useTasks} from '../hooks'
import {Button} from '../../../ui-components'

const VARIANTS: Variants = {
  hidden: {opacity: 0, x: '100%'},
  visible: {opacity: 1, x: 0},
  exit: {opacity: 0, x: '100%'},
}

const TRANSITION: Transition = {
  duration: 0.2,
}

const Root = styled(motion.div)(() => {
  return css`
    top: 0;
    right: 0;
    bottom: 0;
    position: fixed;
    max-width: 400px;
    z-index: 9999999;
  `
})

const Inner = styled(motion.div)(({theme}) => {
  const borderColor = theme.sanity.color.card.enabled.border
  const radii = theme.sanity.radius[2]

  return css`
    width: 100%;
    height: 100%;
    border-left: 1px solid ${borderColor};
    box-shadow: 0 0 18px 0 ${rgba(borderColor, 0.5)};
    box-sizing: border-box;
    position: relative;
    border-radius: ${radii}px;
  `
})

const Header = styled(Flex)(() => {
  return css`
    position: absolute;
    z-index: 999999;
    width: 100%;
  `
})

export function TasksSidebar() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const {open, setOpen} = useTasks()

  const handleClose = useCallback(() => setOpen(false), [setOpen])

  useClickOutside(handleClose, [rootRef.current])

  return (
    <Portal>
      <AnimatePresence mode="wait" initial={false}>
        {open && (
          <Root
            animate="visible"
            exit="exit"
            forwardedAs="aside"
            initial="hidden"
            variants={VARIANTS}
            key="tasks-sidebar"
            transition={TRANSITION}
            ref={rootRef}
          >
            <Inner>
              <Flex direction="column" height="fill">
                <Stack>
                  <Header align="center" gap={3} paddingX={4} paddingY={3} sizing="border">
                    <Box flex={1}>
                      <Text size={1} weight="semibold">
                        Tasks
                      </Text>
                    </Box>

                    <Button
                      icon={PanelRightIcon}
                      mode="bleed"
                      onClick={handleClose}
                      tooltipProps={{content: 'Close tasks'}}
                    />
                  </Header>
                </Stack>

                <Card overflow="auto" height="fill" flex={1} paddingTop={6}>
                  <TasksLayout />
                </Card>
              </Flex>
            </Inner>
          </Root>
        )}
      </AnimatePresence>
    </Portal>
  )
}
