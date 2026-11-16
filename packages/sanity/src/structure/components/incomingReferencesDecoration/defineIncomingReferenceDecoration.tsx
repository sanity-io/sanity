import {type ComponentProps} from 'react'
import {type DecorationMember} from 'sanity'

import {createLazyComponent} from '../../../core/components/lazy/createLazyComponent'
import {type IncomingReferencesDecoration as IncomingReferencesDecorationImplementation} from './IncomingReferencesDecoration'
import {type IncomingReferencesOptions} from './types'

// Schemas call this helper at config time, so it is part of the static import graph of
// `sanity/structure` while the decoration itself only renders inside a document form. It has no
// boundary of its own and suspends to the one `FormBuilder` has around the form.
const IncomingReferencesDecoration = createLazyComponent<
  ComponentProps<typeof IncomingReferencesDecorationImplementation>
>(() => import('./IncomingReferencesDecoration.lazy'))

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
