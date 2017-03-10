import path from 'path'
import lost from 'lost'
import postcssUrl from 'postcss-url'
import postcssImport from 'postcss-import'
import postcssCssnext from 'postcss-cssnext'
import resolveStyleImport from '../util/resolveStyleImport'

const absolute = /^(\/|\w+:\/\/)/
const isAbsolute = url => absolute.test(url)

export default options => {
  const styleResolver = resolveStyleImport({from: options.basePath})
  const importer = postcssImport({resolve: styleResolver})

  const resolveUrl = (url, decl, from, dirname) => (
    isAbsolute(url) ? url : path.resolve(dirname, url)
  )

  return wp => {
    return [
      importer,
      postcssCssnext,
      postcssUrl({url: resolveUrl}),
      lost
    ]
  }
}
