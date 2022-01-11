import fse from 'fs-extra'

export function loadJsonSync(file: string, defaultVal?: any) {
  // eslint-disable-next-line no-sync
  return fse.readJsonSync(file, {throws: false}) || defaultVal
}

export function loadJson(file: string, defaultVal: any) {
  return fse.readJson(file).catch(() => defaultVal)
}

export function parseJson(json: string, defaultVal: any) {
  try {
    return JSON.parse(json)
  } catch (err) {
    return defaultVal
  }
}
