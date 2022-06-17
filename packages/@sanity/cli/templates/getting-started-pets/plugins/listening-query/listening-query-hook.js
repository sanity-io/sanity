import { useEffect, useState, useRef, useMemo } from "react";
import documentStore from "part:@sanity/base/datastore/document";
import { catchError, distinctUntilChanged } from "rxjs/operators";
import isEqual from "react-fast-compare";

const DEFAULT_PARAMS = {};
const DEFAULT_OPTIONS = { apiVersion: `v2022-05-09` };

/**
 * Sets up a listening query for the provided query.
 *
 * Any time the query result changes because the underlying data is updated,
 * a new data value will be returned.
 *
 * ### Important
 *
 * query, param and options MUST be stable objects for the listener to stay open.
 * If any of these change, the current listener will be unsubscribed and a new one created.
 *
 * Make sure that query, param and options are stable by passing them through useMemo,
 * or define them globally outside a React component.
 *
 * @param query GROQ query
 * @param params GROQ params
 * @param options options to send to documentStore.listenQuery
 * @returns {{data: unknown, loading: boolean, error: boolean}}
 */
export function useListeningQuery(
  query,
  params = DEFAULT_PARAMS,
  options = DEFAULT_OPTIONS
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState(null);
  const subscription = useRef(null);

  useEffect(() => {
    if (query) {
      subscription.current = documentStore
        .listenQuery(query, params, options)
        .pipe(
          distinctUntilChanged(isEqual),
          catchError((err) => {
            console.error(err);
            setError(err);
            setLoading(false);
            setData(null);

            return err;
          })
        )
        .subscribe((documents) => {
          setData((current) =>
            isEqual(current, documents) ? current : documents
          );
          setLoading(false);
          setError(false);
        });
    }

    return () => {
      return subscription.current
        ? subscription.current.unsubscribe()
        : undefined;
    };
  }, [query, params, options]);

  return { loading, error, data };
}

/**
 * Need to make a pair of id returned as a stable referencable objects, otherwise listener will be remade
 */
export function useIdPair(id) {
  const publishedId = useMemo(() => id?.replace("drafts.", ""), [id]);
  return useMemo(
    () => ({
      draftId: publishedId ? `drafts.${publishedId}` : undefined,
      id: publishedId,
    }),
    [publishedId]
  );
}
