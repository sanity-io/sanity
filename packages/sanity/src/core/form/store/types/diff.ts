import {type TargetPerspective} from '../../../perspective/types'

/**
 * When comparing documents, diff provenance reflects details about the bundle in which a change
 * was introduced.
 *
 * @public
 */
export interface ProvenanceDiffAnnotation {
  provenance: {
    bundle?: TargetPerspective
  }
}
