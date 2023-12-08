import {definePlugin} from 'sanity'
import {StudioLayout} from './StudioLayout'
import {StudioNavbar} from './StudioNavbar'
import {StudioLogo} from './StudioLogo'
import {StudioToolMenu} from './StudioToolMenu'
import {FormInput} from './FormInput'
import {FormField} from './FormField'
import {DocumentLayout} from './DocumentLayout'

const childComponents = definePlugin({
  name: 'child-components',

  document: {
    components: {
      layout: (props) => <DocumentLayout {...props} testId="child-parent-config-document-layout" />,
    },
  },

  form: {
    components: {
      input: (props) => <FormInput {...props} testId="child-parent-config-form-input" />,
      field: (props) => <FormField {...props} testId="child-parent-config-form-field" />,
    },
  },

  studio: {
    components: {
      layout: (props) => <StudioLayout {...props} testId="child-parent-config-studio-layout" />,
      logo: (props) => <StudioLogo {...props} testId="child-parent-config-studio-logo" />,
      navbar: (props) => <StudioNavbar {...props} testId="child-parent-config-studio-navbar" />,
      toolMenu: (props) => (
        <StudioToolMenu {...props} testId="child-parent-config-studio-tool-menu" />
      ),
    },
  },
})

export const customComponents = definePlugin({
  name: 'custom-components',

  document: {
    components: {
      layout: (props) => <DocumentLayout {...props} testId="parent-config-document-layout" />,
    },
  },

  form: {
    components: {
      input: (props) => <FormInput {...props} testId="parent-config-form-input" />,
      field: (props) => <FormField {...props} testId="parent-config-form-field" />,
    },
  },

  studio: {
    components: {
      layout: (props) => <StudioLayout {...props} testId="parent-config-studio-layout" />,
      logo: (props) => <StudioLogo {...props} testId="parent-config-studio-logo" />,
      navbar: (props) => <StudioNavbar {...props} testId="parent-config-studio-navbar" />,
      toolMenu: (props) => <StudioToolMenu {...props} testId="parent-config-studio-tool-menu" />,
    },
  },

  plugins: [childComponents()],
})
