// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {definePlugin} from 'sanity'

import {DocumentLayout} from './DocumentLayout'
import {FormField} from './FormField'
import {FormInput} from './FormInput'
import {StudioLayout} from './StudioLayout'
import {StudioNavbar} from './StudioNavbar'
import {StudioToolMenu} from './StudioToolMenu'

const childComponents = definePlugin({
  name: 'child-components',

  document: {
    components: {
      // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
      unstable_layout: (props) => (
        // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
        <DocumentLayout {...props} testId="child-parent-config-document-layout" />
      ),
    },
  },

  form: {
    components: {
      // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
      input: (props) => <FormInput {...props} testId="child-parent-config-form-input" />,
      // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
      field: (props) => <FormField {...props} testId="child-parent-config-form-field" />,
    },
  },

  studio: {
    components: {
      // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
      layout: (props) => <StudioLayout {...props} testId="child-parent-config-studio-layout" />,
      // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
      navbar: (props) => <StudioNavbar {...props} testId="child-parent-config-studio-navbar" />,
      // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
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
      // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
      unstable_layout: (props) => (
        <DocumentLayout {...props} testId="parent-config-document-layout" />
      ),
    },
  },

  form: {
    components: {
      // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
      input: (props) => <FormInput {...props} testId="parent-config-form-input" />,
      // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
      field: (props) => <FormField {...props} testId="parent-config-form-field" />,
    },
  },

  studio: {
    components: {
      // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
      layout: (props) => <StudioLayout {...props} testId="parent-config-studio-layout" />,
      // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
      navbar: (props) => <StudioNavbar {...props} testId="parent-config-studio-navbar" />,
      // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
      toolMenu: (props) => <StudioToolMenu {...props} testId="parent-config-studio-tool-menu" />,
    },
  },

  plugins: [childComponents()],
})
