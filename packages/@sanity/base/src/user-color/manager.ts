import {UserColorHue, UserColorManager} from './types'

const colors: UserColorHue[] = [
  'blue',
  'cyan',
  // 'green',
  'yellow',
  'orange',
  // 'red',
  'magenta',
  'purple'
]

export function createUserColorManager(): UserColorManager {
  let state: {users: string[]} = {
    users: []
  }

  return {get}

  function get(userId: string) {
    if (!state.users.includes(userId)) {
      state = {
        users: state.users.concat([userId])
      }
    }

    const idx = state.users.indexOf(userId)

    return colors[idx % colors.length]
  }
}
