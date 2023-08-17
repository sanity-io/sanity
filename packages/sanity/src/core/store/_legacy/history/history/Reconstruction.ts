import {Diff} from '@sanity/diff'
import {Annotation, Chunk} from '../../../../field'
import {Timeline} from './Timeline'
import {CombinedDocument} from './types'

/**
 * A reconstruction represents a single reconstruction of a
 */
export class Reconstruction {
  timeline: Timeline
  start: Chunk | null
  end: Chunk
  doc: CombinedDocument

  constructor(timeline: Timeline, doc: CombinedDocument, start: Chunk | null, end: Chunk) {
    this.timeline = timeline
    this.start = start
    this.end = end
    this.doc = doc
  }

  same(start: Chunk | null, end: Chunk): boolean {
    return this.start === start && this.end === end
  }

  private _startDocument?: CombinedDocument
  private _endDocument?: CombinedDocument
  private _diff?: Diff<Annotation>

  /** Returns the attributes as seen at the end of the range. */
  endAttributes(): Record<string, unknown> | null {
    return getAttrs(this.endDocument())
  }

  endDocument(): CombinedDocument {
    if (!this._endDocument) {
      this._endDocument = this.timeline.replayBackwardsUntil(this.end.end, this.doc)
    }

    return this._endDocument
  }

  /** Returns the attributes as seen at the end of the range. */
  startAttributes(): Record<string, unknown> | null {
    return getAttrs(this.startDocument())
  }

  startDocument(): CombinedDocument {
    if (!this.start) throw new Error('start required')

    if (!this._startDocument) {
      this._startDocument = this.timeline.replayBackwardsBetween(
        this.start.end,
        this.end.end - 1,
        this.endDocument(),
      )
    }

    return this._startDocument
  }

  diff(): Diff<Annotation> {
    if (!this._diff) {
      if (!this.start) throw new Error('start required')

      this._diff = this.timeline.calculateDiff(
        this.startDocument(),
        this.endDocument(),
        this.start.index + 1,
        this.end.index,
      )
    }

    return this._diff
  }
}

function getAttrs(doc: CombinedDocument) {
  return doc.draft || doc.published
}
