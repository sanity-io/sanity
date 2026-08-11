import {LaunchIcon} from '@sanity/icons/Launch'
import {Avatar, Box, Button, Card, Flex, Spinner, Stack, Text, TextArea} from '@sanity/ui'
import {Suspense, use, useId, useState, useTransition} from 'react'
import {c} from 'react/compiler-runtime'
import {Fragment, jsx, jsxs} from 'react/jsx-runtime'
/**
 * The Access API only accepts notes up to this length.
 *
 * @public
 */
const MAX_ACCESS_REQUEST_NOTE_LENGTH = 150
function withAccessApiVersion(client) {
  return client.withConfig({apiVersion: '2024-07-01'})
}
/**
 * Fetches the caller's own access requests across all resources
 * (`GET /access/requests/me`).
 *
 * @public
 */
async function listMyAccessRequests(client) {
  return (
    (await withAccessApiVersion(client).request({
      url: '/access/requests/me',
      tag: 'access-ui.list-requests',
    })) ?? []
  )
}
function getErrorResponseDetails(err) {
  if (typeof err != 'object' || !err) return {}
  let response = err.response
  if (typeof response != 'object' || !response) return {}
  let {statusCode} = response,
    body = response.body,
    details = {statusCode: typeof statusCode == 'number' ? statusCode : void 0}
  if (typeof body == 'object' && body) {
    let {message, code, redirectUrl} = body
    ;((details.message = typeof message == 'string' ? message : void 0),
      (details.code = typeof code == 'string' ? code : void 0),
      (details.redirectUrl = typeof redirectUrl == 'string' ? redirectUrl : void 0))
  }
  return details
}
function mapSubmitError(err) {
  let {statusCode, message, code, redirectUrl} = getErrorResponseDetails(err)
  return statusCode === 403 && code === 'saml_enforcement_required'
    ? {
        type: 'sso-enforced',
        redirectUrl,
        message,
      }
    : statusCode === 429
      ? {
          type: 'over-limit',
          message,
        }
      : statusCode === 409
        ? message?.includes('email domain')
          ? {
              type: 'email-domain-blocked',
              message,
            }
          : message?.includes('disabled for organization')
            ? {
                type: 'requests-disabled',
                message,
              }
            : {
                type: 'denied',
                message: message?.replace(/^Conflict -\s*/, ''),
              }
        : {
            type: 'error',
            error: err,
          }
}
/**
 * Submits an access request (`POST /access/{resourceType}/{resourceId}/requests`)
 * and maps the Access API's error contract to a {@link SubmitAccessRequestResult}.
 * Never throws for API rejections; unexpected failures come back as
 * `{type: 'error'}` so callers decide how to surface them.
 *
 * @public
 */
async function submitAccessRequest(options) {
  let {client, resourceType, resourceId, note, requestUrl} = options
  try {
    return {
      type: 'submitted',
      request: await withAccessApiVersion(client).request({
        url: `/access/${resourceType}/${resourceId}/requests`,
        method: 'post',
        tag: 'access-ui.submit-request',
        body: {
          note,
          requestUrl,
          type: 'access',
        },
      }),
    }
  } catch (err) {
    return mapSubmitError(err)
  }
}
/**
 * Derives where the caller stands on requesting access to a resource from
 * their existing access requests.
 *
 * A declined request blocks re-requesting for two weeks. A pending request
 * younger than two weeks is in review; older pending requests count as
 * expired, and the caller may request again.
 *
 * @public
 */
function deriveAccessRequestState(requests, resourceId, now = Date.now()) {
  if (!requests || requests.length === 0) return 'none'
  let isRecent = (request) => now - new Date(request.createdAt).getTime() < 12096e5,
    forResource = requests.filter((request) => request.resourceId === resourceId)
  return forResource.some((request) => request.status === 'declined' && isRecent(request))
    ? 'denied'
    : forResource.some((request) => request.status === 'pending' && isRecent(request))
      ? 'pending'
      : forResource.some((request) => request.status === 'pending')
        ? 'expired'
        : 'none'
}
/**
 * Human-readable title for a login provider id, e.g. `google` → `Google`,
 * `saml-xyz` → `SAML/SSO`.
 *
 * @public
 */
function getProviderTitle(provider) {
  if (provider === 'google') return 'Google'
  if (provider === 'github') return 'GitHub'
  if (provider === 'sanity') return 'Sanity'
  if (provider === 'vercel') return 'Vercel'
  if (provider?.startsWith('saml-')) return 'SAML/SSO'
}
/** @internal */
const defaultLabels = {
  title: 'Request access',
  sentTitle: 'Access request sent',
  errorTitle: 'Access request couldn’t be sent',
  describeNoAccess: ({email}) =>
    email
      ? /* @__PURE__ */ jsxs(Fragment, {
          children: [
            'Your account ',
            /* @__PURE__ */ jsxs('strong', {children: ['(', email, ')']}),
            ' doesn’t have access to this content.',
          ],
        })
      : /* @__PURE__ */ jsx(Fragment, {
          children: 'Your account doesn’t have access to this content.',
        }),
  promptProject: 'Send a request to the project admin(s).',
  promptOrganization: 'Send a request to the organization admin(s).',
  notePlaceholder: 'Message (optional)',
  noteAriaLabel: 'Message',
  submit: 'Request access',
  submitted: 'Request sent',
  sentDescription:
    'Your request has been sent. You will receive a notification if access is approved.',
  pendingMessage: 'Your request to access this content is pending approval.',
  deniedMessage: ({message}) => message ?? 'Your request to access this content has been declined.',
  overLimitMessage: ({message}) =>
    message ??
    'You’ve reached the limit for access requests across all projects. Please wait before submitting more requests, or contact an admin.',
  expiredMessage: 'Your previous request has expired. You may request access again below.',
  ssoEnforcedMessage: ({providerTitle}) =>
    providerTitle
      ? /* @__PURE__ */ jsxs(Fragment, {
          children: [
            'You’re signed in with ',
            /* @__PURE__ */ jsx('strong', {children: providerTitle}),
            ', but this organization requires signing in with SSO. Access can’t be requested with this account.',
          ],
        })
      : /* @__PURE__ */ jsx(Fragment, {
          children:
            'This organization requires signing in with SSO. Access can’t be requested with this account.',
        }),
  ssoSignInCta: 'Sign in with SSO',
  submitFailedMessage: 'There was a problem submitting your request. Please try again.',
  wrongAccount: 'Wrong account?',
  signOut: 'Sign out',
}
/**
 * The shared request-access screen: explains that the signed-in account lacks
 * access, lets the user request it with an optional note, and reflects the
 * request lifecycle (pending, denied, expired, over-limit, SSO-enforced).
 *
 * Fetches the caller's existing requests on mount and suspends while loading;
 * an internal `Suspense` boundary renders a spinner, so hosts can mount it
 * directly. Remount with a `key` when `client` or `resourceId` change.
 *
 * @public
 */
function RequestAccessForm(props) {
  let $ = c(6),
    {client} = props,
    t0
  $[0] === client
    ? (t0 = $[1])
    : ((t0 = () => listMyAccessRequests(client).catch(_temp)), ($[0] = client), ($[1] = t0))
  let [requestsPromise] = useState(t0),
    t1
  $[2] === Symbol.for('react.memo_cache_sentinel')
    ? ((t1 = /* @__PURE__ */ jsx(Flex, {
        align: 'center',
        height: 'fill',
        justify: 'center',
        padding: 5,
        children: /* @__PURE__ */ jsx(Spinner, {muted: !0}),
      })),
      ($[2] = t1))
    : (t1 = $[2])
  let t2
  return (
    $[3] !== props || $[4] !== requestsPromise
      ? ((t2 = /* @__PURE__ */ jsx(Card, {
          border: !0,
          height: 'fill',
          overflow: 'hidden',
          radius: 3,
          tone: 'default',
          children: /* @__PURE__ */ jsx(Suspense, {
            fallback: t1,
            children: /* @__PURE__ */ jsx(RequestAccessFormContent, {
              ...props,
              requestsPromise,
            }),
          }),
        })),
        ($[3] = props),
        ($[4] = requestsPromise),
        ($[5] = t2))
      : (t2 = $[5]),
    t2
  )
}
function _temp() {
  return null
}
function deriveViewState(options) {
  let {fetchedRequests, resourceId, submitResult, labels} = options
  if (submitResult)
    switch (submitResult.type) {
      case 'submitted':
        return {view: 'sent'}
      case 'sso-enforced':
        return {
          view: 'sso-enforced',
          redirectUrl: submitResult.redirectUrl,
        }
      case 'denied':
        return {
          view: 'blocked',
          message: labels.deniedMessage({message: submitResult.message}),
        }
      case 'over-limit':
        return {
          view: 'blocked',
          message: labels.overLimitMessage({message: submitResult.message}),
        }
      case 'email-domain-blocked':
      case 'requests-disabled':
        return {
          view: 'blocked',
          message: submitResult.message,
        }
    }
  let state = deriveAccessRequestState(fetchedRequests, resourceId)
  return state === 'pending'
    ? {view: 'pending'}
    : state === 'denied'
      ? {
          view: 'blocked',
          message: labels.deniedMessage({}),
        }
      : {
          view: 'form',
          expired: state === 'expired',
        }
}
function RequestAccessFormContent(props) {
  let $ = c(116),
    {
      client,
      resourceType: t0,
      resourceId,
      currentUser,
      onSignOut,
      onRequestSubmitted,
      preview,
      requestsPromise,
    } = props,
    resourceType = t0 === void 0 ? 'project' : t0,
    t1
  $[0] === props.labels
    ? (t1 = $[1])
    : ((t1 = {
        ...defaultLabels,
        ...props.labels,
      }),
      ($[0] = props.labels),
      ($[1] = t1))
  let labels = t1,
    fetchedRequests = use(requestsPromise),
    titleId = useId(),
    [note, setNote] = useState(''),
    [submitResult, setSubmitResult] = useState(null),
    [isSubmitting, startSubmit] = useTransition(),
    t2
  $[2] !== fetchedRequests || $[3] !== labels || $[4] !== resourceId || $[5] !== submitResult
    ? ((t2 = deriveViewState({
        fetchedRequests,
        resourceId,
        submitResult,
        labels,
      })),
      ($[2] = fetchedRequests),
      ($[3] = labels),
      ($[4] = resourceId),
      ($[5] = submitResult),
      ($[6] = t2))
    : (t2 = $[6])
  let state = t2,
    T0,
    T1,
    handleSubmit,
    providerTitle,
    submitFailed,
    t10,
    t11,
    t12,
    t13,
    t3,
    t4,
    t5,
    t6,
    t7,
    t8,
    t9
  if (
    $[7] !== client ||
    $[8] !== currentUser?.email ||
    $[9] !== currentUser?.provider ||
    $[10] !== isSubmitting ||
    $[11] !== labels ||
    $[12] !== note ||
    $[13] !== onRequestSubmitted ||
    $[14] !== preview ||
    $[15] !== resourceId ||
    $[16] !== resourceType ||
    $[17] !== state.message ||
    $[18] !== state.redirectUrl ||
    $[19] !== state.view ||
    $[20] !== submitResult?.type ||
    $[21] !== titleId
  ) {
    ;((providerTitle = getProviderTitle(currentUser?.provider)),
      (submitFailed = submitResult?.type === 'error'))
    let t14 = labels.title,
      t15
    $[38] !== currentUser?.email || $[39] !== labels
      ? ((t15 = labels.describeNoAccess({email: currentUser?.email})),
        ($[38] = currentUser?.email),
        ($[39] = labels),
        ($[40] = t15))
      : (t15 = $[40])
    let t16
    $[41] !== labels.title || $[42] !== t15
      ? ((t16 = {
          title: t14,
          description: t15,
        }),
        ($[41] = labels.title),
        ($[42] = t15),
        ($[43] = t16))
      : (t16 = $[43])
    let t17
    $[44] !== labels.sentDescription || $[45] !== labels.sentTitle
      ? ((t17 = {
          title: labels.sentTitle,
          description: labels.sentDescription,
        }),
        ($[44] = labels.sentDescription),
        ($[45] = labels.sentTitle),
        ($[46] = t17))
      : (t17 = $[46])
    let t18
    $[47] !== labels.pendingMessage || $[48] !== labels.sentTitle
      ? ((t18 = {
          title: labels.sentTitle,
          description: labels.pendingMessage,
        }),
        ($[47] = labels.pendingMessage),
        ($[48] = labels.sentTitle),
        ($[49] = t18))
      : (t18 = $[49])
    let t19, t20
    $[50] === labels.errorTitle
      ? ((t19 = $[51]), (t20 = $[52]))
      : ((t19 = {
          title: labels.errorTitle,
          description: null,
        }),
        (t20 = {
          title: labels.errorTitle,
          description: null,
        }),
        ($[50] = labels.errorTitle),
        ($[51] = t19),
        ($[52] = t20))
    let t21
    $[53] !== t16 || $[54] !== t17 || $[55] !== t18 || $[56] !== t19 || $[57] !== t20
      ? ((t21 = {
          'form': t16,
          'sent': t17,
          'pending': t18,
          'blocked': t19,
          'sso-enforced': t20,
        }),
        ($[53] = t16),
        ($[54] = t17),
        ($[55] = t18),
        ($[56] = t19),
        ($[57] = t20),
        ($[58] = t21))
      : (t21 = $[58])
    let {title, description} = t21[state.view],
      t22
    ;($[59] !== client ||
    $[60] !== isSubmitting ||
    $[61] !== note ||
    $[62] !== onRequestSubmitted ||
    $[63] !== resourceId ||
    $[64] !== resourceType
      ? ((t22 = (event) => {
          ;(event.preventDefault(),
            !isSubmitting &&
              startSubmit(async () => {
                let result = await submitAccessRequest({
                  client,
                  resourceType,
                  resourceId,
                  note: note.trim() || void 0,
                  requestUrl: typeof window > 'u' ? void 0 : window.location.href,
                })
                ;(setSubmitResult(result), result.type === 'submitted' && onRequestSubmitted?.())
              }))
        }),
        ($[59] = client),
        ($[60] = isSubmitting),
        ($[61] = note),
        ($[62] = onRequestSubmitted),
        ($[63] = resourceId),
        ($[64] = resourceType),
        ($[65] = t22))
      : (t22 = $[65]),
      (handleSubmit = t22),
      (T1 = Flex),
      (t12 = 'column'),
      (t13 = 'fill'),
      (T0 = Flex),
      (t3 = 'column'),
      (t4 = 1),
      (t5 = 4),
      (t6 = 4),
      $[66] === preview
        ? (t7 = $[67])
        : ((t7 = preview
            ? /* @__PURE__ */ jsx(Flex, {
                justify: 'center',
                padding: 2,
                children: preview,
              })
            : null),
          ($[66] = preview),
          ($[67] = t7)),
      $[68] !== title || $[69] !== titleId
        ? ((t8 = /* @__PURE__ */ jsx(Text, {
            as: 'h1',
            id: titleId,
            size: 2,
            weight: 'semibold',
            children: title,
          })),
          ($[68] = title),
          ($[69] = titleId),
          ($[70] = t8))
        : (t8 = $[70]),
      $[71] === description
        ? (t9 = $[72])
        : ((t9 =
            description === null
              ? null
              : /* @__PURE__ */ jsx(Text, {
                  as: 'p',
                  muted: !0,
                  size: 1,
                  children: description,
                })),
          ($[71] = description),
          ($[72] = t9)),
      $[73] !== state.message || $[74] !== state.view
        ? ((t10 =
            state.view === 'blocked'
              ? /* @__PURE__ */ jsx(Card, {
                  border: !0,
                  padding: 3,
                  radius: 2,
                  role: 'alert',
                  tone: 'caution',
                  children: /* @__PURE__ */ jsx(Text, {
                    as: 'p',
                    muted: !0,
                    size: 1,
                    children: state.message,
                  }),
                })
              : null),
          ($[73] = state.message),
          ($[74] = state.view),
          ($[75] = t10))
        : (t10 = $[75]),
      (t11 =
        state.view === 'sso-enforced'
          ? /* @__PURE__ */ jsxs(Stack, {
              gap: 4,
              children: [
                /* @__PURE__ */ jsx(Card, {
                  border: !0,
                  padding: 3,
                  radius: 2,
                  role: 'alert',
                  tone: 'caution',
                  children: /* @__PURE__ */ jsx(Text, {
                    as: 'p',
                    muted: !0,
                    size: 1,
                    children: labels.ssoEnforcedMessage({providerTitle}),
                  }),
                }),
                state.redirectUrl
                  ? /* @__PURE__ */ jsx(Button, {
                      as: 'a',
                      href: state.redirectUrl,
                      iconRight: LaunchIcon,
                      mode: 'ghost',
                      text: labels.ssoSignInCta,
                      width: 'fill',
                    })
                  : null,
              ],
            })
          : null),
      ($[7] = client),
      ($[8] = currentUser?.email),
      ($[9] = currentUser?.provider),
      ($[10] = isSubmitting),
      ($[11] = labels),
      ($[12] = note),
      ($[13] = onRequestSubmitted),
      ($[14] = preview),
      ($[15] = resourceId),
      ($[16] = resourceType),
      ($[17] = state.message),
      ($[18] = state.redirectUrl),
      ($[19] = state.view),
      ($[20] = submitResult?.type),
      ($[21] = titleId),
      ($[22] = T0),
      ($[23] = T1),
      ($[24] = handleSubmit),
      ($[25] = providerTitle),
      ($[26] = submitFailed),
      ($[27] = t10),
      ($[28] = t11),
      ($[29] = t12),
      ($[30] = t13),
      ($[31] = t3),
      ($[32] = t4),
      ($[33] = t5),
      ($[34] = t6),
      ($[35] = t7),
      ($[36] = t8),
      ($[37] = t9))
  } else
    ((T0 = $[22]),
      (T1 = $[23]),
      (handleSubmit = $[24]),
      (providerTitle = $[25]),
      (submitFailed = $[26]),
      (t10 = $[27]),
      (t11 = $[28]),
      (t12 = $[29]),
      (t13 = $[30]),
      (t3 = $[31]),
      (t4 = $[32]),
      (t5 = $[33]),
      (t6 = $[34]),
      (t7 = $[35]),
      (t8 = $[36]),
      (t9 = $[37]))
  let t14
  $[76] !== handleSubmit ||
  $[77] !== isSubmitting ||
  $[78] !== labels.expiredMessage ||
  $[79] !== labels.noteAriaLabel ||
  $[80] !== labels.notePlaceholder ||
  $[81] !== labels.promptOrganization ||
  $[82] !== labels.promptProject ||
  $[83] !== labels.submit ||
  $[84] !== labels.submitFailedMessage ||
  $[85] !== note ||
  $[86] !== resourceType ||
  $[87] !== state.expired ||
  $[88] !== state.view ||
  $[89] !== submitFailed ||
  $[90] !== titleId
    ? ((t14 =
        state.view === 'form'
          ? /* @__PURE__ */ jsxs(Stack, {
              'as': 'form',
              'aria-labelledby': titleId,
              'onSubmit': handleSubmit,
              'gap': 4,
              'children': [
                /* @__PURE__ */ jsx(Text, {
                  as: 'p',
                  size: 1,
                  children: state.expired
                    ? labels.expiredMessage
                    : resourceType === 'organization'
                      ? labels.promptOrganization
                      : labels.promptProject,
                }),
                /* @__PURE__ */ jsxs(Stack, {
                  gap: 2,
                  children: [
                    /* @__PURE__ */ jsx(TextArea, {
                      'aria-label': labels.noteAriaLabel,
                      'disabled': isSubmitting,
                      'fontSize': 1,
                      'maxLength': 150,
                      'onChange': (event_0) => setNote(event_0.currentTarget.value),
                      'placeholder': labels.notePlaceholder,
                      'rows': 3,
                      'value': note,
                    }),
                    /* @__PURE__ */ jsx(Text, {
                      align: 'right',
                      muted: !0,
                      size: 0,
                      children: `${note.length}/150`,
                    }),
                  ],
                }),
                submitFailed
                  ? /* @__PURE__ */ jsx(Card, {
                      border: !0,
                      padding: 3,
                      radius: 2,
                      role: 'alert',
                      tone: 'critical',
                      children: /* @__PURE__ */ jsx(Text, {
                        as: 'p',
                        muted: !0,
                        size: 1,
                        children: labels.submitFailedMessage,
                      }),
                    })
                  : null,
                /* @__PURE__ */ jsx(Button, {
                  disabled: isSubmitting,
                  loading: isSubmitting,
                  text: labels.submit,
                  type: 'submit',
                  width: 'fill',
                }),
              ],
            })
          : null),
      ($[76] = handleSubmit),
      ($[77] = isSubmitting),
      ($[78] = labels.expiredMessage),
      ($[79] = labels.noteAriaLabel),
      ($[80] = labels.notePlaceholder),
      ($[81] = labels.promptOrganization),
      ($[82] = labels.promptProject),
      ($[83] = labels.submit),
      ($[84] = labels.submitFailedMessage),
      ($[85] = note),
      ($[86] = resourceType),
      ($[87] = state.expired),
      ($[88] = state.view),
      ($[89] = submitFailed),
      ($[90] = titleId),
      ($[91] = t14))
    : (t14 = $[91])
  let t15
  $[92] !== T0 ||
  $[93] !== t10 ||
  $[94] !== t11 ||
  $[95] !== t14 ||
  $[96] !== t3 ||
  $[97] !== t4 ||
  $[98] !== t5 ||
  $[99] !== t6 ||
  $[100] !== t7 ||
  $[101] !== t8 ||
  $[102] !== t9
    ? ((t15 = /* @__PURE__ */ jsxs(T0, {
        direction: t3,
        flex: t4,
        gap: t5,
        padding: t6,
        children: [t7, t8, t9, t10, t11, t14],
      })),
      ($[92] = T0),
      ($[93] = t10),
      ($[94] = t11),
      ($[95] = t14),
      ($[96] = t3),
      ($[97] = t4),
      ($[98] = t5),
      ($[99] = t6),
      ($[100] = t7),
      ($[101] = t8),
      ($[102] = t9),
      ($[103] = t15))
    : (t15 = $[103])
  let t16
  $[104] !== currentUser ||
  $[105] !== labels.signOut ||
  $[106] !== labels.wrongAccount ||
  $[107] !== onSignOut ||
  $[108] !== providerTitle
    ? ((t16 = currentUser
        ? /* @__PURE__ */ jsx(Card, {
            borderTop: !0,
            padding: 3,
            children: /* @__PURE__ */ jsxs(Flex, {
              align: 'center',
              direction: 'column',
              gap: 3,
              children: [
                /* @__PURE__ */ jsxs(Flex, {
                  align: 'center',
                  gap: 2,
                  justify: 'center',
                  children: [
                    /* @__PURE__ */ jsx(Avatar, {
                      initials: getInitials(currentUser),
                      size: 0,
                      src: currentUser.profileImage,
                    }),
                    /* @__PURE__ */ jsx(Box, {
                      children: /* @__PURE__ */ jsxs(Text, {
                        muted: !0,
                        size: 1,
                        textOverflow: 'ellipsis',
                        children: [
                          currentUser.email ?? currentUser.name,
                          providerTitle ? ` · ${providerTitle}` : '',
                        ],
                      }),
                    }),
                  ],
                }),
                onSignOut
                  ? /* @__PURE__ */ jsx(Button, {
                      fontSize: 0,
                      mode: 'bleed',
                      onClick: onSignOut,
                      padding: 2,
                      textWeight: 'regular',
                      children: /* @__PURE__ */ jsxs(Text, {
                        muted: !0,
                        size: 1,
                        children: [
                          labels.wrongAccount,
                          ' ',
                          /* @__PURE__ */ jsx('strong', {children: labels.signOut}),
                        ],
                      }),
                    })
                  : null,
              ],
            }),
          })
        : null),
      ($[104] = currentUser),
      ($[105] = labels.signOut),
      ($[106] = labels.wrongAccount),
      ($[107] = onSignOut),
      ($[108] = providerTitle),
      ($[109] = t16))
    : (t16 = $[109])
  let t17
  return (
    $[110] !== T1 || $[111] !== t12 || $[112] !== t13 || $[113] !== t15 || $[114] !== t16
      ? ((t17 = /* @__PURE__ */ jsxs(T1, {
          direction: t12,
          height: t13,
          children: [t15, t16],
        })),
        ($[110] = T1),
        ($[111] = t12),
        ($[112] = t13),
        ($[113] = t15),
        ($[114] = t16),
        ($[115] = t17))
      : (t17 = $[115]),
    t17
  )
}
function getInitials(user) {
  let source = user.name ?? user.email
  if (!source) return
  let initials = source
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
  return initials ? initials.toUpperCase() : void 0
}
export {
  MAX_ACCESS_REQUEST_NOTE_LENGTH,
  RequestAccessForm,
  deriveAccessRequestState,
  getProviderTitle,
  listMyAccessRequests,
  submitAccessRequest,
}

//# sourceMappingURL=index.js.map
