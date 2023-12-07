import {definePlugin} from 'sanity'
import {StudioLayout} from './StudioLayout'
import {StudioNavbar} from './StudioNavbar'
import {StudioLogo} from './StudioLogo'
import {StudioToolMenu} from './StudioToolMenu'
import {FormInput} from './FormInput'
import {FormField} from './FormField'
import {DocumentLayout} from './DocumentLayout'

export const customComponents = definePlugin({
  name: 'custom-components',

  document: {
    components: {
      layout: DocumentLayout,
    },
  },

  form: {
    components: {
      input: FormInput,
      field: FormField,
    },
  },

  studio: {
    components: {
      layout: StudioLayout,
      logo: StudioLogo,
      navbar: StudioNavbar,
      toolMenu: StudioToolMenu,
    },
  },
})
