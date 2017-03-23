import path from 'path'
import fsp from 'fs-promise'
import {partialRight} from 'lodash'
import promiseProps from 'promise-props-recursive'
import {
  createSanityManifest,
  createPluginManifest
} from './createManifest'

export function bootstrapPlugin(data, opts = {}) {
  const writeIfNotExists = partialRight(writeFileIfNotExists, opts.output)
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

  const targetPath = data.outputPath
  const styleMetaFiles = ['babelrc', 'editorconfig', 'eslintignore', 'eslintrc', 'npmignore', 'gitignore']

  if (opts.sanityStyle) {
    styleMetaFiles.forEach(file => {
      collect[file] = readTemplate(path.join('sanity-style', file))
    })
  }

  return fsp.ensureDir(targetPath).then(() => promiseProps(collect))
    .then(templates => {
      if (!data.createConfig) {
        return templates
      }

      const confPath = path.join(targetPath, 'config.dist.json')
      return writeIfNotExists(confPath, templates.pluginConfig).then(() => templates)
    })
    .then(templates => {
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
    })
    .then(() => {
      if (!opts.sanityStyle) {
        return
      }

      fsp.ensureDir(path.join(targetPath, 'src')).then(() =>
        writeIfNotExists(
          path.join(targetPath, 'src', 'MyComponent.js'),
          "import React from 'react'\n\n"
          + 'export default function MyComponent() {\n'
          + '  return <div />\n'
          + '}\n'
        )
      )
    })
}

function readTemplate(file) {
  return fsp.readFile(path.join(__dirname, 'templates', file))
}

function writeFileIfNotExists(filePath, content, output) {
  return fsp.writeFile(filePath, content, {flag: 'wx'})
    .catch(err => {
      if (err.code === 'EEXIST') {
        output.print(`[WARN] File "${filePath}" already exists, skipping`)
      } else {
        throw err
      }
    })
}
