import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {RequestAccessForm, type RequestAccessFormProps} from '../RequestAccessForm'
import {createAccessRequest, createApiError, createClientStub} from './testUtils'

const theme = buildTheme()
const USER_EMAIL = 'rosti@example.com'

function formUi(props: Partial<RequestAccessFormProps> = {}) {
  return (
    <ThemeProvider theme={theme}>
      <RequestAccessForm
        client={props.client ?? createClientStub()}
        resourceId="project-a"
        currentUser={{
          name: 'Rosti',
          email: USER_EMAIL,
          provider: 'google',
        }}
        {...props}
      />
    </ThemeProvider>
  )
}

/**
 * Suspense recovery requires the initial render to happen inside an awaited
 * `act`, otherwise React never attaches the promise ping and the boundary
 * stays stuck on the fallback (same workaround as the studio's
 * RequestAccessScreen tests).
 */
async function renderForm(props: Partial<RequestAccessFormProps> = {}) {
  let result!: ReturnType<typeof render>
  await act(async () => {
    result = render(formUi(props))
  })
  return result
}

const submitRequest = async () => {
  await userEvent.click(await screen.findByRole('button', {name: 'Request access'}))
}

describe('RequestAccessForm', () => {
  it('renders the request form with the account identity when no prior requests exist', async () => {
    await renderForm()

    expect(await screen.findByRole('form', {name: 'Request access'})).toBeInTheDocument()
    expect(screen.getByRole('textbox', {name: 'Message'})).toBeInTheDocument()
    expect(screen.getAllByText(new RegExp(USER_EMAIL)).length).toBeGreaterThan(0)
  })

  it('renders the pending state instead of the form when a recent request exists', async () => {
    const client = createClientStub({
      list: () => Promise.resolve([createAccessRequest()]),
    })
    await renderForm({client})

    expect(
      await screen.findByText('Your request to access this content is pending approval.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  it('renders the declined title, not the failed-send one, when a prior request was denied', async () => {
    const client = createClientStub({
      list: () => Promise.resolve([createAccessRequest({status: 'declined'})]),
    })
    await renderForm({client})

    expect(
      await screen.findByRole('heading', {name: 'Access request declined'}),
    ).toBeInTheDocument()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  it('falls back to the request form when the prefetch fails', async () => {
    const client = createClientStub({
      list: () => Promise.reject(new Error('boom')),
    })
    await renderForm({client})

    expect(await screen.findByRole('form', {name: 'Request access'})).toBeInTheDocument()
  })

  it('renders the sso-enforced state with a sign-in CTA on 403 saml_enforcement_required', async () => {
    const client = createClientStub({
      submit: () =>
        Promise.reject(
          createApiError(403, {
            code: 'saml_enforcement_required',
            message: 'SAML login is required for this organization',
            redirectUrl: 'https://idp.example.com/login',
          }),
        ),
    })
    await renderForm({client})
    await submitRequest()

    expect(await screen.findByRole('alert')).toHaveTextContent(/requires signing in with SSO/)
    expect(screen.getByRole('link', {name: 'Sign in with SSO'})).toHaveAttribute(
      'href',
      'https://idp.example.com/login',
    )
  })

  const ssoEnforced = (redirectUrl?: string) => ({
    eligibility: () =>
      Promise.resolve({
        eligible: false,
        reason: 'saml-enforced',
        ...(redirectUrl && {redirectUrl}),
      }),
  })

  it('offers no form at all when the preflight says the org enforces SSO', async () => {
    const client = createClientStub(ssoEnforced('https://idp.example.com/login'))
    await renderForm({client})

    expect(await screen.findByRole('alert')).toHaveTextContent(/requires signing in with SSO/)
    expect(screen.getByRole('link', {name: 'Sign in with SSO'})).toHaveAttribute(
      'href',
      'https://idp.example.com/login',
    )
    // The whole point of the preflight: no note field, no futile submit.
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', {name: 'Message'})).not.toBeInTheDocument()
  })

  it('names the provider the user is actually signed in with', async () => {
    const client = createClientStub(ssoEnforced())
    await renderForm({client})

    expect(await screen.findByRole('alert')).toHaveTextContent(/signed in with Google/)
  })

  it('omits the CTA when the API resolves no login URL', async () => {
    const client = createClientStub(ssoEnforced())
    await renderForm({client})

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.queryByRole('link', {name: 'Sign in with SSO'})).not.toBeInTheDocument()
  })

  it('shows SSO over a pending request, which an enforced org can never approve', async () => {
    const client = createClientStub({
      ...ssoEnforced(),
      list: () => Promise.resolve([createAccessRequest()]),
    })
    await renderForm({client})

    expect(await screen.findByRole('alert')).toHaveTextContent(/requires signing in with SSO/)
    expect(screen.queryByText(/pending approval/)).not.toBeInTheDocument()
  })

  it('keeps the form when the preflight says eligible', async () => {
    const client = createClientStub({eligibility: () => Promise.resolve({eligible: true})})
    await renderForm({client})

    expect(await screen.findByRole('form', {name: 'Request access'})).toBeInTheDocument()
  })

  it('keeps the form when the preflight fails, leaving the submit gate as the backstop', async () => {
    const client = createClientStub({eligibility: () => Promise.reject(new Error('offline'))})
    await renderForm({client})

    expect(await screen.findByRole('form', {name: 'Request access'})).toBeInTheDocument()
  })

  it('renders the sent state and reports the submission after a successful submit', async () => {
    const onRequestSubmitted = vi.fn()
    const client = createClientStub({
      submit: () => Promise.resolve(createAccessRequest()),
    })
    window.location.hash = '#token=secret'
    await renderForm({client, onRequestSubmitted})
    await userEvent.type(screen.getByRole('textbox', {name: 'Message'}), 'please')
    await submitRequest()

    expect(await screen.findByText('Access request sent')).toBeInTheDocument()
    expect(onRequestSubmitted).toHaveBeenCalledExactlyOnceWith({note: 'please'})
    // The fragment can carry auth tokens and must not reach the API.
    expect(client.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'post',
        body: expect.objectContaining({requestUrl: expect.not.stringContaining('#')}),
      }),
    )
  })

  it('keeps the form up with an inline error when submission fails unexpectedly', async () => {
    const client = createClientStub({
      submit: () => Promise.reject(new Error('network down')),
    })
    await renderForm({client})
    await submitRequest()

    expect(await screen.findByRole('alert')).toHaveTextContent(/problem submitting your request/)
    expect(screen.getByRole('form', {name: 'Request access'})).toBeInTheDocument()
  })

  it('lets renderAction vary the action per view', async () => {
    const client = createClientStub({
      submit: () => Promise.resolve(createAccessRequest()),
    })
    await renderForm({
      client,
      renderAction: ({view}) => (view === 'sent' ? <a href="/orgs">View organizations</a> : null),
    })

    expect(await screen.findByRole('form', {name: 'Request access'})).toBeInTheDocument()
    expect(screen.queryByRole('link', {name: 'View organizations'})).not.toBeInTheDocument()

    await submitRequest()
    expect(await screen.findByRole('link', {name: 'View organizations'})).toBeInTheDocument()
  })

  it('renders the sign-out action only when onSignOut is provided', async () => {
    const onSignOut = vi.fn()
    const {rerender} = await renderForm({onSignOut})

    await userEvent.click(await screen.findByRole('button', {name: /Sign out/}))
    expect(onSignOut).toHaveBeenCalledTimes(1)

    rerender(formUi({onSignOut: undefined}))
    expect(screen.queryByRole('button', {name: /Sign out/})).not.toBeInTheDocument()
  })
})
