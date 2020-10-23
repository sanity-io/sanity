const PackageGraph = require('@lerna/package-graph')
const {getFilteredPackages} = require('@lerna/filter-options')
const Project = require('@lerna/project')
const {toposort} = require('@lerna/query-graph')
const {spawnSync} = require('child_process')

// When used as a module, this script exports a function that, when called, will invoke itself through
// child_process.spawnSync and return the JSON parsed stdout. When called as a script, it will retrieve
// (async) the monorepo packages sorted by topology and write the list of packages as a JSON string to stdout.
//
// (who says you can't make asynchronous APIs synchronous? :p)

async function getLernaTopology(dir) {
  const packages = await new Project(dir).getPackages()
  const pkgs = await getFilteredPackages(new PackageGraph(packages))
  return toposort(pkgs, {graphType: 'allDependencies'}).map((pkg) => pkg.name)
}

if (require.main === module) {
  getLernaTopology(process.cwd()).then((topology) => process.stdout.write(JSON.stringify(topology)))
}

exports.getPackagesOrderedByTopology = function getPackagesOrderedByTopology() {
  const {stderr, stdout} = spawnSync('node', [__filename], {encoding: 'utf8'})
  if (stderr) {
    // eslint-disable-next-line no-console
    console.log('[package topology] %s ', stderr)
  }
  return JSON.parse(stdout)
}
