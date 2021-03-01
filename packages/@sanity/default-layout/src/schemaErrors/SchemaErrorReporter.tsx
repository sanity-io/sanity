import React from 'react'
import schema from 'part:@sanity/base/schema'
import {getTemplateErrors} from '@sanity/base/initial-value-templates'
import InitialValueTemplateError from './InitialValueTemplateError'
import SchemaErrors from './SchemaErrors'

interface Props {
  children: () => React.ReactNode
}

declare const __DEV__: boolean

function renderPath(path) {
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

function reportWarnings() {
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
  groupsWithWarnings.forEach((group, i) => {
    const path = renderPath(group.path)
    console.group(`%cAt ${path}`, 'color: #FF7636')
    group.problems.forEach((problem, j) => {
      console.log(problem.message)
    })
    ;(console as any).groupEnd(`At ${path}`)
  })
  ;(console as any).groupEnd('Schema warnings')
  /* eslint-enable no-console */
}

export class SchemaErrorReporter extends React.Component<Props> {
  componentDidMount = reportWarnings
  render() {
    const problemGroups = schema._validation

    const groupsWithErrors = problemGroups.filter((group) =>
      group.problems.some((problem) => problem.severity === 'error')
    )

    if (groupsWithErrors.length > 0) {
      return <SchemaErrors problemGroups={groupsWithErrors} />
    }

    const templateErrors = getTemplateErrors(undefined as any)
    if (templateErrors.length > 0) {
      return <InitialValueTemplateError errors={templateErrors} />
    }

    return this.props.children()
  }
}
