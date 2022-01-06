/* eslint-disable no-process-env */

let backup = {}
beforeAll(() => {
  const {
    SANITY_STUDIO_API_PROJECT_ID,
    SANITY_STUDIO_API_DATASET,
    SANITY_STUDIO_PROJECT_BASEPATH,
  } = process.env

  backup = {
    SANITY_STUDIO_API_PROJECT_ID,
    SANITY_STUDIO_API_DATASET,
    SANITY_STUDIO_PROJECT_BASEPATH,
  }
})

afterAll(() => {
  Object.keys(backup).forEach((key) => {
    if (backup[key]) {
      process.env[key] = backup[key]
    } else {
      delete process.env[key]
    }
  })
})

test('respects env config', () => {
  process.env.SANITY_STUDIO_API_PROJECT_ID = 'abc'
  process.env.SANITY_STUDIO_API_DATASET = 'overridden'
  process.env.SANITY_STUDIO_PROJECT_BASEPATH = 'myRoot'
  const {reduceConfig} = require('../src/_exports/index')

  const reduced = reduceConfig({
    project: {
      name: 'Project',
    },
    api: {
      projectId: 'kbrhtt13',
      dataset: 'production',
    },
  })

  expect(reduced.api.projectId).toEqual('abc')
  expect(reduced.api.dataset).toEqual('overridden')
  expect(reduced.project.basePath).toEqual('myRoot')
})
