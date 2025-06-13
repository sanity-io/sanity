/**
 * This blueprint is used to run and test the examples.
 *
 * If you are looking for the blueprint configuration for a specific example,
 * go to the example's README.md file or the example's package.json file.
 */
import {readdirSync, readFileSync} from 'node:fs'
import {join} from 'node:path'

import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

function loadFunctionResources() {
  const functionsDir = './functions'
  const resources = []

  try {
    const folders = readdirSync(functionsDir, {withFileTypes: true})
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)

    for (const folder of folders) {
      try {
        const packageJsonPath = join(functionsDir, folder, 'package.json')
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
        if (!packageJson.blueprintResourceItem) {
          console.warn(`No blueprint resource item found in ${folder}`)
          continue
        }

        // @ts-expect-error - TODO: fix this
        resources.push(defineDocumentFunction(packageJson.blueprintResourceItem))
      } catch (error) {
        console.warn(`Failed to load blueprint resource from ${folder}:`, error.message)
      }
    }
  } catch (error) {
    console.warn('Failed to read functions directory:', error.message)
  }

  return resources
}

export default defineBlueprint({
  organizationId: 'oSyH1iET5',
  projectId: 'cgd8g1dj',
  resources: loadFunctionResources(),
})
