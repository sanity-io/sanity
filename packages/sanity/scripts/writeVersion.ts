/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-sync */

import fs from 'fs'
import path from 'path'
import globby from 'globby'
import {version} from '../package.json'

globby([
  path.resolve(__dirname, '../lib/**/*.js'),
  path.resolve(__dirname, '../lib/**/*.mjs'),
]).then((files) => {
  for (const file of files) {
    const buf = fs.readFileSync(file, 'utf8')
    fs.writeFileSync(
      file,
      buf.toString().replace('SANITY_VERSION="0.0.0-development"', `SANITY_VERSION="${version}"`),
      'utf8',
    )
  }
})
