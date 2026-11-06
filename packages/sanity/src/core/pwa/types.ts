/**
 * A parsed web app manifest document. Members we neither read nor write are kept as-is so a
 * manifest the studio inherits from the host document round-trips unchanged.
 *
 * @internal
 */
export type WebAppManifest = {
  [member: string]: unknown
  background_color?: string
  display?: string
  icons?: WebAppManifestIcon[]
  id?: string
  name?: string
  scope?: string
  short_name?: string
  start_url?: string
  theme_color?: string
}

/**
 * An entry of the manifest's `icons` member.
 *
 * @internal
 */
export interface WebAppManifestIcon {
  purpose?: string
  sizes?: string
  src: string
  type?: string
}
