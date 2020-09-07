import at from 'circular-at'
import {range} from 'lodash'

const POOL_SIZE = 50
const pool = range(POOL_SIZE).map(createItemStyles)

function createItemStyles() {
  return {
    date: {width: `${Math.random() * 10 + 15}%`},
    title: {width: `${Math.random() * 80 + 15}%`},
    subtitle: {width: `${Math.random() * 80 + 15}%`},
    description: {width: `${Math.random() * 80 + 15}%`}
  }
}

export default function getPlaceholderItemStyles(index) {
  return at(pool, index)
}
