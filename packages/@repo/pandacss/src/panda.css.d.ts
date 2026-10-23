// The `types` condition of the `./panda.css` export: a side-effect import of the stylesheet
// (`import '@repo/pandacss/panda.css'`) type-checks without the `*.css` module declaration of
// `vite/client`, which not every app that imports it includes.

