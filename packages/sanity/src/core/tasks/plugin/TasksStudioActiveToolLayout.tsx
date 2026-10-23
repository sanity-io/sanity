import {Card, Layer, Spinner, useMediaIndex} from '@sanity/ui'
import {AnimatePresence} from 'motion/react'
import {Suspense} from 'react'
import {Flex, Box} from 'ui5'

import {type ActiveToolLayoutProps} from '../../config/studio/types'
import {TasksStudioSidebar} from '../components/sidebar/TasksSidebar'
import {useTasksNavigation} from '../context/navigation/useTasksNavigation'
import {rootFlex, sidebarMotionLayer} from './TasksStudioActiveToolLayout.css'

// The `(max-width: 600px)` breakpoint in TasksStudioActiveToolLayout.css.ts mirrors this index.
const FULLSCREEN_MEDIA_INDEX = 1

/** The sidebar's loading treatment, shown while the feature check it reads is still pending */
function TasksSidebarFallback() {
  return (
    <Card display="flex" flex={1} height="fill" data-testid="tasks-sidebar-loading">
      <Flex alignItems="center" justifyContent="center" flexBasis="0%" flexGrow={1}>
        <Spinner />
      </Flex>
    </Card>
  )
}

export default function TasksStudioActiveToolLayout(props: ActiveToolLayoutProps) {
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
            {/* The sidebar reads the tasks mode, which suspends until the feature check has
                answered; this boundary keeps that wait inside the sidebar, which can be open
                before the check settles (a `?sidebar=tasks` link, the navbar button). */}
            <Suspense fallback={<TasksSidebarFallback />}>
              <TasksStudioSidebar />
            </Suspense>
          </Layer>
        )}
      </AnimatePresence>
    </Flex>
  )
}
