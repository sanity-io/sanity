import {defineEvent} from '@sanity/telemetry'

export const PortableTextInputExpanded = defineEvent({
  version: 1,
  name: 'Portable Text Editor expanded',
  description: 'The portable text editor was expanded',
})

export const PortableTextInputCollapsed = defineEvent({
  version: 1,
  name: 'Portable Text Editor collapsed',
  description: 'The portable text editor was collapsed',
})

interface ErrorInfo {
  message: string
  location?: string
  error?: Error
  stack?: string
  payload?: unknown
}
export const PortableTextEditorError = defineEvent<ErrorInfo>({
  version: 1,
  name: 'Portable Text Editor form error',
  description: 'The portable text editor encountered an error',
})
