// The ObjectModel interface allows the Mendoza decoder to work on different structures of objects.
// V is the _value_ type which represents all values (which are immutable). S, O, A are mutable
// builders for strings, objects and arrays respectively.
export interface ObjectModel<V, S, O, A> {
  wrap(data: any): V

  objectGetKeys(value: V): string[]
  objectGetField(value: V, key: string): V
  arrayGetElement(value: V, idx: number): V

  finalize(b: S | O | A): V

  markChanged(value: V): V

  copyString(value: V | null): S
  copyObject(value: V | null): O
  copyArray(value: V | null): A

  objectSetField(target: O, key: string, value: V): void
  objectDeleteField(target: O, key: string): void

  arrayAppendValue(target: A, value: V): void
  arrayAppendSlice(target: A, source: V, left: number, right: number): void

  stringAppendValue(target: S, value: V): void
  stringAppendSlice(target: S, source: V, left: number, right: number): void
}
