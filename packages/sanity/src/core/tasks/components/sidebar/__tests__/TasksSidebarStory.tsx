import {Card} from '@sanity/ui'
import {Suspense} from 'react'
import {TasksModePromiseContext, TasksNavigationContext} from 'sanity/_singletons'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type TasksMode} from '../../../context/enabled/types'
import {type TasksNavigationContextValue} from '../../../context/navigation/types'
import {tasksUsEnglishLocaleBundle} from '../../../i18n'
import {TasksStudioSidebar} from '../TasksSidebar'

const NOOP = () => undefined

const openList: TasksNavigationContextValue = {
  state: {
    activeTabId: 'assigned',
    viewMode: 'list',
    selectedTask: null,
    isOpen: true,
    duplicateTaskValues: null,
  },
  setActiveTab: NOOP,
  setViewMode: NOOP,
  handleCloseTasks: NOOP,
  handleCopyLinkToTask: NOOP,
  handleOpenTasks: NOOP,
}

// A feature check that failed: the sidebar reads this with `use()` and fails closed
const unavailable = Promise.resolve<TasksMode>(null)

/**
 * The tasks sidebar after a failed feature check, framed at the sidebar layer's width: the header
 * keeps its title and close control with the New button disabled, the tabs are gone, and the
 * muted "unavailable" message sits where the list would be. No tasks provider is mounted, which
 * is also how the studio renders it when the plan is unknown.
 */
export function TasksSidebarStory() {
  return (
    <TestWrapper i18nBundles={[tasksUsEnglishLocaleBundle]} schemaTypes={[]}>
      <TasksModePromiseContext value={unavailable}>
        <TasksNavigationContext value={openList}>
          <Card border display="flex" style={{width: 360, height: 480}}>
            <Suspense fallback={null}>
              <TasksStudioSidebar />
            </Suspense>
          </Card>
        </TasksNavigationContext>
      </TasksModePromiseContext>
    </TestWrapper>
  )
}
