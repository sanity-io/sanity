import {ObjectModel} from './object-model'
import {RawPatch} from './patch'
declare type InputEntry<V> = {
  value: V
  key?: string
  keys?: string[]
}
declare type OutputEntry<V, S, O, A> = {
  value: V | null
  writeValue?: S | O | A
}
export declare class Patcher<V, S, O, A> {
  private model
  private root
  private patch
  private i
  private inputStack
  private outputStack
  constructor(model: ObjectModel<V, S, O, A>, root: V, patch: RawPatch)
  read(): unknown
  process(): V
  inputEntry(): InputEntry<V>
  inputKey(entry: InputEntry<V>, idx: number): string
  outputEntry(): OutputEntry<V, S, O, A>
  outputArray(): A
  outputObject(): O
  outputString(): S
  finalizeOutput(entry: OutputEntry<V, S, O, A>): V
  processValue(): void
  processCopy(): void
  processBlank(): void
  processReturnIntoArray(): void
  processReturnIntoObject(): void
  processReturnIntoObjectSameKey(): void
  processPushField(): void
  processPushElement(): void
  processPop(): void
  processPushFieldCopy(): void
  processPushFieldBlank(): void
  processPushElementCopy(): void
  processPushElementBlank(): void
  processReturnIntoObjectPop(): void
  processReturnIntoObjectSameKeyPop(): void
  processReturnIntoArrayPop(): void
  processObjectSetFieldValue(): void
  processObjectCopyField(): void
  processObjectDeleteField(): void
  processArrayAppendValue(): void
  processArrayAppendSlice(): void
  processStringAppendString(): void
  processStringAppendSlice(): void
}
export {}
