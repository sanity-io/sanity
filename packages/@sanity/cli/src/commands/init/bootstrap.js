import fs from 'fs'
import path from 'path'
import thenify from 'thenify'
import promiseProps from 'promise-props-recursive'
import {
  createPackageManifest,
  createSanityManifest,
  createPluginManifest
} from './createManifest'

const readFile = thenify(fs.readFile)

export function bootstrapSanity(targetPath, data) {
  return Promise.all([
    mkdirIfNotExists(path.join(targetPath, 'config')),
    mkdirIfNotExists(path.join(targetPath, 'plugins')),
    mkdirIfNotExists(path.join(targetPath, 'static')),
    mkdirIfNotExists(path.join(targetPath, 'schemas'))
  ])
  .then(() => promiseProps({
    pluginGitKeep: readTemplate('pluginGitKeep'),
    staticGitKeep: readTemplate('staticGitKeep'),
    gitIgnore: readTemplate('gitignore'),
    checksums: readTemplate('checksums'),
    schema: readTemplate('schema'),
    manifest: createPackageManifest(data),
    sanity: createSanityManifest(data, {}),
    readme: `# ${data.name}\n\n${data.description}\n`
  }))
  .then(templates => Promise.all([
    writeIfNotExists(path.join(targetPath, 'plugins', '.gitkeep'), templates.pluginGitKeep),
    writeIfNotExists(path.join(targetPath, 'static', '.gitkeep'), templates.staticGitKeep),
    writeIfNotExists(path.join(targetPath, 'config', '.checksums'), templates.checksums),
    writeIfNotExists(path.join(targetPath, 'schemas', 'schema.js'), templates.schema),
    writeIfNotExists(path.join(targetPath, '.gitignore'), templates.gitIgnore),
    writeIfNotExists(path.join(targetPath, 'package.json'), templates.manifest),
    writeIfNotExists(path.join(targetPath, 'sanity.json'), templates.sanity),
    writeIfNotExists(path.join(targetPath, 'README.md'), templates.readme)
  ]))
}

export function bootstrapPlugin(targetPath, data, opts = {}) {
  const collect = {
    pluginConfig: readTemplate('plugin-config'),
    gitIgnore: readTemplate('gitignore'),
    manifest: createPluginManifest(data, opts),
    readme: `# ${data.name}\n\n${data.description}\n`,
    sanity: createSanityManifest(data, {
      isPlugin: true,
      isSanityStyle: opts.sanityStyle
    })
  }

  const styleMetaFiles = ['babelrc', 'editorconfig', 'eslintignore', 'eslintrc', 'npmignore']
  if (opts.sanityStyle) {
    styleMetaFiles.forEach(file => {
      collect[file] = readTemplate(path.join('sanity-style', file))
    })
  }

  return promiseProps(collect).then(templates => {
    if (!data.createConfig) {
      return templates
    }

    const confPath = path.join(targetPath, 'config.dist.json')
    return writeIfNotExists(confPath, templates.pluginConfig).then(() => templates)
  }).then(templates => {
    const writeOps = [
      writeIfNotExists(path.join(targetPath, '.gitignore'), templates.gitIgnore),
      writeIfNotExists(path.join(targetPath, 'package.json'), templates.manifest),
      writeIfNotExists(path.join(targetPath, 'sanity.json'), templates.sanity),
      writeIfNotExists(path.join(targetPath, 'README.md'), templates.readme)
    ]

    if (opts.sanityStyle) {
      styleMetaFiles.forEach(file =>
        writeOps.push(writeIfNotExists(
          path.join(targetPath, `.${file}`),
          templates[file]
        ))
      )
    }

    return Promise.all(writeOps)
  }).then(() => {
    if (!opts.sanityStyle) {
      return
    }

    mkdirIfNotExists(path.join(targetPath, 'src')).then(() =>
      writeIfNotExists(
        path.join(targetPath, 'src', 'myComponent.js'),
        "import React from 'react'\n\n"
        + 'export default function myComponent() {\n'
        + '  return <div />\n'
        + '}\n'
      )
    )
  })
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
