import {
  ENGINE_CONFIDENCE_RUN_TYPE,
  ENGINE_CONFIDENCE_SCHEMA_VERSION,
  type EngineConfidenceRunDocument,
  isoWeekOf,
} from '@repo/utils/engine-confidence'
import {engineConfidenceRunId} from '@repo/utils/radar-ids'

/** Problems that would make Radar misfile or misread the document; empty when it is storable. */
export function runDocumentProblems(document: Partial<EngineConfidenceRunDocument>): string[] {
  const startedAt = document.startedAt === undefined ? Number.NaN : Date.parse(document.startedAt)
  const expectedWeek = Number.isNaN(startedAt) ? undefined : isoWeekOf(new Date(startedAt))
  return [
    ...(document._type === ENGINE_CONFIDENCE_RUN_TYPE
      ? []
      : [`_type must be ${ENGINE_CONFIDENCE_RUN_TYPE}, got ${String(document._type)}`]),
    ...(document.schemaVersion === ENGINE_CONFIDENCE_SCHEMA_VERSION
      ? []
      : [`schemaVersion must be ${ENGINE_CONFIDENCE_SCHEMA_VERSION}`]),
    ...(expectedWeek === undefined ? ['startedAt must be an ISO timestamp'] : []),
    ...(expectedWeek === undefined || document.isoWeek === expectedWeek
      ? []
      : [`isoWeek must be ${expectedWeek} for startedAt ${document.startedAt}`]),
    ...(document.isoWeek !== undefined && document._id !== engineConfidenceRunId(document.isoWeek)
      ? [`_id must be ${engineConfidenceRunId(document.isoWeek)}, got ${String(document._id)}`]
      : []),
  ]
}
