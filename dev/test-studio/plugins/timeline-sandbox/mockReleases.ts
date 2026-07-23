import {addDays, addMonths, addWeeks} from './dateUtils'

export type ReleaseType = 'asap' | 'scheduled' | 'undecided'
export type ReleaseKind = 'release' | 'scheduledDraft'
export type Readiness = 'valid' | 'error' | 'validating'

export interface MockRelease {
  id: string
  title: string
  kind: ReleaseKind
  type: ReleaseType
  /** null for asap / undecided (no fixed date) */
  publishAt: Date | null
  documentCount: number
  readiness: Readiness
}

/**
 * A deliberately varied mock set for the timeline sandbox: ASAP + undecided (undated), scheduled
 * releases spread across ~3 months, a couple of deliberate same-day collisions to exercise the
 * "stagger" affordance, a scheduled draft mixed in, one overdue (past) release, and mixed readiness.
 * Dates are relative to now so the "today" marker always sits mid-range.
 */
export function getMockReleases(now: Date): MockRelease[] {
  return [
    // ── Undated: ready now / parked ──────────────────────────────────────────
    {
      id: 'r-asap-1',
      title: 'Homepage refresh',
      kind: 'release',
      type: 'asap',
      publishAt: null,
      documentCount: 8,
      readiness: 'valid',
    },
    {
      id: 'r-asap-2',
      title: 'Pricing update',
      kind: 'release',
      type: 'asap',
      publishAt: null,
      documentCount: 3,
      readiness: 'error',
    },
    {
      id: 'r-asap-3',
      title: 'Nav copy tweaks',
      kind: 'release',
      type: 'asap',
      publishAt: null,
      documentCount: 1,
      readiness: 'valid',
    },
    {
      id: 'r-und-1',
      title: 'Q4 campaign (draft plan)',
      kind: 'release',
      type: 'undecided',
      publishAt: null,
      documentCount: 14,
      readiness: 'validating',
    },
    {
      id: 'r-und-2',
      title: 'Rebrand rollout',
      kind: 'release',
      type: 'undecided',
      publishAt: null,
      documentCount: 42,
      readiness: 'error',
    },
    // ── Overdue (scheduled in the past, not yet published) ───────────────────
    {
      id: 'r-past-1',
      title: 'Spring sale wind-down',
      kind: 'release',
      type: 'scheduled',
      publishAt: addDays(now, -2),
      documentCount: 5,
      readiness: 'error',
    },
    // ── This week ────────────────────────────────────────────────────────────
    {
      id: 'r-w-1',
      title: 'Fall campaign',
      kind: 'release',
      type: 'scheduled',
      publishAt: addDays(now, 2),
      documentCount: 12,
      readiness: 'valid',
    },
    {
      id: 'd-w-1',
      title: 'Blog: launch recap',
      kind: 'scheduledDraft',
      type: 'scheduled',
      publishAt: addDays(now, 3),
      documentCount: 1,
      readiness: 'valid',
    },
    // ── Collision: two releases + a draft within the same day (+9) ────────────
    {
      id: 'r-col-1',
      title: 'Product launch A',
      kind: 'release',
      type: 'scheduled',
      publishAt: addDays(now, 9),
      documentCount: 20,
      readiness: 'valid',
    },
    {
      id: 'r-col-2',
      title: 'Partner announcement',
      kind: 'release',
      type: 'scheduled',
      publishAt: addDays(now, 9),
      documentCount: 6,
      readiness: 'valid',
    },
    {
      id: 'd-col-1',
      title: 'Press release: partner',
      kind: 'scheduledDraft',
      type: 'scheduled',
      publishAt: addDays(now, 9),
      documentCount: 1,
      readiness: 'validating',
    },
    // ── Later weeks / months ─────────────────────────────────────────────────
    {
      id: 'r-m-1',
      title: 'Docs IA overhaul',
      kind: 'release',
      type: 'scheduled',
      publishAt: addWeeks(now, 3),
      documentCount: 30,
      readiness: 'valid',
    },
    {
      id: 'r-m-2',
      title: 'Holiday landing pages',
      kind: 'release',
      type: 'scheduled',
      publishAt: addWeeks(now, 6),
      documentCount: 18,
      readiness: 'validating',
    },
    {
      id: 'r-m-3',
      title: 'Annual report',
      kind: 'release',
      type: 'scheduled',
      publishAt: addMonths(now, 2),
      documentCount: 9,
      readiness: 'valid',
    },
    {
      id: 'd-m-1',
      title: 'Newsletter: December',
      kind: 'scheduledDraft',
      type: 'scheduled',
      publishAt: addWeeks(now, 8),
      documentCount: 1,
      readiness: 'valid',
    },
  ]
}
