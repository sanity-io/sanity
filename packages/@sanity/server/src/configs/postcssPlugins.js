import lost from 'lost'
import postcssUrl from 'postcss-url'
import postcssImport from 'postcss-import'
import postcssCssnext from 'postcss-cssnext'
import resolveStyleImport from '../util/resolveStyleImport'

export default options => {
  const styleResolver = resolveStyleImport({
    from: options.basePath
  })

  return wp => {
    const importer = postcssImport({
      addDependencyTo: wp,
      resolve: styleResolver
    })

    return [
      importer,
      postcssCssnext,
      postcssUrl({url: 'rebase'}),
      lost
    ]
  }
}
