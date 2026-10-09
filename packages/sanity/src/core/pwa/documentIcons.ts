import {type WebAppManifestIcon} from './types'

function hasExtension(url: URL, extension: string): boolean {
  return url.pathname.toLowerCase().endsWith(extension)
}

function toManifestIcon(link: HTMLLinkElement): WebAppManifestIcon | undefined {
  if (!link.href) return undefined

  let url: URL
  try {
    url = new URL(link.href, link.baseURI)
  } catch {
    return undefined
  }

  // `favicon.ico` files are declared with `sizes="any"` but are not scalable, so treating one as a
  // high resolution icon would install the studio with a blurry icon.
  if (hasExtension(url, '.ico')) return undefined

  // Only advertise a size the document actually declared. A scalable icon is `any` by definition;
  // for everything else an absent `sizes` attribute tells us nothing, and guessing would either
  // hide a usable icon or claim a resolution the file does not have.
  const scalable = link.type === 'image/svg+xml' || hasExtension(url, '.svg')
  const sizes = scalable ? 'any' : link.getAttribute('sizes')
  if (!sizes) return undefined

  return {src: url.href, sizes, ...(link.type ? {type: link.type} : {})}
}

/**
 * The icons a document declares through `<link rel="icon">` and `<link rel="apple-touch-icon">`,
 * as manifest `icons` entries. Used as a fallback for documents that declare no manifest of their
 * own to inherit icons from.
 *
 * @internal
 */
export function readDocumentIcons(doc: Document): WebAppManifestIcon[] {
  const links = doc.querySelectorAll<HTMLLinkElement>(
    'link[rel~="icon"], link[rel~="apple-touch-icon"]',
  )

  const icons = Array.from(links).flatMap((link) => toManifestIcon(link) ?? [])

  // Two links can point at the same file (eg `rel="icon"` and `rel="apple-touch-icon"`).
  return icons.filter((icon, index) => icons.findIndex(({src}) => src === icon.src) === index)
}
