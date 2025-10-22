import {type SanityDocument} from '@sanity/types'
import {
  EMPTY,
  filter,
  from,
  map,
  merge,
  mergeMap,
  type Observable,
  of,
  reduce,
  switchMap,
  takeWhile,
} from 'rxjs'

import {flattenObject} from './utils/flatten'
import {hashData} from './utils/hash'

// this would come from `_system` in the document
// const resolutions: Record<string, ResolutionMarker> = {
//   // 'image': ['GHo0Y0SNkSU8z2lb76buJ5', '9746c39664f005cd7b92aa24ab119fc5e11b53e8'],
//   // 'image._type': ['GHo0Y0SNkSU8z2lb76buJ5', '0e76292794888d4f1fa75fb3aff4ca27c58f56a6'],
//   // name: ['GHo0Y0SNkSU8z2lb76buJ5', 'bb3a7f6c39752c310e6a6e65bb8fe0772cf7bce0'],
// }

interface FindDivergencesContext {
  upstream: SanityDocument | undefined
  subject: SanityDocument | undefined
  // could be handy to emit changes to only a portion of doc
  // path?: Path
  upstreamAtFork: SanityDocument | undefined
  resolutions?: Record<string, ResolutionMarker>
}

// should resolution marker refer to user and timestamp resolution was committed?
// should resolution marker include upstream id? upstream may change due to previous upstream being published/removed.
type ResolutionMarker = [
  // upstream revision at time of resolution
  Revision: string,
  // hash of upstream value at time of resolution
  Hash: string,
]

interface Divergence {
  status: 'unresolved' | 'resolved'
  resolutionMarker?: ResolutionMarker
}

type DivergenceAtPath = [path: string, divergence: Divergence]

type SnapshotType = 'current' | 'upstream' | 'upstreamAtFork'

type DivergenceDetectionStrategy = 'sinceFork' | 'sinceResolution'

const skipFields = /(\.|^)_(id|rev|key|type|system|createdAt|updatedAt)(\.|$)/g

export function findDivergences({
  upstreamAtFork,
  upstream,
  subject,
  resolutions = {},
}: FindDivergencesContext): Observable<DivergenceAtPath> {
  // the problem with this approach is that changing any upstream field causes that document's
  // revision to change. the effect is that changes to any field in the upstream will result in a
  // divergence for all fields in the subject doc, even for fields that are unchanged since the last
  // resolution marker.
  //
  // lazy solution might be to store the upstream value in addition to the `_rev` in the `_system`
  // data of the subject doc. a divergence would require the upstream doc `_rev` has changes *and*
  // the content at the given field path has changed. however, this feels inefficient. maybe we could
  // use a hash instead? 🤔
  //
  // two fold approach:
  //   - first check `_rev` as an inexpensive comparison.
  //   - if rev changed, calculate and compare sha-1 hash.
  //
  // bonus:
  //   - we don't need transactions at all; just two documents to compare.
  //   - having the `_rev` means we can compute how the upstream has changed since the last
  //     resolution marker.
  //
  // how will this be stored in `_system`?
  //
  // ```json
  // {
  //   "_system": {
  //     "title": ["someRev", "someHash"],
  //     "someArray": ["someRev", "someHash"],
  //     "someArray[0]": ["someRev", "someHash"],
  //     "someObjectArray": ["someRev", "someHash"],
  //     "someObjectArray[_key=x].title": ["someRev", "someHash"],
  //     "someObject": ["someRev", "someHash"],
  //     "someObject.title": ["someRev", "someHash"]
  //   }
  // }
  // ```
  //
  // why store resolution markers for parent arrays and objects in addition to each member?
  //   - allows us to determine that a member was added, removed, or moved.
  //
  // what about understanding intention e.g. that an array member moved. or seeing who made the change?
  //   - identify existency of divergence cheaply using document comparison approach.
  //   - lazily computer further details on closer inspection. requires loading and processing
  //     transactions, which is more costly.
  //
  // things to be wary of:
  //   - removal or fields and setting fields to `null`.
  //   - upstream changing due to previous upstream being published or removed. should resolution marker include upstream id?
  //
  // ***
  //
  // another approach could be to walk the transaction log of the upstream in order to identify
  // whether any mutations have occurred for the given field path since the last resolution marker.
  // however, this is complicated and potentially costly in the quanity of data we'd need to load.
  // it also has the downside that noop changes could be identified as divergences (e.g. a value is
  // changed from "x" -> "y" -> "x" in the upstream since the last resolution marker).

  // const upstream = selectUpstreamVersion(upstreamEditState)
  // const subject = editState.version ?? editState.draft

  if (
    typeof subject === 'undefined' ||
    typeof upstream === 'undefined' ||
    typeof upstreamAtFork === 'undefined'
  ) {
    return EMPTY
  }

  type State = Record<string, Record<SnapshotType, unknown | undefined>>

  // TODO: maybe defer work to scheduler
  return merge(
    from(flattenObject(subject, {compact: true}).map((v) => ['current', v])),
    from(flattenObject(upstream, {compact: true}).map((v) => ['upstream', v])),
    from(flattenObject(upstreamAtFork ?? {}, {compact: true}).map((v) => ['upstreamAtFork', v])),
  ).pipe(
    filter(([, [flatPath]]) => !flatPath.match(skipFields)),
    reduce<any, State>((state, [snapshotType, [flatPath, nodeValue]]) => {
      state[flatPath] ??= {}
      state[flatPath][snapshotType] = nodeValue
      return state
    }, {}),
    switchMap((state) => from(Object.entries(state))),
    mergeMap(([flatPath, snapshots]) => {
      const resolutionMarker = resolutions[flatPath]

      const strategy: DivergenceDetectionStrategy =
        typeof resolutionMarker === 'undefined' ? 'sinceFork' : 'sinceResolution'

      // xxx even if upstream has changed, current doc may have been changed to match independently
      // we should probbaly additionally check whether the upstream value is different to the doc's
      // value

      if (strategy === 'sinceFork') {
        if (upstreamAtFork?._rev === upstream._rev) {
          return EMPTY
        }

        // xxx what if new upstream created after fork? probably get earliest existing snapshot
        return from(
          Promise.all([hashData(snapshots.upstreamAtFork), hashData(snapshots.upstream)]),
        ).pipe(
          takeWhile(([hashA, hashB]) => hashA !== hashB),
          map(() => [flatPath, {status: 'unresolved'}]),
        )
      }

      if (strategy === 'sinceResolution') {
        if (upstream._rev === resolutionMarker[0]) {
          return of([flatPath, {status: 'resolved'}])
          //return EMPTY
        }

        return from(hashData(snapshots.upstream)).pipe(
          // takeWhile((hashA) => hashA !== resolutionMarker[1]),
          // map(() => [flatPath, {status: 'unresolved'}]),
          map((hashA) => [
            flatPath,
            {status: hashA === resolutionMarker[1] ? 'resolved' : 'unresolved'},
          ]),
        )
      }

      return EMPTY
    }),
  )

  // this field has no existing resolution markers
  // we will need to check whether the upstream value has changed since version was created
  //
  // - has there been mutation to this node in upstream since version was created?
  // - AND is hash of current upstream value different to hash of current version value?
  //
  // 1. load transanctions for version… when was it created? sadly we can't determine this from the doc itself, as it inherits the base document's timestamps when it's created.
  // 2. load transactions for upstream (potentially *since version was created*. pro: less data, con: creates waterfall). has a mutation occurred at given path since version was created?
  // 3. if upstream has been mutated, is the hash of its value different to the hash of the value at the given path?

  // if there is a resolution marker, we don't need translog.
  // instead, we check:
  //   - is the upstream rev different to the resolution marker's rev?
  //   - AND is the hash of the upstream value different to the resolution marker's rev?
}
