/* eslint-disable react/display-name */
/* eslint-disable react/no-multi-comp, react/prop-types */
import React from 'react'
import {isObject} from 'lodash'
//import schema from 'part:@sanity/base/schema'

function fullPath(path) {
  let result = ''
  path.forEach(item => {
    if (isObject(item)) {
      result = `${result}[_key=${item._key}]`
    } else {
      result = `${result}.${item}`
    }
  })
  return result
}

function resolveIterator(item, visualizers) {
  // Check for custom iterator
  const customIterator = visualizers[item.type] ? visualizers[item.type][item.op] : null
  if (customIterator) {
    return customIterator
  }
  // Default iterator
  const component = props => <ul>{props.children}</ul>
  return {
    component
  }
}

function resolveVisualizer(item, visualizers, documentType) {
  // Check for custom visualizer

  const customVisualDiffer = visualizers[item.type] ? visualizers[item.type][item.op] : null
  if (customVisualDiffer) {
    return customVisualDiffer
  }

  // Default visualizer
  // TODO: Remove and incorporate into `defaultVisualizers.js`
  const component = props => {
    const {operation, path, from, to} = props.item

    let description = ''
    if (['edit', 'editText'].includes(operation)) {
      description = `${from} --> ${to}`
    }
    if (operation === 'add') {
      description = `--> ${isObject(to) ? JSON.stringify(to, null, 2) : to}`
    }
    return (
      <li>
        {fullPath(path)} [{operation}] {description}
      </li>
    )
  }

  return {
    component
  }
}

function NestedVisualizer(props) {
  const {item, original, modified, visualizers, level} = props

  if (Array.isArray(item)) {
    // We're dealing with an array, find out how to wrap the list
    const iteratorWrapper = resolveIterator(item, visualizers)
    const Component = iteratorWrapper.component
    return (
      <Component>
        {item.map((subItem, index) => {
          // Now render a visualizer for each element in the array
          const key = `level_${level}_${index}`

          return (
            <NestedVisualizer
              key={key}
              item={subItem}
              original={original}
              modified={modified}
              visualizers={visualizers}
              level={level + 1}
            />
          )
        })}
      </Component>
    )
  }

  // Not an array, resolve how to render the change summary
  const visualizer = resolveVisualizer(item, visualizers, original._type)
  const Component = visualizer.component
  const keepGoing = visualizer.haltNestedRendering !== true

  return (
    <>
      <Component item={item} />
      {item.changes && keepGoing && (
        <NestedVisualizer
          item={item.changes}
          original={original}
          modified={modified}
          visualizers={visualizers}
          level={level}
        />
      )}
    </>
  )
}

const Visualizer = props => {
  const {diff, visualizers = {}, original, modified} = props

  if (!diff) {
    return <div>No diff present</div>
  }

  return (
    <NestedVisualizer
      item={diff}
      original={original}
      modified={modified}
      visualizers={visualizers}
      level={0}
    />
  )
}

export default Visualizer
