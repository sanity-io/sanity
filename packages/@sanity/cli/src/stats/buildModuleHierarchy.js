function buildHierarchy(modules) {
  let maxDepth = 1

  const root = {
    children: [],
    name: 'root'
  }

  modules.forEach(module => {
    const mod = {
      displayName: normalizeName(module.name),
      sanityRole: getSanityRole(module.name),
      fullName: module.name,
      size: module.size
    }

    const depth = mod.fullName.split('/').length - 1
    if (depth > maxDepth) {
      maxDepth = depth
    }

    let fileName = mod.fullName
    const beginning = mod.fullName.slice(0, 2)
    if (beginning === './') {
      fileName = fileName.slice(2)
    }

    getFile(mod, fileName, root)
  })

  root.maxDepth = maxDepth
  return root
}


function getFile(module, fileName, parentTree) {
  const charIndex = fileName.indexOf('/')

  if (charIndex === -1) {
    module.name = fileName
    parentTree.children.push(module)
    return
  }

  let folder = fileName.slice(0, charIndex)
  if (folder === '~') {
    folder = 'node_modules'
  }

  let childFolder = parentTree.children.find(item => item.name === folder)
  if (!childFolder) {
    childFolder = {
      name: folder,
      children: []
    }
    parentTree.children.push(childFolder)
  }

  getFile(module, fileName.slice(charIndex + 1), childFolder)
}

function normalizeName(name) {
  return name.replace(/\?sanityRole=.*/, '')
}

function getSanityRole(name) {
  const match = name.match(/.*?\?sanityRole=(.*?)(&|$)/)
  return match && decodeURIComponent(match[1])
}

export default buildHierarchy
