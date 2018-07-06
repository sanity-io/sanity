import latestVersion from 'get-latest-version'
import promiseProps from 'promise-props-recursive'

export default (pkgs, {asRange}) =>
  promiseProps(
    pkgs.reduce((versions, pkg) => {
      versions[pkg] = latestVersion(pkg).then(asRange ? caretify : identity)
      return versions
    }, {})
  )

function caretify(version) {
  return `^${version}`
}

function identity(version) {
  return version
}
