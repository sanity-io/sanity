const path = require('path')
const {readJson} = require('fs-extra')
const resolveFrom = require('resolve-from')
const semverCompare = require('semver-compare')

const purpose = 'Transform react-icons v2 imports to v3 form'
const description = `
Modifies all found react-icons import and require statements from their v2 form
to the path structure used in react-icons v3. For instance:

from: import {MdPerson} from 'react-icons/lib/md'
  to: import {MdPerson} from 'react-icons/md'

from: import PersonIcon from 'react-icons/lib/md/person'
  to: import {MdPerson as PersonIcon} from 'react-icons/md'
`.trim()

module.exports = {
  purpose,
  description,
  verify: async (context) => {
    const {workDir} = context

    const studioPkg = await maybeReadJson(path.join(workDir, 'package.json'))
    const dependencies = (studioPkg && studioPkg.dependencies) || {}
    const dependencyVersion = (dependencies['react-icons'] || '').replace(/^[\^~]/, '')
    if (!dependencyVersion) {
      throw new Error('Could not find react-icons declared as dependency in package.json')
    }

    if (semverCompare(dependencyVersion, '3.0.0') < 0) {
      throw new Error('react-icons declared in package.json dependencies is lower than 3.0.0')
    }

    const iconPkgPath = resolveFrom.silent(workDir, 'react-icons/package.json')
    const iconPkg = iconPkgPath && (await maybeReadJson(iconPkgPath))
    if (iconPkg && semverCompare(iconPkg.version, '3.0.0') < 0) {
      throw new Error('The installed version of react-icon seems to be < 3.0.0')
    }
  },
}

async function maybeReadJson(jsonPath) {
  try {
    return await readJson(jsonPath)
  } catch (err) {
    return null
  }
}
