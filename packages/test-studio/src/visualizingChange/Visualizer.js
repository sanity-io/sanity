/* eslint-disable react/display-name */
/* eslint-disable react/no-multi-comp, react/prop-types */
import React from 'react'

function resolveIteratorComponent(item, differs) {
  const Component = differs[item.type] ? differs[item.type][item.op] : null
  if (Component) {
    return props => <Component item={props.item}>{props.children}</Component>
  }
  // primitive default
  return props => <ul>{props.children}</ul>
}

function resolveDifferComponent(item, differs) {
  const Component = differs[item.type] ? differs[item.type][item.op] : null
  if (Component) {
    return <Component item={item} />
  }

  // primitive default
  let description = ''
  if (item.op === 'editText') {
    description = `${item.from} --> ${item.to}`
  }
  if (item.op === 'set') {
    description = `--> ${item.value}`
  }
  return (
    <li>
      {item.field} [{item.op}] {description}
    </li>
  )
}

function NestedVisualizer(props) {
  const {item, differs, level} = props

  if (Array.isArray(item)) {
    const IteratorWrapper = resolveIteratorComponent(item, differs)
    return (
      <IteratorWrapper>
        {item.map(subItem => {
          const key = `level_${level}_${subItem.field}`
          return <NestedVisualizer key={key} item={subItem} differs={differs} level={level + 1} />
        })}
      </IteratorWrapper>
    )
  }

  return (
    <>
      {resolveDifferComponent(item, differs)}
      {item.changes && <NestedVisualizer item={item.changes} differs={differs} level={level + 1} />}
    </>
  )
}

const Visualizer = props => {
  const {diff, differs = {}} = props

  if (!diff) {
    return <div>No diff detected</div>
  }

  return <NestedVisualizer item={diff} differs={differs} level={0} />
}

export default Visualizer
