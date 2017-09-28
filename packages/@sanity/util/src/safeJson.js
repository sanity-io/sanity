import fse from 'fs-extra'

export function loadJsonSync(file, defaultVal) {
  // eslint-disable-next-line no-sync
  return fse.readJsonSync(file, {throws: false}) || defaultVal
}

export function loadJson(file, defaultVal) {
  return fse.readJson(file).catch(() => defaultVal)
}

export function parseJson(json, defaultVal) {
  try {
    return JSON.parse(json)
  } catch (err) {
    return defaultVal
  }
}
