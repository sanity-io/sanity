import {
  type CreateDocumentVersionEvent,
  type CreateLiveDocumentEvent,
  type DeleteDocumentGroupEvent,
  type DeleteDocumentVersionEvent,
  type EditDocumentVersionEvent,
  type HistoryClearedEvent,
  type PublishDocumentVersionEvent,
  type ScheduleDocumentVersionEvent,
  type UnpublishDocumentEvent,
  type UnscheduleDocumentVersionEvent,
  type UpdateLiveDocumentEvent,
} from '../types'

/**
 * Deterministic base timestamp shared by all fixtures. Use {@link minutesAfterBase} to derive
 * timestamps relative to it (useful for merge-window tests, which use a 5 minute window).
 */
export const BASE_TIME = '2024-01-01T00:00:00.000Z'

export function minutesAfterBase(minutes: number, time: string = BASE_TIME): string {
  return new Date(Date.parse(time) + minutes * 60_000).toISOString()
}

export const DOCUMENT_ID = 'doc-1'
export const DRAFT_ID = `drafts.${DOCUMENT_ID}`
const RELEASE_ID = 'rSomeRelease'
export const VERSION_ID = `versions.${RELEASE_ID}.${DOCUMENT_ID}`

export function createDocumentVersionEvent(
  overrides: Partial<CreateDocumentVersionEvent> = {},
): CreateDocumentVersionEvent {
  return {
    type: 'createDocumentVersion',
    id: 'tx-create',
    timestamp: BASE_TIME,
    author: 'author-1',
    documentVariantType: 'draft',
    documentId: DOCUMENT_ID,
    versionId: DRAFT_ID,
    versionRevisionId: 'tx-create',
    ...overrides,
  }
}

export function deleteDocumentVersionEvent(
  overrides: Partial<DeleteDocumentVersionEvent> = {},
): DeleteDocumentVersionEvent {
  return {
    type: 'deleteDocumentVersion',
    id: 'tx-delete-version',
    timestamp: minutesAfterBase(10),
    author: 'author-1',
    documentVariantType: 'draft',
    documentId: DOCUMENT_ID,
    versionId: DRAFT_ID,
    versionRevisionId: 'tx-delete-version',
    ...overrides,
  }
}

export function publishDocumentVersionEvent(
  overrides: Partial<PublishDocumentVersionEvent> = {},
): PublishDocumentVersionEvent {
  return {
    type: 'publishDocumentVersion',
    id: 'tx-publish',
    timestamp: minutesAfterBase(20),
    author: 'author-1',
    documentVariantType: 'published',
    documentId: DOCUMENT_ID,
    revisionId: 'tx-publish',
    versionId: DRAFT_ID,
    versionRevisionId: 'tx-before-publish',
    publishCause: 'document.publish',
    ...overrides,
  }
}

export function unpublishDocumentEvent(
  overrides: Partial<UnpublishDocumentEvent> = {},
): UnpublishDocumentEvent {
  return {
    type: 'unpublishDocument',
    id: 'tx-unpublish',
    timestamp: minutesAfterBase(30),
    author: 'author-1',
    documentVariantType: 'published',
    documentId: DOCUMENT_ID,
    versionId: DRAFT_ID,
    versionRevisionId: 'tx-unpublish',
    ...overrides,
  }
}

export function scheduleDocumentVersionEvent(
  overrides: Partial<ScheduleDocumentVersionEvent> = {},
): ScheduleDocumentVersionEvent {
  return {
    type: 'scheduleDocumentVersion',
    id: 'tx-schedule',
    timestamp: minutesAfterBase(40),
    author: 'author-1',
    documentVariantType: 'version',
    documentId: DOCUMENT_ID,
    releaseId: RELEASE_ID,
    versionId: VERSION_ID,
    versionRevisionId: 'tx-schedule',
    state: 'pending',
    publishAt: minutesAfterBase(60),
    ...overrides,
  }
}

export function unscheduleDocumentVersionEvent(
  overrides: Partial<UnscheduleDocumentVersionEvent> = {},
): UnscheduleDocumentVersionEvent {
  return {
    type: 'unscheduleDocumentVersion',
    id: 'tx-unschedule',
    timestamp: minutesAfterBase(50),
    author: 'author-1',
    documentVariantType: 'version',
    documentId: DOCUMENT_ID,
    releaseId: RELEASE_ID,
    versionId: VERSION_ID,
    versionRevisionId: 'tx-unschedule',
    ...overrides,
  }
}

export function deleteDocumentGroupEvent(
  overrides: Partial<DeleteDocumentGroupEvent> = {},
): DeleteDocumentGroupEvent {
  return {
    type: 'deleteDocumentGroup',
    id: 'tx-delete-group',
    timestamp: minutesAfterBase(60),
    author: 'author-1',
    documentVariantType: 'published',
    documentId: DOCUMENT_ID,
    ...overrides,
  }
}

export function createLiveDocumentEvent(
  overrides: Partial<CreateLiveDocumentEvent> = {},
): CreateLiveDocumentEvent {
  return {
    type: 'createLiveDocument',
    id: 'tx-create-live',
    timestamp: BASE_TIME,
    author: 'author-1',
    documentVariantType: 'published',
    documentId: DOCUMENT_ID,
    revisionId: 'tx-create-live',
    ...overrides,
  }
}

export function updateLiveDocumentEvent(
  overrides: Partial<UpdateLiveDocumentEvent> = {},
): UpdateLiveDocumentEvent {
  return {
    type: 'updateLiveDocument',
    id: 'tx-update-live',
    timestamp: minutesAfterBase(10),
    author: 'author-1',
    documentVariantType: 'published',
    documentId: DOCUMENT_ID,
    revisionId: 'tx-update-live',
    ...overrides,
  }
}

export function editDocumentVersionEvent(
  overrides: Partial<EditDocumentVersionEvent> = {},
): EditDocumentVersionEvent {
  const revisionId = overrides.revisionId ?? 'tx-edit'
  return {
    type: 'editDocumentVersion',
    id: revisionId,
    timestamp: minutesAfterBase(5),
    author: 'author-1',
    documentVariantType: 'draft',
    documentId: DOCUMENT_ID,
    contributors: ['author-1'],
    revisionId,
    transactions: [
      {
        type: 'editTransaction',
        author: 'author-1',
        timestamp: minutesAfterBase(5),
        revisionId,
      },
    ],
    ...overrides,
  }
}
