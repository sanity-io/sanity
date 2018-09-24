import {of as observableOf} from 'rxjs'

const DB = Object.create(null)

const get = (key, defValue) => observableOf(key in DB ? DB[key] : defValue)

const set = (key, nextValue) => {
  if (typeof nextValue === 'undefined' || nextValue === null) {
    delete DB[key]
  } else {
    DB[key] = nextValue
  }
  return observableOf(nextValue)
}

export default {get, set}
