import {createConfig} from '@sanity/base'
import {blogDeskTool} from './blog/deskTool'
import {blogSource} from './blog/source'
import {docsDeskTool} from './docs/deskTool'
import {docsSource} from './docs/source'
import {internalDeskTool} from './internal/deskTool'
import {internalSource} from './internal/source'
import {tools} from './tools'

export default createConfig({
  plugins: [
    // unsplashSource({
    //   // ...
    //   // sourceName: 'my-unsplash'
    // }),

    docsDeskTool,
    blogDeskTool,
    internalDeskTool,
  ],
  project: {name: 'Sanity.io'},
  sources: [blogSource, docsSource, internalSource],
  tools,

  // assetSources: [
  //   {type: 'file'},
  //   {type: 'image'},
  //   {
  //     name: 'my-unsplash',
  //     title: 'Unsplash',
  //     types: ['file', 'image'],
  //   },
  //   // {
  //   //   name: 'reuters-asset-db',
  //   //   title: 'Reuters',
  //   //   types: ['file', 'image'],
  //   // },
  // ],

  // components: {
  //   Branding
  // },

  // form: {
  //   inputComponent: (options) => {
  //     // return options.default // default input component
  //     return undefined // default input component
  //   }
  // },
})
