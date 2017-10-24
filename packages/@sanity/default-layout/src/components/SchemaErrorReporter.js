import React from 'react'
import PropTypes from 'prop-types'
import schema from 'part:@sanity/base/schema'
import {SchemaErrors} from './SchemaErrors'

function renderPath(path) {
  return path.map(segment => {
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

  const groupsWithWarnings = problemGroups
    .filter(group => group.problems
      .some(problem => problem.severity === 'warning'))
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
    console.groupEnd(`At ${path}`)
  })
  console.groupEnd('Schema warnings')
  /* eslint-enable no-console */
}

export class SchemaErrorReporter extends React.Component {
  componentDidMount = reportWarnings
  render() {
    const problemGroups = schema._validation

    const groupsWithErrors = problemGroups
      .filter(group => group.problems
        .some(problem => problem.severity === 'error'))

    if (groupsWithErrors.length > 0) {
      return (
        <div style={{padding: '3em', width: '100%', height: '100%', overflow: 'auto'}}>
          <h2>Uh oh… found errors in schema</h2>
          <SchemaErrors problemGroups={groupsWithErrors} />
        </div>
      )
    }

    return this.props.children()
  }
}

SchemaErrorReporter.propTypes = {
  children: PropTypes.func
}
