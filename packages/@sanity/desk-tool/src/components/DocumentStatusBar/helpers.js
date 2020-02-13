export function getNextFocusableMenuItemIdx(actions, currentIdx) {
  const restActions = actions.slice(1)
  const actionsLength = restActions.length
  const focusableLength = restActions.filter(action => !action.disabled).length
  if (!focusableLength === 0) return -1
  let idx = currentIdx + 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (idx >= actionsLength) {
      idx = -1
    } else if (restActions[idx] && !restActions[idx].disabled) {
      return idx
    }
    idx += 1
  }
}

export function getPreviousFocusableMenuItemIdx(actions, currentIdx) {
  const restActions = actions.slice(1)
  const actionsLength = restActions.length
  const focusableLength = restActions.filter(action => !action.disabled).length
  if (!focusableLength === 0) return -1
  let idx = currentIdx - 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (idx < 0) {
      idx = actionsLength
    } else if (restActions[idx] && !restActions[idx].disabled) {
      return idx
    }
    idx -= 1
  }
}
