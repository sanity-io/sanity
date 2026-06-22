import {lazy, Suspense} from 'react'
import {type DecorationMember} from 'sanity'

import {type IncomingReferencesOptions} from './types'

// Deferred so the decoration's form-input module graph stays out of the eager structure barrel; it renders inside the document form, which has no guaranteed local Suspense boundary.
const IncomingReferencesDecoration = lazy(() =>
  import('./IncomingReferencesDecoration').then((module) => ({
    default: module.IncomingReferencesDecoration,
  })),
)

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
    component: (
      <Suspense fallback={null}>
        <IncomingReferencesDecoration {...options} />
      </Suspense>
    ),
  }
}
