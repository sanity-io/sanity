export const SUPPORTED_LANGUAGES = [
  {title: 'Batch file', value: 'batchfile'},
  {title: 'CSS', value: 'css'},
  {title: 'SASS', value: 'sass'},
  {title: 'SCSS', value: 'scss'},
  {title: 'HTML', value: 'html'},
  {title: 'JavaScript', value: 'javascript'},
  {title: 'JSON', value: 'json'},
  {title: 'JSX', value: 'jsx'},
  {title: 'Markdown', value: 'markdown'},
  {title: 'PHP', value: 'php'},
  {title: 'Python', value: 'python'},
  {title: 'sh', value: 'sh'},
  {title: 'Plain text', value: 'text'}
]

export const LANGUAGE_ALIASES = {js: 'javascript'}

export const SUPPORTED_THEMES = ['github', 'monokai', 'terminal', 'tomorrow']

export const DEFAULT_THEME = 'tomorrow'

export const ACE_SET_OPTIONS = {
  useSoftTabs: true,
  navigateWithinSoftTabs: true /* note only supported by ace v1.2.7 or higher */
}

export const ACE_EDITOR_PROPS = {$blockScrolling: true}
