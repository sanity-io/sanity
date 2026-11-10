import {urlFor} from '@sanity/sdk-react/dashboard'
import {getApplicationOrigin} from '@sanity/sdk/_internal'
import {type ValueOf} from '@sanity/sdk/dashboard'
import {type ComponentProps, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map, of} from 'rxjs'

import {useRenderingContextStore} from '../store/datastores'

type ListedApplications = Extract<ValueOf<'applications.list'>, {ok: true}>['value']
type ListedApplication = ListedApplications[number]
type RoutableApplication = Exclude<Extract<ListedApplication, {type: unknown}>, {local: unknown}>

const NO_APPLICATIONS: ListedApplications = []
const NO_APPLICATIONS$ = of(NO_APPLICATIONS)

/**
 * Points links into applications a message bus host lists at the host's route, like the bridge.
 *
 * @internal
 */
export function DashboardLink(props: ComponentProps<'a'>) {
  const {href, children, ref, ...rest} = props
  const connection = useRenderingContextStore().getMessageBusConnection()
  const applicationList = useMemo(() => connection?.subscribe('applications.list'), [connection])
  const applications$ = useMemo(
    () => applicationList?.pipe(map(toApplications)) ?? NO_APPLICATIONS$,
    [applicationList],
  )
  const applications = useObservable(applications$, toApplications(applicationList?.getCurrent()))
  const hostHref = href ? (toHostHref(href, applications) ?? href) : href

  return (
    <a {...rest} ref={ref} href={hostHref}>
      {children}
    </a>
  )
}

function toApplications(result: ValueOf<'applications.list'> | undefined): ListedApplications {
  return result?.ok ? result.value : NO_APPLICATIONS
}

function toHostHref(href: string, applications: ListedApplications): string | undefined {
  const url = parseUrl(href)
  const application = url && findLinkedApplication(url, applications)
  if (!url || !application) return undefined

  const route =
    application.type === 'studio'
      ? urlFor.studios(application.id)
      : urlFor.applications(application.id)
  const pathWithinApplication = url.pathname.slice(basePathOf(application).length)
  return `${route.url()}${pathWithinApplication}${url.search}${url.hash}`
}

// The most specific application when several share a host.
function findLinkedApplication(
  url: URL,
  applications: ListedApplications,
): RoutableApplication | undefined {
  return applications
    .filter(isRoutable)
    .filter(
      (application) =>
        getApplicationOrigin(application) === url.origin &&
        isWithinBasePath(url.pathname, basePathOf(application)),
    )
    .sort((a, b) => basePathOf(b).length - basePathOf(a).length)[0]
}

// Installations and dev servers have no route of their own to link to.
function isRoutable(application: ListedApplication): application is RoutableApplication {
  return 'type' in application && !('local' in application)
}

function basePathOf(application: RoutableApplication): string {
  return application.externalUrl ? new URL(application.externalUrl).pathname.replace(/\/$/, '') : ''
}

function isWithinBasePath(pathname: string, basePath: string): boolean {
  return !basePath || pathname === basePath || pathname.startsWith(`${basePath}/`)
}

// `URL.canParse` is newer than the browsers Studio supports.
function parseUrl(href: string): URL | undefined {
  try {
    return new URL(href)
  } catch {
    return undefined
  }
}
