import {
  type ObjectSchemaType,
  type PathSegment,
  type SchemaType,
  isArrayOfPrimitivesSchemaType,
  isArrayOfStringsSchemaType,
  isArraySchemaType,
  isObjectSchemaType,
} from '@sanity/types'
import {fromString, toString} from '@sanity/util/paths'
import {
  type Observable,
  catchError,
  combineLatest,
  filter,
  from,
  map,
  mergeMap,
  of,
  reduce,
  switchMap,
  toArray,
} from 'rxjs'

import {resolveDiffComponent} from '../field/diff/resolve/resolveDiffComponent'
import {type DiffComponent, type DiffComponentOptions} from '../field/types'
import {type FormState} from '../form/store/useFormState'
import {
  type DivergenceNavigatorState,
  type ReachableDivergence,
  type ReachableDivergenceAtPath,
} from './divergenceNavigator'
import {type Divergence} from './readDocumentDivergences'
import {introspectSchema} from './utils/introspectSchema'
import {readOrderedFormMembers} from './utils/readOrderedFormMembers'

/**
 * Transpose a collated set of divergences onto a given schema type.
 *
 * This process:
 *
 * - Omits divergences that occur at paths missing from the schema.
 * - Omits divergences that descend "composite" nodes:
 *   - Nodes that have a dedicated diff component, such as references.
 *   - Nodes whose descendants have *all* been unset.
 * - Omits unaddressable divergences, unless they affect "composite" nodes.
 * - Resolves each divergence's diff component.
 * - Orders divergences to match the way the form renders them.
 *
 * @internal
 */
export function transposeSchema(
  divergences: Record<string, Divergence>,
  schemaType: ObjectSchemaType,
  formState: Pick<FormState, 'groups' | '_allMembers'>,
): Observable<{
  divergences: ReachableDivergenceAtPath[]
  divergencesByNode: DivergenceNavigatorState['divergencesByNode']
}> {
  return readOrderedFormMembers({groups: formState.groups, members: formState._allMembers})
    .pipe(
      map(([path]) => {
        const pathString = toString(path)
        const divergenceAtPath = divergences[pathString]
        return [pathString, divergenceAtPath] satisfies [path: string, divergence: Divergence]
      }),
      filter(([, divergence]) => typeof divergence !== 'undefined'),
      filter(([, divergence]) => divergence.status === 'unresolved'),
      switchMap(([path, divergence]) =>
        combineLatest({
          path: of(path),
          divergence: of(divergence),
          pathSchemaTypes: from(
            introspectSchema(
              schemaType,
              divergence.snapshots.subjectHead?.pathWithTypes ??
                divergence.snapshots.upstreamHead?.pathWithTypes ??
                fromString(path),
            ),
          ).pipe(
            toArray(),
            // Divergences can affect fields that aren't present in the schema. In this scenario,
            // `introspectSchema` throws an error. This behaviour is expected, because divergences are
            // computed by comparing raw document data.
            //
            // When this occurs, the divergence is x and a warning is logged.
            catchError((error) => {
              console.warn(error)
              return of([])
            }),
          ),
        }),
      ),
      filter(isSupportedNode),
    )
    .pipe(
      reduce<
        {
          path: string
          pathSchemaTypes: SchemaType[]
          divergence: Divergence
        },
        Record<string, ReachableDivergence>
      >((transposed, {path, pathSchemaTypes, divergence}) => {
        const pathSegments = fromString(path)
        const divergenceSchemaType = pathSchemaTypes.at(-1)

        if (typeof divergenceSchemaType === 'undefined') {
          return transposed
        }

        let compositeNodePath: PathSegment[] | undefined
        let compositeNodeDiffComponent: DiffComponentOptions | DiffComponent<any> | undefined
        let compositeNodeSchemaType: SchemaType | undefined

        for (let index = 0; index < pathSegments.length; index++) {
          const currentPathSegments = pathSegments.slice(0, index + 1)
          const currentSchemaType = pathSchemaTypes[index]
          const parentSchemaType = pathSchemaTypes[index - 1]

          if (typeof currentSchemaType === 'undefined') {
            break
          }

          const diffComponent =
            isArraySchemaType(currentSchemaType) || isObjectSchemaType(currentSchemaType)
              ? resolveDiffComponent(
                  currentSchemaType,
                  isObjectSchemaType(parentSchemaType) || isArraySchemaType(parentSchemaType)
                    ? parentSchemaType
                    : undefined,
                )
              : undefined

          if (typeof diffComponent !== 'undefined') {
            compositeNodePath = currentPathSegments
            compositeNodeDiffComponent = diffComponent
            compositeNodeSchemaType = currentSchemaType
            break
          }
        }

        if (
          typeof compositeNodePath !== 'undefined' &&
          typeof compositeNodeSchemaType !== 'undefined' &&
          typeof compositeNodeDiffComponent !== 'undefined'
        ) {
          transposed[toString(compositeNodePath)] ??= {
            ...divergence,
            path: toString(compositeNodePath),
            isComposite: true,
            divergences: [],
            schemaType: compositeNodeSchemaType,
            diffComponent: compositeNodeDiffComponent,
          }

          transposed[toString(compositeNodePath)].divergences.push([divergence.path, divergence])
          return transposed
        }

        const parentSchemaType = pathSchemaTypes.at(-2)

        transposed[path] ??= {
          ...divergence,
          isComposite: false,
          divergences: [],
          schemaType: divergenceSchemaType,
          diffComponent: resolveDiffComponent(
            divergenceSchemaType,
            isObjectSchemaType(parentSchemaType) || isArraySchemaType(parentSchemaType)
              ? parentSchemaType
              : undefined,
          ),
        }

        transposed[path].divergences.push([divergence.path, divergence])
        return transposed
      }, {}),
      mergeMap((transposed) => from(Object.entries(transposed))),
      toArray(),
      map((reachableDivergences) => {
        const divergencesByNode = reachableDivergences.reduce<
          DivergenceNavigatorState['divergencesByNode']
        >((state, [path]) => {
          const pathSegments = fromString(path)

          for (let index = 0; index < pathSegments.length; index++) {
            const currentPathSegments = pathSegments.slice(0, index + 1)
            const currentPath = toString(currentPathSegments)

            state[currentPath] ??= 0
            state[currentPath]++
          }

          return state
        }, {})

        return {
          divergences: reachableDivergences,
          divergencesByNode,
        }
      }),
    )
}

/**
 * Check whether the UI is capable of rendering the provided divergence.
 *
 * The UI does not currently support:
 *
 * - Options inside an array list.
 * - Tags inside an array of tags.
 */
function isSupportedNode({
  pathSchemaTypes,
}: {
  path: string
  divergence: Divergence
  pathSchemaTypes: SchemaType[]
}): boolean {
  const parentSchemaType = pathSchemaTypes.at(-2)

  const isArrayListOption =
    isArrayOfPrimitivesSchemaType(parentSchemaType) &&
    Array.isArray(parentSchemaType?.options?.list)

  const isArrayTag =
    (isArrayOfStringsSchemaType(parentSchemaType) &&
      parentSchemaType?.options &&
      parentSchemaType.options.layout === 'tags') ??
    false

  return !isArrayListOption && !isArrayTag
}
