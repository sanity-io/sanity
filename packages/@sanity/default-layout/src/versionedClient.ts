// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import type {SanityClient} from '@sanity/client'
import client from 'part:@sanity/base/client'

/**
 * Only for use inside of @sanity/default-layout
 * Don't import this from external modules.
 *
 * @internal
 */
export const versionedClient = client.withConfig({apiVersion: '1'}) as SanityClient
