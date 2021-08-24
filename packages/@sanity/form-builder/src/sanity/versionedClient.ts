import type {SanityClient} from '@sanity/client'
import {client} from '../legacyParts'

/**
 * Only for use inside of @sanity/form-builder
 * Don't import this from external modules.
 *
 * @internal
 */
export const versionedClient = client.withConfig({apiVersion: '1'}) as SanityClient

/**
 * Only for use inside of @sanity/form-builder
 * Don't import this from external modules.
 *
 * @internal
 */
// Use >= 2021-03-25 for pt::text() support
export const searchClient = client.withConfig({apiVersion: '2021-03-25'}) as SanityClient
