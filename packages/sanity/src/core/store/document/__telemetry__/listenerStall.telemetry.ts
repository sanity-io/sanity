import {defineEvent} from '@sanity/telemetry'

import {type ListenerStallDetails} from '../utils/watchForListenerStall'

export const DocumentListenerStalled = defineEvent<ListenerStallDetails>({
  name: 'Document Listener Stalled',
  version: 1,
  description:
    'Occurs when saved changes are not echoed back by the document pair listener within 30 seconds while connected, and the listener is restarted.',
})
