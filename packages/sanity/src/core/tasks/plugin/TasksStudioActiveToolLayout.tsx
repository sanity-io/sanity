import {Box, Flex, Layer, useMediaIndex} from '@sanity/ui'
import {AnimatePresence} from 'motion/react'

import {type ActiveToolLayoutProps} from '../../config'
import {TasksStudioSidebar} from '../components'
import {useTasksEnabled, useTasksNavigation} from '../context'
import * as classes from './TasksStudioActiveToolLayout.css'

const FULLSCREEN_MEDIA_INDEX = 1
const POSITION_ABSOLUTE_MEDIA_INDEX = 3

function TasksStudioActiveToolLayoutInner(props: ActiveToolLayoutProps) {
  const mediaIndex = useMediaIndex()
  const {
    state: {isOpen},
  } = useTasksNavigation()

  // Lock the scroll when the sidebar is open in fullscreen mode
  const scrollLock = mediaIndex <= FULLSCREEN_MEDIA_INDEX && isOpen
  return (
    <Flex className={classes.rootFlex} sizing="border" height="fill">
      <Box flex={1} height="fill" overflow={scrollLock ? 'hidden' : 'auto'}>
        {props.renderDefault(props)}
      </Box>

      <AnimatePresence initial={false}>
        {isOpen && (
          <Layer className={classes.sidebarMotionLayer} zOffset={100} height="fill">
            <TasksStudioSidebar />
          </Layer>
        )}
      </AnimatePresence>
    </Flex>
  )
}

export function TasksStudioActiveToolLayout(props: ActiveToolLayoutProps) {
  const {enabled} = useTasksEnabled()
  if (!enabled) {
    return props.renderDefault(props)
  }

  return <TasksStudioActiveToolLayoutInner {...props} />
}
