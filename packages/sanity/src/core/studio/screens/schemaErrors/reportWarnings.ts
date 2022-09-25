import {Schema} from '@sanity/types'
import {renderPath} from './utils'

export function reportWarnings(schema: Schema) {
  /* eslint-disable no-console */
  const problemGroups = schema._validation

  const groupsWithWarnings = problemGroups?.filter((group) =>
    group.problems.some((problem) => problem.severity === 'warning')
  )
  if (groupsWithWarnings?.length === 0) {
    return
  }
  console.groupCollapsed(`⚠️ Schema has ${groupsWithWarnings?.length} warnings`)
  groupsWithWarnings?.forEach((group) => {
    const path = renderPath(group.path)

    console.group(`%cAt ${path}`, 'color: #FF7636')

    group.problems.forEach((problem) => {
      console.log(problem.message)
    })

    console.groupEnd()
  })
  console.groupEnd()
  /* eslint-enable no-console */
}
