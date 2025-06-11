import {type Schedule} from '../types'
import {getLastExecuteDate} from './scheduleUtils'

export function sortByExecuteDate({reverseOrder}: {reverseOrder: boolean} = {reverseOrder: false}) {
  return function (a: Schedule, b: Schedule): number {
    const aExecuteDate = getLastExecuteDate(a)
    const bExecuteDate = getLastExecuteDate(b)

    if (aExecuteDate === bExecuteDate) {
      return 0
    }
    if (aExecuteDate === null) {
      return 1
    }
    if (bExecuteDate === null) {
      return -1
    }
    return (aExecuteDate > bExecuteDate ? 1 : -1) * (reverseOrder ? -1 : 1)
  }
}
