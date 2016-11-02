import fsp from 'fs-promise'

export function loadJsonSync(file, defaultVal) {
  return fsp.readJsonSync(file, {throws: false}) || defaultVal
}

export async function loadJson(file, defaultVal) {
  return fsp.readJson(file).catch(() => defaultVal)
}

export function parseJson(json, defaultVal) {
  try {
    return JSON.parse(json)
  } catch (err) {
    return defaultVal
  }
}
