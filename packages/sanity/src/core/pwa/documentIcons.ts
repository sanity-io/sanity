import {type WebAppManifestIcon} from './types'

/**
 * `favicon.ico` files are declared with `sizes="any"` but are not scalable, so treating them as a
 * high resolution icon would install the studio with a blurry icon.
 */
function isIcoUrl(url: string): boolean {
  return new URL(url).pathname.toLowerCase().endsWith('.ico')
}

function isSvgIcon(link: HTMLLinkElement): boolean {
  return link.type === 'image/svg+xml' || new URL(link.href).pathname.toLowerCase().endsWith('.svg')
}

function toManifestIcon(link: HTMLLinkElement): WebAppManifestIcon | undefined {
  if (!link.href) return undefined

  let src: string
  try {
    src = new URL(link.href, link.baseURI).href
    if (isIcoUrl(src)) return undefined
  } catch {
    return undefined
  }

  // Only advertise a size the document actually declared. A scalable icon is `any` by definition;
  // for everything else an absent `sizes` attribute tells us nothing, and guessing would either
  // hide a usable icon or claim a resolution the file does not have.
  const declaredSizes = link.getAttribute('sizes')
  const sizes = isSvgIcon(link) ? 'any' : declaredSizes
  if (!sizes) return undefined

  return {src, sizes, ...(link.type ? {type: link.type} : {})}
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
