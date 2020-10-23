import fs from 'fs'
import path from 'path'
import registerBabel from '@babel/register'

function getConfig() {
  try {
    // eslint-disable-next-line no-sync
    const content = fs.readFileSync(path.join(process.cwd(), '.babelrc'))
    return JSON.parse(content)
  } catch (err) {
    return {
      presets: [
        require.resolve('@babel/preset-typescript'),
        require.resolve('@babel/preset-react'),
        [
          require.resolve('@babel/preset-env'),
          {
            targets: {
              node: 'current',
            },
          },
        ],
      ],
      plugins: [require.resolve('@babel/plugin-proposal-class-properties')],
      extensions: ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts', '.tsx'],
    }
  }
}

registerBabel(getConfig())
