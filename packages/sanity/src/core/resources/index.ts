/**
 * A map of supported resource types to their blueprint-specific information.
 */
const RESOURCE_MAP: Record<string, {type: string}> = {
  cors: {type: 'sanity.project.cors'},
  dataset: {type: 'sanity.project.dataset'},
  project: {type: 'sanity.project'},
  role: {type: 'sanity.access.role'},
  studio: {type: 'sanity.studio'},
}

/**
 * The shape of the resources in the script element
 */
interface ResourceBinding {
  id: string
  name: string
  type: string
}

/**
 * A function that looks up a resource binding based on its name.
 */
export type RefFunc = (name: string) => string

/**
 * An object that allows resource identifier to be looked up based on its name in a blueprint.
 *
 * ```
 * resourceRef.project('my-project') // returns the project ID
 * ```
 */
export const resourceRef: Record<string, RefFunc> = {}

// TODO: do we need to defer this code until the document is loaded?
const el = document.getElementById('sanity-resource-bindings')
const bindings: ResourceBinding[] = el ? JSON.parse(el.textContent || '[]') : []

Object.entries(RESOURCE_MAP).forEach(([resourceType, data]) => {
  resourceRef[resourceType] = (name: string) => {
    const found = bindings.find((b) => b.name === name && b.type === data.type)
    if (!found) {
      throw new Error(`Unable to find ${resourceType} with name ${name}`)
    }
    return found.id
  }
})
