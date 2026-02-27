/**
 * @internal
 */
export type ResolutionMarker = [
  /**
   * The upstream revision at the time of resolution.
   *
   * This is used to determine whether any change has occurred to the upstream document since the
   * divergence was marked as resolved.
   */
  Revision: string,

  /**
   * The signature represents the node's value at the time of resolution.
   *
   * - For primitive nodes, it's the hash of node's upstream value at the time of resolution.
   * - For object array members, it's the position of the node in the upstream array at the time of
   *   resolution.
   *
   * This is used to determine whether any change has occurred in the upstream node itself since the
   * divergence was marked as resolved.
   */
  Signature: string | number,
]
