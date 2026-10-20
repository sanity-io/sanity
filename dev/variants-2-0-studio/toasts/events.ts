// The result toasts of the variant actions (Figma C7 page, section "Result toasts", frame "C7 / T1", node 308:11881).
// One table: the event, its tone, the copy, the action and how long it stays. The toast is the stock Studio toast
// (`useToast().push`); the action sits in its description (see ResultToast.tsx).
//   tone:     positive -> success, caution -> warning, critical -> error, neutral -> info
//   duration: 5 s success, 10 s caution, none for failures and for "in progress" (it is replaced by the result)

export type ToastTone = 'positive' | 'caution' | 'critical' | 'neutral'

export type ToastEventId =
  | 'version-created'
  | 'versions-created'
  | 'definition-created'
  | 'version-deleted'
  | 'definition-deleted'
  | 'published'
  | 'some-failed'
  | 'failed'
  | 'in-progress'

const NO_TIMER = Number.POSITIVE_INFINITY

export interface ToastEvent {
  id: ToastEventId
  /** What happened, for the preview list. */
  label: string
  tone: ToastTone
  title: string
  description?: string
  action?: string
  /** Milliseconds; Infinity = no timer: stays until dismissed or replaced (Sanity UI turns 0 into its 5 s default). */
  duration: number
}

/** The values the copy needs; the previews use these. */
export interface ToastValues {
  /** The variant name: "German". */
  variant: string
  /** The document: "Summer landing page". */
  document: string
  /** How many versions the action covered / how many failed. */
  count: number
  failed: number
  /** Versions left without a definition. */
  orphans: number
  /** What the action does, for the failure and progress copy: "Couldn't create", "Creating", "created". */
  verb: 'create' | 'publish' | 'delete'
  /** The real reason, when there is one (a failed request); the preview uses the stock copy. */
  detail?: string
}

export const PREVIEW_VALUES: ToastValues = {
  variant: 'German',
  document: 'Summer landing page',
  count: 12,
  failed: 2,
  orphans: 3,
  verb: 'create',
}

const PAST = {create: 'created', publish: 'published', delete: 'deleted'} as const
const GERUND = {create: 'Creating', publish: 'Publishing', delete: 'Deleting'} as const
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

export const TOAST_EVENTS: ToastEvent[] = [
  {
    id: 'version-created',
    label: 'Version created',
    tone: 'positive',
    title: '',
    action: 'Open',
    duration: 5000,
  },
  {
    id: 'versions-created',
    label: 'Versions created in bulk',
    tone: 'positive',
    title: '',
    action: 'Show',
    duration: 5000,
  },
  {
    id: 'definition-created',
    label: 'Definition created',
    tone: 'positive',
    title: '',
    action: 'View',
    duration: 5000,
  },
  {id: 'version-deleted', label: 'Version deleted', tone: 'positive', title: '', duration: 5000},
  {
    id: 'definition-deleted',
    label: 'Definition deleted, versions left behind',
    tone: 'caution',
    title: '',
    action: 'Show versions',
    duration: 10000,
  },
  {id: 'published', label: 'Published', tone: 'positive', title: '', duration: 5000},
  {
    id: 'some-failed',
    label: 'Some failed',
    tone: 'caution',
    title: '',
    action: 'Show failures',
    duration: NO_TIMER,
  },
  {
    id: 'failed',
    label: 'Failed',
    tone: 'critical',
    title: '',
    action: 'Try again',
    duration: NO_TIMER,
  },
  {id: 'in-progress', label: 'In progress', tone: 'neutral', title: '', duration: NO_TIMER},
]

/** The copy of an event for these values. */
export function toastCopy(id: ToastEventId, v: ToastValues): {title: string; description?: string} {
  switch (id) {
    case 'version-created':
      return {
        title: `${v.variant} version created`,
        description: `${v.document} now has its own ${v.variant} version.`,
      }
    case 'versions-created':
      return {title: `${v.count} ${v.variant} ${plural(v.count, 'version', 'versions')} created`}
    case 'definition-created':
      return {
        title: `${v.variant} definition created`,
        description: `${v.variant} is ready to use on documents.`,
      }
    case 'version-deleted':
      return {
        title:
          v.count > 1 ? `${v.count} ${v.variant} versions deleted` : `${v.variant} version deleted`,
      }
    case 'definition-deleted':
      return {
        title: `${v.variant} definition deleted`,
        description: `${v.orphans} ${plural(v.orphans, 'version no longer matches a definition.', 'versions no longer match a definition.')}`,
      }
    case 'published':
      return {
        title:
          v.count > 1
            ? `${v.count} ${v.variant} versions published`
            : `${v.variant} version published`,
      }
    case 'some-failed':
      return {
        title: `${v.count - v.failed} of ${v.count} ${v.variant} versions ${PAST[v.verb]}`,
        description:
          v.verb === 'create'
            ? `${v.failed} failed and ${plural(v.failed, 'is', 'are')} still missing.`
            : `${v.failed} failed and ${plural(v.failed, 'was', 'were')} not ${PAST[v.verb]}.`,
      }
    case 'failed':
      return {
        title: `Couldn't ${v.verb} the ${v.variant} version`,
        description: v.detail ?? 'The request timed out. Nothing was changed.',
      }
    case 'in-progress':
      return {
        title: `${GERUND[v.verb]} ${v.count} ${v.variant} ${plural(v.count, 'version', 'versions')}...`,
      }
  }
}

export const eventById = (id: ToastEventId): ToastEvent => TOAST_EVENTS.find((e) => e.id === id)!
