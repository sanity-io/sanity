export function createAction(action) {
  return props => {
    const {children, ...rest} = props
    const actionState = action(rest)
    return actionState ? children(actionState) : null
  }
}
