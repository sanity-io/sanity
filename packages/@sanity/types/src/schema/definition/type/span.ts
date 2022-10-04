import {BaseSchemaDefinition} from './common'
import {StringOptions} from './string'

// exists only to allow fo extensions. span is not really a user-land type, so probably unused though
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SpanOptions extends StringOptions {}

export interface SpanDefinition extends BaseSchemaDefinition {
  type: 'span'
  options?: SpanOptions
}
