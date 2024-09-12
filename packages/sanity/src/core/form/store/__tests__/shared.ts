// eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
const noop = () => {}

export const MOCK_USER = {id: 'bjoerge', email: 'bjoerge@gmail.com', name: 'Bjørge', roles: []}
export const DEFAULT_PROPS = {
  validation: [],
  presence: [],
  focusPath: [],
  path: [],
  currentUser: MOCK_USER,
  openPath: [],
  onSetCollapsedField: noop,
  onSetCollapsedFieldSet: noop,
  onSetActiveFieldGroupAtPath: noop,
  onChange: noop,
  onBlur: noop,
  onFocus: noop,
  level: 0,
}
