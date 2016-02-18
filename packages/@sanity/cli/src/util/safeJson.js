import {readFileSync} from 'fs'

export function loadJson(file, defaultVal) {
  try {
    return parseJson(readFileSync(file, {encoding: 'utf8'}), defaultVal)
  } catch (err) {
    return defaultVal
  }
}

export function parseJson(json, defaultVal) {
  try {
    return JSON.parse(json)
  } catch (err) {
    return defaultVal
  }
}
