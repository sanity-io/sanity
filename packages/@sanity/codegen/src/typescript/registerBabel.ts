import {type TransformOptions} from '@babel/core'
import register from '@babel/register'
import {type NodePath} from '@babel/traverse'
import {type ImportDeclaration} from '@babel/types'

import {getBabelConfig} from '../getBabelConfig'

/**
 * A simple Babel plugin to ignore CSS and other style imports
 * This prevents errors when Babel tries to process non-JavaScript imports
 */
function ignoreStyleImportsPlugin(): {
  visitor: {ImportDeclaration: (path: NodePath<ImportDeclaration>) => void}
} {
  return {
    visitor: {
      ImportDeclaration(path: NodePath<ImportDeclaration>) {
        const source = path.node.source.value
        // Ignore imports of CSS, SCSS, SASS, and LESS files
        if (/\.(css|scss|sass|less)$/.test(source)) {
          path.remove()
        }
      },
    },
  }
}

/**
 * Register Babel with the given options
 *
 * @param babelOptions - The options to use when registering Babel
 * @beta
 */
export function registerBabel(babelOptions?: TransformOptions): void {
  const options = babelOptions || getBabelConfig()

  register({
    ...options,
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
    plugins: [...(options.plugins || []), ignoreStyleImportsPlugin()],
  })
}
