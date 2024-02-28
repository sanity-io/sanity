import {join} from 'node:path'

import register from '@babel/register'

const babelOptions = {
  extends: join(__dirname, '..', '..', 'babel.config.json'),
}

export function registerBabel(): void {
  register({...babelOptions, extensions: ['.ts', '.tsx', '.js', '.jsx']})
}
