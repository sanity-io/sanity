import path from 'path'
import fse from 'fs-extra'
import {partialRight} from 'lodash'
import promiseProps from 'promise-props-recursive'
import {createSanityManifest, createPluginManifest} from './createManifest'

export default function bootstrapPlugin(data, opts = {}) {
  const writeIfNotExists = partialRight(writeFileIfNotExists, opts.output)
  const collect = {
    pluginConfig: readTemplate('plugin-config'),
    gitIgnore: readTemplate('gitignore'),
    manifest: createPluginManifest(data, opts),
    readme: `# ${data.name}\n\n${data.description}\n`,
    sanity: createSanityManifest(data, {
      isPlugin: true,
      serialize: true
    })
  }

  const targetPath = data.outputPath

  return fse
    .ensureDir(targetPath)
    .then(() => promiseProps(collect))
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

      return Promise.all(writeOps)
    })
}

function readTemplate(file) {
  return fse.readFile(path.join(__dirname, 'templates', file))
}

function writeFileIfNotExists(filePath, content, output) {
  return fse.writeFile(filePath, content, {flag: 'wx'}).catch(err => {
    if (err.code === 'EEXIST') {
      output.print(`[WARN] File "${filePath}" already exists, skipping`)
    } else {
      throw err
    }
  })
}
