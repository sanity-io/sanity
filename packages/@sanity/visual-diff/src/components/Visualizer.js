/* eslint-disable react/display-name */
/* eslint-disable react/no-multi-comp, react/prop-types */
import React from 'react'
//import schema from 'part:@sanity/base/schema'

function resolveIterator(item, differs) {
  // Check for custom iterator
  const customIterator = differs[item.type] ? differs[item.type][item.op] : null
  if (customIterator) {
    return customIterator
  }
  // Default iterator
  const component = props => <ul>{props.children}</ul>
  return {
    component
  }
}

function resolveDiffer(item, differs, documentType) {
  // Check for custom differ

  const customVisualDiffer = differs[item.type] ? differs[item.type][item.op] : null
  if (customVisualDiffer) {
    return customVisualDiffer
  }

  // Default differ
  const component = props => {
    const {op: operation, field, from, to, value} = props.item
    let description = ''
    if (['edit', 'editText'].includes(operation)) {
      description = `${from} --> ${to}`
    }
    if (operation === 'set') {
      description = `--> ${value}`
    }
    return (
      <li>
        {field} [{operation}] {description}
      </li>
    )
  }

  return {
    component
  }
}

function NestedVisualizer(props) {
  const {item, original, modified, differs, level} = props

  if (Array.isArray(item)) {
    // We're dealing with an array, find out how to wrap the list
    const iteratorWrapper = resolveIterator(item, differs)
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
              differs={differs}
              level={level + 1}
            />
          )
        })}
      </Component>
    )
  }

  // Not an array, resolve how to render the change summary
  const visualDiffer = resolveDiffer(item, differs, original._type)
  const Component = visualDiffer.component
  const keepGoing = visualDiffer.haltNestedRendering !== true

  return (
    <>
      <Component item={item} />
      {item.changes && keepGoing && (
        <NestedVisualizer
          item={item.changes}
          original={original}
          modified={modified}
          differs={differs}
          level={level}
        />
      )}
    </>
  )
}

const Visualizer = props => {
  const {diff, differs = {}, original, modified} = props

  if (!diff) {
    return <div>No diff present</div>
  }

  return (
    <NestedVisualizer
      item={diff}
      original={original}
      modified={modified}
      differs={differs}
      level={0}
    />
  )
}

export default Visualizer
