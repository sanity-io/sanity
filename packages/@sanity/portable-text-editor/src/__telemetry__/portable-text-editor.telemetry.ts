import {defineEvent} from '@sanity/telemetry'

interface ErrorInfo {
  fnName: string
  error: Error
  args?: unknown
}
export const PortableTextEditorError = defineEvent<ErrorInfo>({
  version: 1,
  name: 'Portable Text Editor error',
  description: 'The portable text editor encountered an error',
})
