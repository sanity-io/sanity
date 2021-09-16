// These are path mappings/aliases used by various tools in the monorepo to map imported modules to source files
//  in order to speed up rebuilding and avoid having a separate watcher process to build from src => dist/lib
//
// this file is currently read by:
// - webpack when running the dev server
// - jest when running test suite
// note: order matters. The most specific paths should appear first

module.exports = {
  '@sanity/base/__legacy/@sanity/components':
    './packages/@sanity/base/src/__legacy/@sanity/components',

  '@sanity/base': './packages/@sanity/base/src/_exports',

  '@sanity/desk-tool': './packages/@sanity/desk-tool/src/_exports',

  '@sanity/schema': './packages/@sanity/schema/src/_exports',

  '@sanity/block-tools': './packages/@sanity/block-tools/src',
  '@sanity/components': './packages/@sanity/components/src',
  '@sanity/diff': './packages/@sanity/diff/src',
  '@sanity/field': './packages/@sanity/field/src',
  '@sanity/form-builder/PatchEvent': './packages/@sanity/form-builder/src/PatchEvent',
  // Required by BarcodeInput in the Ecommerce template
  '@sanity/form-builder/lib/FormBuilderInput':
    './packages/@sanity/form-builder/src/FormBuilderInput',
  '@sanity/form-builder': './packages/@sanity/form-builder/src',
  '@sanity/imagetool': './packages/@sanity/imagetool/src',
  '@sanity/initial-value-templates': './packages/@sanity/initial-value-templates/src',
  '@sanity/portable-text-editor': './packages/@sanity/portable-text-editor/src',
  '@sanity/mutator': './packages/@sanity/mutator/src',
  '@sanity/client': './packages/@sanity/client/src/sanityClient.js',
  '@sanity/resolver': './packages/@sanity/resolver/src/resolver.js',

  '@sanity/react-hooks': './packages/@sanity/react-hooks/src',

  '@sanity/state-router/components': './packages/@sanity/state-router/src/components',
  '@sanity/state-router': './packages/@sanity/state-router/src',
  '@sanity/structure': './packages/@sanity/structure/src',
  '@sanity/transaction-collator': './packages/@sanity/transaction-collator/src',
  '@sanity/util': './packages/@sanity/util/src/_exports',
  '@sanity/types': './packages/@sanity/types/src',
  '@sanity/validation': './packages/@sanity/validation/src',
}
