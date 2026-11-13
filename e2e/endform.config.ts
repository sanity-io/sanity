// Endform sends each runner the files the tests import. Files they read at runtime without
// importing them are listed here.
export default {
  // Written by `pnpm --filter e2e dom-prop-vocabulary` before the run, see
  // `helpers/domPropLeaks/vocabulary.ts`.
  additionalFiles: ['helpers/domPropLeaks/vocabulary.generated.json'],
}
