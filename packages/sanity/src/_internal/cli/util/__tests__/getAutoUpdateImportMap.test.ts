import {describe, expect, test} from 'vitest'

import {getAutoUpdatesImportMap} from '../getAutoUpdatesImportMap'

describe('getAutoUpdateImportMap() without app id', () => {
  test('works with sanity package', () => {
    const autoUpdatesImportMap = getAutoUpdatesImportMap([{name: 'sanity', version: '3.2.0'}], {
      timestamp: 1755770630,
      baseUrl: 'https://sanity-cdn.com',
    })
    expect(autoUpdatesImportMap).toEqual({
      'sanity': 'https://sanity-cdn.com/v1/modules/sanity/default/%5E3.2.0/t1755770630',
      'sanity/': 'https://sanity-cdn.com/v1/modules/sanity/default/%5E3.2.0/t1755770630/',
    })
  })
  test('works with scoped packages', () => {
    expect(
      getAutoUpdatesImportMap([{name: '@sanity/vision', version: '4.2.0'}], {
        timestamp: 1755770630,
        baseUrl: 'https://sanity-cdn.com',
      }),
    ).toEqual({
      '@sanity/vision':
        'https://sanity-cdn.com/v1/modules/@sanity__vision/default/%5E4.2.0/t1755770630',
      '@sanity/vision/':
        'https://sanity-cdn.com/v1/modules/@sanity__vision/default/%5E4.2.0/t1755770630/',
    })
  })
  test('works with sdk packages', () => {
    expect(
      getAutoUpdatesImportMap(
        [
          {name: '@sanity/sdk', version: '1.0.0'},
          {name: '@sanity/sdk-react', version: '1.3.0'},
        ],
        {timestamp: 1755770630, baseUrl: 'https://sanity-cdn.com'},
      ),
    ).toEqual({
      '@sanity/sdk': 'https://sanity-cdn.com/v1/modules/@sanity__sdk/default/%5E1.0.0/t1755770630',
      '@sanity/sdk/':
        'https://sanity-cdn.com/v1/modules/@sanity__sdk/default/%5E1.0.0/t1755770630/',
      '@sanity/sdk-react':
        'https://sanity-cdn.com/v1/modules/@sanity__sdk-react/default/%5E1.3.0/t1755770630',
      '@sanity/sdk-react/':
        'https://sanity-cdn.com/v1/modules/@sanity__sdk-react/default/%5E1.3.0/t1755770630/',
    })
  })
})

describe('getAutoUpdateImportMap() with app id', () => {
  test('works with sanity package', () => {
    const autoUpdatesImportMap = getAutoUpdatesImportMap([{name: 'sanity', version: '3.2.0'}], {
      timestamp: 1755770630,
      appId: 'foo321bar123',
      baseUrl: 'https://sanity-cdn.com',
    })
    expect(autoUpdatesImportMap).toEqual({
      'sanity': 'https://sanity-cdn.com/v1/modules/by-app/foo321bar123/t1755770630/%5E3.2.0/sanity',
      'sanity/':
        'https://sanity-cdn.com/v1/modules/by-app/foo321bar123/t1755770630/%5E3.2.0/sanity/',
    })
  })
  test('works with scoped packages', () => {
    expect(
      getAutoUpdatesImportMap([{name: '@sanity/vision', version: '4.2.0'}], {
        timestamp: 1755770630,
        appId: 'foo321bar123',
        baseUrl: 'https://sanity-cdn.com',
      }),
    ).toEqual({
      '@sanity/vision':
        'https://sanity-cdn.com/v1/modules/by-app/foo321bar123/t1755770630/%5E4.2.0/@sanity__vision',
      '@sanity/vision/':
        'https://sanity-cdn.com/v1/modules/by-app/foo321bar123/t1755770630/%5E4.2.0/@sanity__vision/',
    })
  })
  test('works with sdk packages', () => {
    expect(
      getAutoUpdatesImportMap(
        [
          {name: '@sanity/sdk', version: '1.0.0'},
          {name: '@sanity/sdk-react', version: '1.3.0'},
        ],
        {timestamp: 1755770630, appId: 'foo321bar123', baseUrl: 'https://sanity-cdn.com'},
      ),
    ).toEqual({
      '@sanity/sdk':
        'https://sanity-cdn.com/v1/modules/by-app/foo321bar123/t1755770630/%5E1.0.0/@sanity__sdk',
      '@sanity/sdk/':
        'https://sanity-cdn.com/v1/modules/by-app/foo321bar123/t1755770630/%5E1.0.0/@sanity__sdk/',
      '@sanity/sdk-react':
        'https://sanity-cdn.com/v1/modules/by-app/foo321bar123/t1755770630/%5E1.3.0/@sanity__sdk-react',
      '@sanity/sdk-react/':
        'https://sanity-cdn.com/v1/modules/by-app/foo321bar123/t1755770630/%5E1.3.0/@sanity__sdk-react/',
    })
  })
})
