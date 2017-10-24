//@flow
import generateHelpUrl from '@sanity/generate-help-url'

export function createHelpfulError(message: string, slug: string) {
  return new Error(`${message}. For more info see ${generateHelpUrl(slug)}`)
}
