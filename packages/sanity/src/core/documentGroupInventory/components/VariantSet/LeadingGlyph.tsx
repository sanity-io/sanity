import {type BadgeTone} from '@sanity/ui'

import {StatusMark} from '../../../../ui-components/statusMark/StatusMark'
import {type StatusMarkName} from '../../../../ui-components/statusMark/statusMarkGeometry'

/**
 * A cell of the shared leading column: a group's status mark (the Published disc, the Draft ring,
 * a release's bolt or clock) or a row's variant diamond, at the row mark size, so every mark down
 * the panel reads as one size. A Default row has no mark: the cell stays empty.
 *
 * @internal
 */
export function LeadingGlyph({
  className,
  mark,
  tone,
  'data-testid': testId,
}: {
  'className': string
  'mark'?: StatusMarkName
  'tone'?: BadgeTone
  'data-testid'?: string
}) {
  return (
    <span className={className} data-testid={testId}>
      {mark && <StatusMark mark={mark} size="row" tone={tone} />}
    </span>
  )
}
