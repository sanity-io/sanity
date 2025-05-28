import readPackages from './utils/readPackages'

// note: used py the pkg-pr-new workflow to list packages for publishing
const relativeDirs = readPackages()
  .filter((pkg) => !pkg.manifest.private)
  .map((pkg) => pkg.relativeDir)

console.log(relativeDirs.join(' '))
