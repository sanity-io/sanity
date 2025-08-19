import {simple as walk} from 'acorn-walk'
import {analyze, type ModuleScope, type ScopeManager} from 'eslint-scope'
import {type Node, type Program, type VariableDeclarator} from 'estree'

type AcornNode = Parameters<typeof walk>[0]

const scopeManagerCache = new WeakMap<Node, ScopeManager>()
function getScopeManager(node: Node) {
  const cached = scopeManagerCache.get(node)
  if (cached) return cached

  if (node?.type !== 'Program') {
    throw new Error(`Could not get scope manager for node blah ${node.type}`)
  }

  const scopeManager = analyze(node, {ecmaVersion: 2022, sourceType: 'module'})
  walk(node as Extract<AcornNode, {type: 'Program'}>, {
    Program(n) {
      scopeManagerCache.set(n as Node, scopeManager)
    },
    VariableDeclarator(n) {
      scopeManagerCache.set(n as Node, scopeManager)
    },
  })

  return scopeManager
}

export function getModuleScope(program: Program): ModuleScope {
  const scopeManager = getScopeManager(program)

  const moduleScope = scopeManager.globalScope.childScopes.at(0)
  if (moduleScope?.type !== 'module') {
    throw new Error('no module scope')
  }
  return moduleScope as ModuleScope
}

export function getVariableScope(node: VariableDeclarator) {
  const scopeManager = getScopeManager(node)
  const variables = scopeManager.getDeclaredVariables(node)

  if (node.id.type !== 'Identifier') {
    throw new Error('only identifiers are supported idk')
  }

  for (const variable of variables) {
    for (const id of variable.identifiers) {
      if (id.name === node.id.name) return variable.scope
    }
  }

  throw new Error('could not get variable scope for blah')
}
