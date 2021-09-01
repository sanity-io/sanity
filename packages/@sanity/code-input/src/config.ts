import {CodeInputLanguage} from './types'

// NOTE: MAKE SURE THESE ALIGN WITH IMPORTS IN ./editorSupport
export const SUPPORTED_LANGUAGES: CodeInputLanguage[] = [
  {title: 'Batch file', value: 'batchfile'},
  {title: 'C#', value: 'csharp'},
  {title: 'CSS', value: 'css'},
  {title: 'Go', value: 'golang'},
  {title: 'GROQ', value: 'groq'},
  {title: 'HTML', value: 'html'},
  {title: 'Java', value: 'java'},
  {title: 'JavaScript', value: 'javascript'},
  {title: 'JSON', value: 'json'},
  {title: 'JSX', value: 'jsx'},
  {title: 'Markdown', value: 'markdown'},
  {title: 'MySQL', value: 'mysql'},
  {title: 'PHP', value: 'php'},
  {title: 'Plain text', value: 'text'},
  {title: 'Python', value: 'python'},
  {title: 'Ruby', value: 'ruby'},
  {title: 'SASS', value: 'sass'},
  {title: 'SCSS', value: 'scss'},
  {title: 'sh', value: 'sh'},
  {title: 'TSX', value: 'tsx'},
  {title: 'TypeScript', value: 'typescript'},
  {title: 'XML', value: 'xml'},
  {title: 'YAML', value: 'yaml'},
]

export const LANGUAGE_ALIASES: Record<string, string | undefined> = {js: 'javascript'}

export const SUPPORTED_THEMES = ['github', 'monokai', 'terminal', 'tomorrow']

export const DEFAULT_THEME = 'tomorrow'

export const ACE_SET_OPTIONS = {
  useSoftTabs: true,
  navigateWithinSoftTabs: true /* note only supported by ace v1.2.7 or higher */,
}

export const ACE_EDITOR_PROPS = {$blockScrolling: true}

export const PATH_LANGUAGE = ['language']
export const PATH_CODE = ['code']
export const PATH_FILENAME = ['filename']
