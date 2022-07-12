/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {Subject} from 'rxjs'

// can use these if emitting events is ever needed
export const _heartbeatsSubject = new Subject()
export const _requestsSubject = new Subject()

const mockBifurClient = {
  heartbeats: _heartbeatsSubject,
  request: () => _requestsSubject,
}

export function fromSanityClient() {
  return mockBifurClient
}

export function fromUrl() {
  return mockBifurClient
}
