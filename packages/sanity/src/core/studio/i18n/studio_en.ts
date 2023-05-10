// eslint-disable-next-line import/no-extraneous-dependencies,import/no-unassigned-import
//import 'i18next'

/*declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'studio'
    resources: StudioResources
  }
}*/

export interface StudioResources {
  studio: StudioStrings
}

export const enStudioStrings = {
  searchPlaceholder: 'Search (en)',
}

export type StudioStrings = typeof enStudioStrings
