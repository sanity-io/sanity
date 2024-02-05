import {defineEvent} from '@sanity/telemetry'

interface ErrorLoggerEvent {
  stack: string
  message: string
}
export const ErrorLoggerCatch = defineEvent<ErrorLoggerEvent>({
  version: 1,
  name: 'ErrorLogger catch',
  description: 'An error was detected by the error logger',
})
