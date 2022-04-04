import {Schema, SchemaValidationProblemPath} from '@sanity/types'
import {Card} from '@sanity/ui'
import React, {useEffect} from 'react'
import {SchemaErrors} from './SchemaErrors'

interface SchemaErrorsScreenProps {
  schema: Schema
}

declare const __DEV__: boolean

export function SchemaErrorsScreen({schema}: SchemaErrorsScreenProps) {
  const groupsWithErrors =
    schema._validation?.filter((group) =>
      group.problems.some((problem) => problem.severity === 'error')
    ) || []

  useEffect(() => reportWarnings(schema), [schema])

  return (
    <Card height="fill">
      <SchemaErrors problemGroups={groupsWithErrors} />
    </Card>
  )
}

function renderPath(path: SchemaValidationProblemPath) {
  return path
    .map((segment) => {
      if (segment.kind === 'type') {
        return `${segment.name || '<unnamed>'}(${segment.type})`
      }

      if (segment.kind === 'property') {
        return segment.name
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
