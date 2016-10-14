import postcssImport from 'postcss-import'
import postcssCssnext from 'postcss-cssnext'
import resolveStyleImport from '../util/resolveStyleImport'

export default wp => {
  const importer = postcssImport({
    addDependencyTo: wp,
    resolve: resolveStyleImport
  })

  return [
    importer,
    postcssCssnext
  ]
}
