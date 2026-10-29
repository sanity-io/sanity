// The `types` condition of the `./panda.css` export: a side-effect import of the stylesheet
// (`import '@repo/pandacss/panda.css'`) type-checks without the `*.css` module declaration of
// `vite/client`, which not every app that imports it includes.
// oxlint-disable-next-line unicorn/require-module-specifiers -- the stub declares nothing, so removing its only statement leaves a file that unicorn/no-empty-file rejects
export {}
