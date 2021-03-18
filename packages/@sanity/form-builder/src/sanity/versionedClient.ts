import {client} from '../legacyParts'

export const versionedClient = client.withConfig({apiVersion: '1'})
