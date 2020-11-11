/* eslint-disable import/no-duplicates */
/* eslint-disable import/export */

/*
 * config:*
 */

declare module 'config:sanity' {
  interface SanityConfig {
    api: {
      projectId: string
      dataset: string
    }
  }

  const config: SanityConfig
  export default config
}

/*
 * sanity:*
 */

declare module 'sanity:css-custom-properties' {
  const cssCustomProperties: Record<string, string>
  export default cssCustomProperties
}

declare module 'sanity:versions' {
  type PackageName = string
  type VersionNumber = string
  const versions: Record<PackageName, VersionNumber>
  export default versions
}

/*
 * part:@sanity/base/*
 */

// @todo: define interface
declare module 'part:@sanity/base/authentication-fetcher'

declare module 'part:@sanity/base/theme/typography/headings-style'
declare module 'part:@sanity/base/theme/typography/text-blocks-style'

declare module 'part:@sanity/base/brand-logo?' {
  const BrandLogo: React.ComponentType | undefined
  export default BrandLogo
}

declare module 'part:@sanity/base/configure-client?' {
  import {SanityClient as OriginalSanityClient} from '@sanity/client'

  type Configurer = (client: OriginalSanityClient) => OriginalSanityClient
  const configure: Configurer | undefined

  export default configure
}

declare module 'part:@sanity/base/client' {
  import {SanityClient} from '@sanity/client'

  const client: SanityClient

  export default client
}

// @todo: convert to TS
declare module 'part:@sanity/base/util/draft-utils'

declare module 'part:@sanity/base/schema' {
  // @todo: define Schema interface
  type Schema = any

  const schema: Schema

  export default schema
}

/*
 * part:@sanity/components/*
 */

// styles
declare module 'part:@sanity/components/autocomplete/default-style'
declare module 'part:@sanity/components/buttons/button-grid-style'
declare module 'part:@sanity/components/buttons/default-style'
declare module 'part:@sanity/components/buttons/dropdown-style'
declare module 'part:@sanity/components/buttons/in-input-style'
declare module 'part:@sanity/components/dialogs/content-style'
declare module 'part:@sanity/components/dialogs/default-style'
declare module 'part:@sanity/components/dialogs/fullscreen-style'
declare module 'part:@sanity/components/dialogs/popover-style'
declare module 'part:@sanity/components/fieldsets/default-style'
declare module 'part:@sanity/components/fileinput/button'
declare module 'part:@sanity/components/edititem/fold-style'
declare module 'part:@sanity/components/formfields/default-style'
declare module 'part:@sanity/components/labels/default-style'
declare module 'part:@sanity/components/loading/spinner-style'
declare module 'part:@sanity/components/menus/default-style'
declare module 'part:@sanity/components/previews/block-image-style'
declare module 'part:@sanity/components/previews/block-style'
declare module 'part:@sanity/components/previews/card-style'
declare module 'part:@sanity/components/previews/default-style'
declare module 'part:@sanity/components/previews/detail-style'
declare module 'part:@sanity/components/previews/inline-style'
declare module 'part:@sanity/components/previews/media-style'
declare module 'part:@sanity/components/progress/bar-style'
declare module 'part:@sanity/components/progress/circle-style'
declare module 'part:@sanity/components/selects/custom-style'
declare module 'part:@sanity/components/selects/default-style'
declare module 'part:@sanity/components/selects/searchable-style'
declare module 'part:@sanity/components/selects/style-style'
declare module 'part:@sanity/components/tags/textfield-style'
declare module 'part:@sanity/components/textareas/default-style'
declare module 'part:@sanity/components/textfields/default-style'
declare module 'part:@sanity/components/textfields/search-style'
declare module 'part:@sanity/components/textinputs/default-style'
declare module 'part:@sanity/components/toggles/buttons-style'

// optional parts
declare module 'part:@sanity/components/dialogs/fullscreen-message?'
