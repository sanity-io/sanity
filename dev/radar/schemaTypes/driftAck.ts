import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {defineField, defineType} from 'sanity'

/**
 * A viewer's acknowledgement of a drift-feed entry: silence a known-noisy
 * metric, snooze it until a date, or mark it fixed. Unlike `benchRun` (machine
 * written, read-only), these are written from the Trends tool via the client.
 *
 * Identified deterministically by `metricKey` + `branch` so acking is
 * idempotent (one ack per metric per branch, updated in place). The ack is
 * tied to `baselineValue`: if the metric later drifts past where it was
 * acked, the feed re-surfaces it. Half-life: `snoozed` uses `until`;
 * `silenced`/`fixed` decay after ~30 days so a stale ack can't hide a metric
 * forever (enforced in the feed, see tools/trends/drift.ts).
 */
export const driftAck = defineType({
  name: 'driftAck',
  title: 'Drift acknowledgement',
  type: 'document',
  icon: CheckmarkCircleIcon,
  // Written by the dashboard's Acknowledge buttons via createOrReplace — no
  // draft workflow; the feed's realtime listenQuery expects immediate effect.
  liveEdit: true,
  fields: [
    defineField({
      name: 'metricKey',
      description: 'TrendSeries.key the ack applies to',
      type: 'string',
    }),
    defineField({name: 'branch', type: 'string'}),
    defineField({
      name: 'baselineValue',
      description: 'The recent value when acked — re-surfaces if drift exceeds it again',
      type: 'number',
    }),
    defineField({
      name: 'state',
      type: 'string',
      options: {list: ['silenced', 'snoozed', 'fixed']},
    }),
    defineField({
      name: 'until',
      description: 'Snooze expiry (snoozed state only)',
      type: 'datetime',
    }),
    defineField({name: 'note', type: 'string'}),
    defineField({name: 'ackedBy', type: 'string'}),
    defineField({name: 'ackedAt', type: 'datetime'}),
  ],
  preview: {
    select: {metricKey: 'metricKey', branch: 'branch', state: 'state'},
    prepare: ({metricKey, branch, state}) => ({
      title: `${metricKey} (${branch})`,
      subtitle: state,
    }),
  },
})
