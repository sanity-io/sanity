import {type DecorationMember} from 'sanity'

import {IncomingReferencesDecoration} from './IncomingReferencesDecoration'
import {type IncomingReferencesOptions} from './types'

/**
 * Helper function to define an incoming references decoration.
 *
 * example:
 * ```ts
 * defineType({
 *   name: 'author',
 *   type: 'document',
 *   renderMembers: (members) => {
 *    return [
 *      ...members,
 *      defineIncomingReferenceDecoration({
 *        name: 'incomingReferences',
 *        title: 'Incoming references',
 *        types: [{type: 'author'}],
 *      }),
 *    ]
 *   },
 * })
 * ```
 *
 * @beta
 */
export function defineIncomingReferenceDecoration(
  options: IncomingReferencesOptions,
): DecorationMember {
  return {
    kind: 'decoration',
    key: options.name,
    component: <IncomingReferencesDecoration {...options} />,
  }
}
