import {createValidationWorkerHost} from './validationWorkerHost'

// Entry point of the dedicated worker: `self` is the worker's global scope, which exposes the
// same `postMessage` / `addEventListener('message')` surface as a `MessagePort`.
createValidationWorkerHost(self)
