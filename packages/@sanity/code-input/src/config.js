// Todo: should be made configurable from outside

export const SUPPORTED_LANGUAGES = [
  {title: 'JSX', value: 'jsx'},
  {title: 'JavaScript', value: 'javascript'},
  {title: 'JSON', value: 'json'},
  {title: 'Markdown', value: 'markdown'},
  {title: 'CSS', value: 'css'},
  {title: 'HTML', value: 'html'},
  {title: 'text', value: 'text'}
]

export const ACE_SET_OPTIONS = {
  useSoftTabs: true,
  navigateWithinSoftTabs: true /* note only supported by ace v1.2.7 or higher */
}

export const ACE_EDITOR_PROPS = {$blockScrolling: true}
