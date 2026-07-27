import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'

import {EmptyBlock, ErrorBlock, LoadingBlock, queryErrorMessage, SiteHeader} from './components'
import {useQuery} from './loader'
import {LANDING_PAGE_ID, LANDING_PAGE_QUERY, type LandingPageQueryResult} from './queries'
import {Sections} from './Sections'

export function HomePage() {
  const {data, loading, error} = useQuery<LandingPageQueryResult>(LANDING_PAGE_QUERY, {
    id: LANDING_PAGE_ID,
  })

  const page = data?.page
  const latestProducts = data?.latestProducts ?? []

  return (
    <div className="app-shell">
      <SiteHeader />
      <main>
        {loading && <LoadingBlock />}
        {error ? <ErrorBlock message={queryErrorMessage(error)} /> : null}
        {!loading && !error && !page && (
          <EmptyBlock message="No landing page yet — open the Seed coffee shop tool in the studio workspace." />
        )}
        {!loading && !error && page && (
          <div data-sanity={createDataAttribute({id: page._id, type: page._type}).toString()}>
            <Sections page={page} latestProducts={latestProducts} />
          </div>
        )}
      </main>
    </div>
  )
}
