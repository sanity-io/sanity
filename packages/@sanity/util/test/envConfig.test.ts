/* eslint-disable no-process-env */

let backup = {}
beforeEach(() => (backup = {}))
afterEach(() => {
  Object.keys(backup).forEach((key) => {
    if (backup[key]) {
      process.env[key] = backup[key]
    } else {
      delete process.env[key]
    }
  })
})

const temporarilySetEnv = (key: string, value: string) => {
  backup[key] = process.env[key]
  process.env[key] = value
}

test('respects env config', () => {
  temporarilySetEnv('SANITY_STUDIO_API_PROJECT_ID', 'abc')
  temporarilySetEnv('SANITY_STUDIO_API_DATASET', 'overridden')
  temporarilySetEnv('SANITY_STUDIO_PROJECT_BASEPATH', 'myRoot')
  temporarilySetEnv('SANITY_STUDIO_PROJECT_NAME', 'New Name')
  const {reduceConfig} = require('../src/_exports/index')

  const reduced = reduceConfig({
    project: {
      name: 'Project',
    },
    api: {
      projectId: 'myprojectid',
      dataset: 'production',
    },
  })

  expect(reduced.api.projectId).toEqual('abc')
  expect(reduced.api.dataset).toEqual('overridden')
  expect(reduced.project.basePath).toEqual('myRoot')
  expect(reduced.project.name).toEqual('New Name')
})

test('without envs', () => {
  const {reduceConfig} = require('../src/_exports/index')

  const reduced = reduceConfig({
    project: {
      name: 'Project',
    },
    api: {
      projectId: 'myprojectid',
      dataset: 'production',
    },
  })

  expect(reduced.api.projectId).toEqual('myprojectid')
  expect(reduced.api.dataset).toEqual('production')
  expect(reduced.project.name).toEqual('Project')
  expect(reduced.project.basePath).toBe(undefined)
})
