// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import type {SanityClient} from '@sanity/client'
import sanityClient from 'part:@sanity/base/client'

/**
 * Only for use inside of @sanity/field
 * Don't import this from external modules.
 *
 * @internal
 */
export const versionedClient = sanityClient.withConfig({
  apiVersion: '1',
}) as SanityClient
