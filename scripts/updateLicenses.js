/**
 * Copies the ./LICENSE-file to each package folder (warning - will overwrite every license file in all monorepo packages packages)
 */
const {promises: fs} = require('fs')
const path = require('path')
const readPackages = require('./utils/readPackages')

const readLicense = fs.readFile(path.join(process.cwd(), 'LICENSE'), 'utf-8')

Promise.all(
  readPackages().map(async pkg => {
    const licenseTxt = await readLicense
    const targetPath = path.join(pkg.dirname, 'LICENSE')
    await fs.writeFile(targetPath, licenseTxt)
    return targetPath
  })
).then(targetPaths => {
  console.log('Copied the ./LICENSE file to %s to packages.', targetPaths.length)
})
