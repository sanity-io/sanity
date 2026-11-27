/**
 * The chunk of the tasks sidebar, which `TasksStudioActiveToolLayout` renders once the sidebar is
 * opened. The navbar button calls it when it is hovered or focused, so the chunk is on its way
 * before the click.
 */
export const lazyTasksStudioSidebar = () => import('../components/sidebar/TasksSidebar.lazy')
