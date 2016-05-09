import buildModuleHierarchy from './buildModuleHierarchy'

export default function sortModulesBySize(modules) {
  const hierarchy = buildModuleHierarchy(modules)

  return findLargestModules([], hierarchy)
    .reduce(groupByDepth, [])
    .sort((modA, modB) => modB.size - modA.size)
}


function findLargestModules(list, node) {
  let modList = list
  if (node.children) {
    modList = node.children.reduce(findLargestModules, list)
  }

  if (node.size) {
    modList.push({
      name: node.displayName || node.name,
      size: node.size
    })
  }

  return modList
}

function getModuleName(name) {
  const parts = name
    .replace(/^\.\/~\//, './node_modules/')
    .replace(/^.\//, '')
    .split('/')

  return parts[1] && (parts[1][0] === '@' || parts[0] === '..')
    ? parts.slice(0, 3).join('/')
    : parts.slice(0, 2).join('/')
}

function groupByDepth(target, file) {
  const name = getModuleName(file.name)
  const size = file.size
  const existing = target.find(module => module.name === name)

  if (existing) {
    existing.size += size
  } else {
    target.push({name, size})
  }

  return target
}
