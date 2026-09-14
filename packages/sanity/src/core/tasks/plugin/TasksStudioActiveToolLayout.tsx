import {Layer, useMediaIndex} from '@sanity/ui'
import {AnimatePresence} from 'motion/react'
import {Flex, Box} from 'ui5'

import {type ActiveToolLayoutProps} from '../../config/studio/types'
import {TasksStudioSidebar} from '../components/sidebar/TasksSidebar'
import {useTasksEnabled} from '../context/enabled/useTasksEnabled'
import {useTasksNavigation} from '../context/navigation/useTasksNavigation'
import {rootFlex, sidebarMotionLayer} from './TasksStudioActiveToolLayout.css'

// The `(max-width: 600px)` breakpoint in TasksStudioActiveToolLayout.css.ts mirrors this index.
const FULLSCREEN_MEDIA_INDEX = 1

function TasksStudioActiveToolLayoutInner(props: ActiveToolLayoutProps) {
  const mediaIndex = useMediaIndex()
  const {
    state: {isOpen},
  } = useTasksNavigation()

  // Lock the scroll when the sidebar is open in fullscreen mode
  const scrollLock = mediaIndex <= FULLSCREEN_MEDIA_INDEX && isOpen
  return (
    <Flex className={rootFlex} height="100%">
      <Box flexBasis="0%" flexGrow={1} height="100%" overflow={scrollLock ? 'hidden' : 'auto'}>
        {props.renderDefault(props)}
      </Box>

      <AnimatePresence initial={false}>
        {isOpen && (
          <Layer className={sidebarMotionLayer} zOffset={100} height="fill">
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
