import fs from 'fs'
import path from 'path'
import thenify from 'thenify'
import {createPackageManifest, createSanityManifest} from './createManifest'
import promiseProps from 'promise-props-recursive'

const readFile = thenify(fs.readFile)

function bootstrap(targetPath, data) {
  return Promise.all([
    mkdirIfNotExists(path.join(targetPath, 'config')),
    mkdirIfNotExists(path.join(targetPath, 'plugins'))
  ])
  .then(() => promiseProps({
    pluginGitKeep: readTemplate('pluginGitKeep'),
    gitIgnore: readTemplate('gitignore'),
    checksums: readTemplate('checksums'),
    schema: readTemplate('schema'),
    manifest: createPackageManifest(data),
    sanity: createSanityManifest(data),
    readme: `# ${data.name}\n\n${data.description}\n`
  }))
  .then(templates => Promise.all([
    writeIfNotExists(path.join(targetPath, 'plugins', '.gitkeep'), templates.pluginGitKeep),
    writeIfNotExists(path.join(targetPath, 'config', '.checksums'), templates.checksums),
    writeIfNotExists(path.join(targetPath, '.gitignore'), templates.gitIgnore),
    writeIfNotExists(path.join(targetPath, 'schema.js'), templates.schema),
    writeIfNotExists(path.join(targetPath, 'package.json'), templates.manifest),
    writeIfNotExists(path.join(targetPath, 'sanity.json'), templates.sanity),
    writeIfNotExists(path.join(targetPath, 'README.md'), templates.readme)
  ]))
}

function readTemplate(file) {
  return readFile(path.join(__dirname, 'templates', file))
}

function writeIfNotExists(filePath, content) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, err => {
      if (err && err.code !== 'ENOENT') {
        return reject(err)
      } else if (!err) {
        return resolve()
      }

      fs.writeFile(filePath, content, writeErr => {
        if (writeErr) {
          return reject(writeErr)
        }

        resolve()
      })
    })
  })
}

function mkdirIfNotExists(dir) {
  return new Promise((resolve, reject) => {
    fs.stat(dir, err => {
      if (err && err.code !== 'ENOENT') {
        return reject(err)
      } else if (!err) {
        return resolve()
      }

      fs.mkdir(dir, writeErr => {
        if (writeErr) {
          return reject(writeErr)
        }

        return resolve()
      })
    })
  })
}

export default bootstrap
