/* eslint-disable no-sync */
const fs = require('fs')
const path = require('path')
const {version} = require('./package.json')

const cjsPath = path.join(__dirname, 'lib', 'cjs', 'version.js')
const cjsOutput = `
Object.defineProperty(exports, '__esModule', {value: true})
exports.SANITY_VERSION = ${JSON.stringify(version)};
`
fs.writeFileSync(cjsPath, cjsOutput, 'utf8')

const esmPath = path.join(__dirname, 'lib', 'esm', 'version.js')
const esmOutput = `
export const SANITY_VERSION = ${JSON.stringify(version)};
`
fs.writeFileSync(esmPath, esmOutput, 'utf8')
