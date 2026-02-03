import {type ClientPerspective} from '@sanity/client'
import {type PreviewSnapshot} from '@sanity/presentation-comlink'
import {type FC, memo, useEffect, useMemo, useRef} from 'react'
import {
  combineLatest,
  debounceTime,
  filter,
  map,
  merge,
  NEVER,
  share,
  skipWhile,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs'
import {
  getDraftId,
  getPublishedId,
  type PreviewValue,
  useDocumentPreviewStore,
  useSchema,
} from 'sanity'

import {type VisualEditingConnection} from '../types'

type Ref = {
  _id: string
  _type: string
}

export interface PostMessagePreviewsProps {
  comlink: VisualEditingConnection
  perspective: ClientPerspective
  refs: Ref[]
}

const PostMessagePreviews: FC<PostMessagePreviewsProps> = (props) => {
  const {comlink, refs, perspective} = props
  const documentPreviewStore = useDocumentPreviewStore()
  const schema = useSchema()

  const refsSubject = useMemo(() => new Subject<Ref[]>(), [])

  const previews$ = useMemo(() => {
    return refsSubject.asObservable().pipe(
      switchMap(
        (
          // eslint-disable-next-line @typescript-eslint/no-shadow
          refs,
        ) => {
          return combineLatest(
            refs.map((ref) => {
              const draftRef = {...ref, _id: getDraftId(ref._id)}
              const draft$ =
                perspective === 'published'
                  ? // Don't emit if not displaying drafts
                    NEVER
                  : documentPreviewStore
                      .observeForPreview(draftRef, schema.get(draftRef._type)!)
                      .pipe(
                        // Share to prevent double subscribe in the merge
                        share(),
                        // Don't emit if no snapshot is returned
                        // eslint-disable-next-line max-nested-callbacks
                        skipWhile((p) => p.snapshot === null),
                      )

              const publishedRef = {...ref, _id: getPublishedId(ref._id)}
              const published$ = documentPreviewStore.observeForPreview(
                publishedRef,
                schema.get(publishedRef._type)!,
              )

              return merge(published$.pipe(takeUntil(draft$)), draft$).pipe(
                // eslint-disable-next-line max-nested-callbacks
                filter((p) => !!p.snapshot),
                // eslint-disable-next-line max-nested-callbacks
                map((p) => {
                  const snapshot = p.snapshot as PreviewValue & {
                    _id: string
                  }
                  return {
                    _id: getPublishedId(snapshot._id),
                    title: snapshot.title,
                    subtitle: snapshot.subtitle,
                    description: snapshot.description,
                    imageUrl: snapshot.imageUrl,
                  } as PreviewSnapshot
                }),
              )
            }),
          )
        },
      ),
      debounceTime(0),
    )
  }, [documentPreviewStore, refsSubject, schema, perspective])

  const lastSnapshots = useRef<PreviewSnapshot[]>([])

  // Stream preview snapshots when updates are received, and store the last set
  // of snapshots so they can be returned if explicitly requested
  useEffect(() => {
    const sub = previews$.subscribe((snapshots) => {
      comlink.post('presentation/preview-snapshots', {snapshots})
      lastSnapshots.current = snapshots
    })

    return () => {
      sub.unsubscribe()
    }
  }, [comlink, previews$])

  // Respond to explict requests for preview snapshots. Streaming will not
  // always suffice as the previews$ subscriber will not be called if the app
  // reloads but Presentation does not.
  useEffect(() => {
    return comlink.on('visual-editing/preview-snapshots', () => ({
      snapshots: lastSnapshots.current,
    }))
  }, [comlink])

  useEffect(() => {
    refsSubject.next(refs)
  }, [refs, refsSubject])

  return null
}

export default memo(PostMessagePreviews)
