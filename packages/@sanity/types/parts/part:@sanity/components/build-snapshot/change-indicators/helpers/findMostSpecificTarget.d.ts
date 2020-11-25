import {TrackedChange, TrackedArea} from '../'
export declare function findMostSpecificTarget(
  targetType: 'change' | 'field',
  id: string,
  values: Map<string, TrackedChange | TrackedArea>
): TrackedChange | undefined
