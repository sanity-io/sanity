import {afterEach, describe, expect, it, vi} from 'vitest'

import {type RefFunc} from '..'

const SCRIPT_ID = 'sanity-resource-bindings'

const BINDINGS = [
  {id: 'cors-1', name: 'localhost', type: 'sanity.project.cors'},
  {id: 'dataset-1', name: 'production', type: 'sanity.project.dataset'},
  {id: 'project-1', name: 'my-project', type: 'sanity.project'},
  {id: 'role-1', name: 'editor', type: 'sanity.access.role'},
  {id: 'studio-1', name: 'my-studio', type: 'sanity.studio'},
  // Deliberately reuses the `my-project` name under a different type, so the
  // tests can prove lookups are scoped by type and not by name alone.
  {id: 'dataset-2', name: 'my-project', type: 'sanity.project.dataset'},
]

/**
 * The module reads the `<script>` element and builds `resourceRef` at *import*
 * time, so the bindings have to be in the DOM before the module is evaluated.
 * `vi.resetModules()` drops the cached instance so each call re-runs that
 * top-level code against the DOM as it stands right now.
 *
 * Passing no argument omits the script element entirely, which is what a studio
 * built without blueprint resource bindings looks like.
 */
async function loadResourceRef(scriptContent?: string): Promise<Record<string, RefFunc>> {
  if (typeof scriptContent === 'string') {
    const el = document.createElement('script')
    el.id = SCRIPT_ID
    el.type = 'application/json'
    el.textContent = scriptContent
    document.body.appendChild(el)
  }

  vi.resetModules()
  const mod = await import('..')
  return mod.resourceRef
}

afterEach(() => {
  // jsdom's `document` is shared by every test in this file (the environment is
  // created per file, not per test), so the injected element has to be removed
  // or it leaks into the next test.
  document.getElementById(SCRIPT_ID)?.remove()
  vi.resetModules()
})

describe('resourceRef', () => {
  it('should have functions for each resource type', async () => {
    const resourceRef = await loadResourceRef(JSON.stringify(BINDINGS))
    const types = ['cors', 'dataset', 'project', 'role', 'studio']
    for (const t of types) {
      expect(t in resourceRef).toBeTruthy()
    }
  })

  it('resolves ids from the parsed script element for every resource type', async () => {
    const resourceRef = await loadResourceRef(JSON.stringify(BINDINGS))

    expect(resourceRef.cors('localhost')).toBe('cors-1')
    expect(resourceRef.dataset('production')).toBe('dataset-1')
    expect(resourceRef.project('my-project')).toBe('project-1')
    expect(resourceRef.role('editor')).toBe('role-1')
    expect(resourceRef.studio('my-studio')).toBe('studio-1')
  })

  it('scopes lookups by resource type when a name is used more than once', async () => {
    const resourceRef = await loadResourceRef(JSON.stringify(BINDINGS))

    expect(resourceRef.project('my-project')).toBe('project-1')
    expect(resourceRef.dataset('my-project')).toBe('dataset-2')
    // `localhost` only exists as a cors binding, so asking for it as a dataset
    // must not fall back to matching on name alone.
    expect(() => resourceRef.dataset('localhost')).toThrow('Unable to find dataset with name')
  })

  it('throws a named error when the binding is missing', async () => {
    const resourceRef = await loadResourceRef(JSON.stringify(BINDINGS))

    expect(() => resourceRef.project('nope')).toThrow('Unable to find project with name nope')
  })

  it('treats a missing script element as having no bindings', async () => {
    const resourceRef = await loadResourceRef()

    expect(() => resourceRef.project('my-project')).toThrow(
      'Unable to find project with name my-project',
    )
  })

  it('treats an empty script element as having no bindings', async () => {
    const resourceRef = await loadResourceRef('')

    expect(() => resourceRef.project('my-project')).toThrow(
      'Unable to find project with name my-project',
    )
  })

  it('does not fail at import time when the script content is not valid JSON', async () => {
    // A truncated or HTML-escaped payload must not take the whole studio down
    // at module evaluation; it degrades to "no bindings" instead.
    const resourceRef = await loadResourceRef('{not json')

    expect(() => resourceRef.project('my-project')).toThrow(
      'Unable to find project with name my-project',
    )
  })
})
