import {definePlugin, type DocumentLanguageFilterComponent, type ObjectInputProps} from 'sanity'

import {LanguageFilterMenuButton} from './LanguageFilterMenuButton'
import {LanguageFilterObjectInput} from './LanguageFilterObjectInput'
import {type LanguageFilterPluginOptions} from './types'

/**
 * Language filter plugin for Sanity
 */
export const languageFilter = definePlugin<LanguageFilterPluginOptions>((options) => {
  const RenderLanguageFilter: DocumentLanguageFilterComponent = (props) => {
    return <LanguageFilterMenuButton options={options} schemaType={props.schemaType} />
  }

  return {
    name: '@sanity/language-filter',

    document: {
      unstable_languageFilter: (prev, {schemaType}) => {
        if (!options.types || options.types?.includes(schemaType)) {
          return [...prev, RenderLanguageFilter]
        }

        return prev
      },
    },

    form: {
      renderInput(props: any, next: any) {
        if (props.schemaType.name === 'object') {
          const segment = props.path[props.path.length - 1]

          if (typeof segment === 'string' && segment.startsWith('locale')) {
            return <LanguageFilterObjectInput {...(props as ObjectInputProps)} options={options} />
          }
        }

        return next(props)
      },
    },
  }
})
