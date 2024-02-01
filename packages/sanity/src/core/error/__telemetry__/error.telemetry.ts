import {defineEvent} from '@sanity/telemetry'

interface ErrorLoggerEvent {
  error: Error
  stack: string
}
export const ErrorLoggerCatch = defineEvent<ErrorLoggerEvent>({
  version: 1,
  name: 'ErrorLogger catch',
  description: 'An error was detected by the error logger',
})
