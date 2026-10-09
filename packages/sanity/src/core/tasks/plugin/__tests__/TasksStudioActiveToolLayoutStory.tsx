import {Card} from '@sanity/ui'
import {TasksModePromiseContext, TasksNavigationContext} from 'sanity/_singletons'
import {Text} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type Tool} from '../../../config/types'
import {type TasksMode} from '../../context/enabled/types'
import {type TasksNavigationContextValue} from '../../context/navigation/types'
import TasksStudioActiveToolLayout from '../TasksStudioActiveToolLayout'

const NOOP = () => undefined

const tool: Tool = {name: 'structure', title: 'Structure', component: () => null}

const openSidebar: TasksNavigationContextValue = {
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

// Never settles: the loading treatment is the state this story pins down
const pending = new Promise<TasksMode>(() => {})

function renderTool() {
  return (
    <Card height="fill" padding={4} tone="transparent">
      <Text muted size={1}>
        Active tool
      </Text>
    </Card>
  )
}

/**
 * The active tool layout with the tasks sidebar open while the feature check is still pending:
 * the tool keeps its space on the left and the 360px sidebar layer on the right shows the
 * centered spinner fallback instead of collapsing. The mode promise never settles, so the
 * snapshot is of the fallback and nothing else.
 */
export function TasksStudioActiveToolLayoutStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <TasksModePromiseContext value={pending}>
        <TasksNavigationContext value={openSidebar}>
          <div style={{height: 480}}>
            <TasksStudioActiveToolLayout activeTool={tool} renderDefault={renderTool} />
          </div>
        </TasksNavigationContext>
      </TasksModePromiseContext>
    </TestWrapper>
  )
}
