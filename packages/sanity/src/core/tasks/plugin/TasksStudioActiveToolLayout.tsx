import {Box, Flex, Layer, useMediaIndex} from '@sanity/ui'
import {AnimatePresence, motion, type Transition, type Variants} from 'framer-motion'
import {css, styled} from 'styled-components'

import {type ActiveToolLayoutProps} from '../../config'
import {TasksStudioSidebar} from '../components'
import {useTasksEnabled, useTasksNavigation} from '../context'

const VARIANTS: Variants = {
  hidden: {opacity: 0},
  visible: {opacity: 1},
}

const TRANSITION: Transition = {duration: 0.2}

const FULLSCREEN_MEDIA_INDEX = 1
const POSITION_ABSOLUTE_MEDIA_INDEX = 3

const RootFlex = styled(Flex)(({theme}) => {
  const media = theme.sanity.media

  return css`
    min-height: 100%;

    @media (max-width: ${media[POSITION_ABSOLUTE_MEDIA_INDEX]}px) {
      position: relative;
    }
  `
})

const SidebarMotionLayer = styled(motion.create(Layer))(({theme}) => {
  const media = theme.sanity.media

  return css`
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 360px;
    border-left: 1px solid var(--card-border-color);
    box-sizing: border-box;
    overflow: hidden;

    box-shadow:
      0px 6px 8px -4px var(--card-shadow-umbra-color),
      0px 12px 17px -1px var(--card-shadow-penumbra-color);

    @media (max-width: ${media[POSITION_ABSOLUTE_MEDIA_INDEX]}px) {
      bottom: 0;
      position: absolute;
      right: 0;
      top: 0;
    }

    @media (max-width: ${media[FULLSCREEN_MEDIA_INDEX]}px) {
      border-left: 0;
      min-width: 100%;
      left: 0;
    }
  `
})

function TasksStudioActiveToolLayoutInner(props: ActiveToolLayoutProps) {
  const mediaIndex = useMediaIndex()
  const {
    state: {isOpen},
  } = useTasksNavigation()

  // Lock the scroll when the sidebar is open in fullscreen mode
  const scrollLock = mediaIndex <= FULLSCREEN_MEDIA_INDEX && isOpen
  return (
    <RootFlex sizing="border" height="fill">
      <Box flex={1} height="fill" overflow={scrollLock ? 'hidden' : 'auto'}>
        {props.renderDefault(props)}
      </Box>

      <AnimatePresence initial={false}>
        {isOpen && (
          <SidebarMotionLayer
            animate="visible"
            zOffset={100}
            height="fill"
            initial="hidden"
            transition={TRANSITION}
            variants={VARIANTS}
          >
            <TasksStudioSidebar />
          </SidebarMotionLayer>
        )}
      </AnimatePresence>
    </RootFlex>
  )
}

export function TasksStudioActiveToolLayout(props: ActiveToolLayoutProps) {
  const {enabled} = useTasksEnabled()
  if (!enabled) {
    return props.renderDefault(props)
  }

  return <TasksStudioActiveToolLayoutInner {...props} />
}
