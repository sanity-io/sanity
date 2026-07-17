/**
 * Note: we are forwarding the workbench render function from the workbench package,
 * to avoid having to install the workbench package as a dependency in the user project.
 */

export {unstable_defineService, unstable_defineView} from '@sanity/cli/runtime'
export {renderWorkbench} from '@sanity/workbench/_internal'
