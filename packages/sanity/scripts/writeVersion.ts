/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-sync */

import fs from 'fs'
import path from 'path'
import globby from 'globby'
import {version} from '../package.json'

globby([path.join(__dirname, '../lib/**/*.cjs'), path.join(__dirname, '../lib/**/*.js')]).then(
  (files) => {
    for (const file of files) {
      const buf = fs.readFileSync(file, 'utf8')
      fs.writeFileSync(
        file,
        buf.toString().replace(/"0\.0\.0-development"/g, `"${version}"`),
        'utf8'
      )
    }
  }
)
