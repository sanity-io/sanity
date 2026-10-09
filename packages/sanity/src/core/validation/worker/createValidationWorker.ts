import InlineValidationWorker from './validation.worker.ts?worker&inline'

/**
 * Starts the validation worker from an inlined bundle, so the published package needs no extra
 * file next to its chunks and the worker can be created from any origin (the auto-updating
 * studio serves its modules from a CDN, which a same-origin worker URL could not be loaded from).
 * Imported lazily, so studios that do not enable the worker never load the bundle.
 */
export function createValidationWorker(): Worker {
  return new InlineValidationWorker({name: 'sanity-validation'})
}
