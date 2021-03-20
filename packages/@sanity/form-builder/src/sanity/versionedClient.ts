import type {SanityClient} from '@sanity/client'
import {client} from '../legacyParts'

/**
 * Only for use inside of @sanity/form-builder
 * Don't import this from external modules.
 *
 * @internal
 */
export const versionedClient = client.withConfig({apiVersion: '1'}) as SanityClient
