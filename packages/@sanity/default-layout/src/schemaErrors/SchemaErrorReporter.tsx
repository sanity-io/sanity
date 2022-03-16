import {useSource} from '@sanity/base'
import {Schema} from '@sanity/types'
import React, {useEffect} from 'react'
import SchemaErrors from './SchemaErrors'

interface SchemaErrorReporterProps {
  children: () => React.ReactNode
}

declare const __DEV__: boolean

export function SchemaErrorReporter(props: SchemaErrorReporterProps): React.ReactElement {
  const source = useSource()

  const problemGroups = source.schema._validation

  const groupsWithErrors = problemGroups.filter((group) =>
    group.problems.some((problem) => problem.severity === 'error')
  )

  useEffect(() => reportWarnings(source.schema), [source.schema])

  if (groupsWithErrors.length > 0) {
    return <SchemaErrors problemGroups={groupsWithErrors} />
  }

  return <>{props.children()}</>
}

function renderPath(path: any[]) {
  return path
    .map((segment) => {
      if (segment.kind === 'type') {
        return `${segment.name || '<unnamed>'}(${segment.type})`
      }
      if (segment.kind === 'property') {
        return segment.name
      }
      if (segment.kind === 'type') {
        return `${segment.type}(${segment.name || '<unnamed>'})`
      }
      return null
    })
    .filter(Boolean)
    .join(' > ')
}

function reportWarnings(schema: Schema) {
  if (!__DEV__) {
    return
  }

  /* eslint-disable no-console */
  const problemGroups = schema._validation

  const groupsWithWarnings = problemGroups.filter((group) =>
    group.problems.some((problem) => problem.severity === 'warning')
  )
  if (groupsWithWarnings.length === 0) {
    return
  }
  console.groupCollapsed(`⚠️ Schema has ${groupsWithWarnings.length} warnings`)
  groupsWithWarnings.forEach((group) => {
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
