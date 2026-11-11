//! Authentication, compatible with the JS studio's: the same token storage key and format, so
//! signing in to either studio signs in to both, plus `token` / `sid` in the URL hash or query.

use leptos::prelude::*;
use leptos::task::spawn_local;
use sanity_client::Client;
use sanity_ui::prelude::*;
use serde_json::{Value, json};

use crate::config::TOKEN_KEY;
use crate::util::{storage_get, storage_remove, storage_set};

#[derive(Clone, Debug, PartialEq)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: Option<String>,
    pub image: Option<String>,
}

impl User {
    pub fn from_json(value: &Value) -> Option<User> {
        let text = |key: &str| value.get(key).and_then(Value::as_str).map(str::to_owned);
        Some(User {
            id: text("id")?,
            name: text("name").unwrap_or_else(|| "Unknown user".into()),
            email: text("email"),
            image: text("profileImage"),
        })
    }

    /// The first letters of the first and last names, like the JS studio's `UserAvatar`, which
    /// drops everything but letters and whitespace first.
    pub fn initials(&self) -> String {
        let letters: String = self.name.chars().filter(|c| c.is_alphabetic() || c.is_whitespace()).collect();
        let names: Vec<&str> = letters.split_whitespace().collect();
        let first = names.first().and_then(|name| name.chars().next());
        let last = names.get(1..).and_then(<[&str]>::last).and_then(|name| name.chars().next());
        first.into_iter().chain(last).collect::<String>().to_uppercase()
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct Provider {
    pub name: String,
    pub title: String,
    pub url: String,
}

#[derive(Clone, Debug, PartialEq)]
pub enum AuthState {
    Checking,
    LoggedOut {
        providers: Vec<Provider>,
        login_urls: Vec<String>,
    },
    LoggedIn(User),
    /// Signed in, but without a role on the project, like the JS studio's request access screen.
    Unauthorized(User),
    Failed(String),
}

impl AuthState {
    fn signed_in(user: &Value) -> Option<AuthState> {
        let has_role = user.get("roles").and_then(Value::as_array).is_some_and(|roles| !roles.is_empty());
        let user = User::from_json(user)?;
        Some(if has_role { AuthState::LoggedIn(user) } else { AuthState::Unauthorized(user) })
    }
}

fn stored_token() -> Option<String> {
    let raw = storage_get(TOKEN_KEY)?;
    match serde_json::from_str::<Value>(&raw) {
        Ok(value) => value.get("token").and_then(Value::as_str).map(str::to_owned),
        Err(_) => Some(raw),
    }
}

fn store_token(token: &str) {
    storage_set(TOKEN_KEY, &json!({"token": token, "time": sanity_client::now_iso()}).to_string());
}

/// URL parameters that carry credentials. A login callback hands over `#sid=`, or `?sid=&url=`
/// when the login was started with `type=token`.
const CREDENTIAL_PARAMS: [&str; 3] = ["sid", "token", "url"];

fn url_params(part: Result<String, wasm_bindgen::JsValue>) -> Option<web_sys::UrlSearchParams> {
    web_sys::UrlSearchParams::new_with_str(part.ok()?.trim_start_matches(['#', '?'])).ok()
}

/// Removes the credentials from the URL so they do not end up in history or screenshots.
fn strip_credentials() {
    let location = window().location();
    let without_credentials = |part: Result<String, wasm_bindgen::JsValue>, prefix: &str| {
        let Some(params) = url_params(part) else { return String::new() };
        for name in CREDENTIAL_PARAMS {
            params.delete(name);
        }
        let rest = String::from(params.to_string());
        if rest.is_empty() { rest } else { format!("{prefix}{rest}") }
    };
    let url = format!(
        "{}{}{}",
        location.pathname().unwrap_or_default(),
        without_credentials(location.search(), "?"),
        without_credentials(location.hash(), "#"),
    );
    let _ = window()
        .history()
        .and_then(|history| history.replace_state_with_url(&wasm_bindgen::JsValue::NULL, "", Some(&url)));
}

fn credential(name: &str) -> Option<String> {
    let location = window().location();
    [location.hash(), location.search()]
        .into_iter()
        .filter_map(url_params)
        .find_map(|params| params.get(name).filter(|value| !value.is_empty()))
}

/// Resolves the session and returns the client to use for it: with a bearer token, or with the
/// session cookie when there is no token but the cookie is valid.
pub async fn authenticate(base: &Client) -> (Client, AuthState) {
    if let Some(token) = credential("token") {
        store_token(&token);
        strip_credentials();
    } else if let Some(sid) = credential("sid") {
        strip_credentials();
        match base.exchange_session_id(&sid).await {
            Ok(token) => store_token(&token),
            Err(err) => return (base.clone(), AuthState::Failed(format!("Could not complete the login: {err}"))),
        }
    }

    if let Some(token) = stored_token() {
        let client = base.with_token(Some(token));
        match client.current_user().await {
            Ok(Some(user)) => {
                if let Some(state) = AuthState::signed_in(&user) {
                    return (client, state);
                }
            }
            Ok(None) => storage_remove(TOKEN_KEY),
            Err(err) if err.is_unauthorized() => storage_remove(TOKEN_KEY),
            Err(err) => return (client, AuthState::Failed(err.to_string())),
        }
    }

    let cookie = base.with_token(None);
    if let Ok(Some(user)) = cookie.current_user().await
        && let Some(state) = AuthState::signed_in(&user)
    {
        return (cookie, state);
    }

    let providers: Vec<Provider> = match base.auth_providers().await {
        Ok(value) => value
            .get("providers")
            .and_then(Value::as_array)
            .map(|providers| {
                providers
                    .iter()
                    .filter_map(|provider| {
                        let text = |key: &str| provider.get(key).and_then(Value::as_str).map(str::to_owned);
                        Some(Provider { name: text("name")?, title: text("title")?, url: text("url")? })
                    })
                    .collect()
            })
            .unwrap_or_default(),
        Err(err) => return (base.clone(), AuthState::Failed(err.to_string())),
    };
    let location = window().location();
    let origin = format!(
        "{}{}{}",
        location.origin().unwrap_or_default(),
        location.pathname().unwrap_or_default(),
        location.search().unwrap_or_default()
    );
    let login_urls = providers.iter().map(|provider| base.login_url(&provider.url, &origin)).collect();
    (base.clone(), AuthState::LoggedOut { providers, login_urls })
}

/// Ends the token session and the cookie session, since requests with a token carry no cookies
/// and `authenticate` falls back to the cookie once the token is gone.
pub async fn logout(client: &Client) {
    if client.config().token.is_some() {
        let _ = client.logout().await;
    }
    let _ = client.with_token(None).logout().await;
    storage_remove(TOKEN_KEY);
    let _ = window().location().reload();
}

fn provider_icon(name: &str) -> IconName {
    match name {
        "github" => IconName::Code,
        "google" => IconName::EarthGlobe,
        "sanity" => IconName::Envelope,
        _ => IconName::Lock,
    }
}

#[component]
pub fn LoginScreen(providers: Vec<Provider>, login_urls: Vec<String>) -> impl IntoView {
    view! {
        <Flex align="center" justify="center" height="fill" padding=Pad::all(4)>
            <Card radius=3 shadow=1 padding=Pad::all(4) style="width: 360px; max-width: 100%;">
                <Stack space=4>
                    <Stack space=3>
                        <Heading size=1>"Choose login provider"</Heading>
                        <Text size=1 muted=true>
                            "Signing in here also signs you in to the JS studio."
                        </Text>
                    </Stack>
                    <Stack space=2>
                        {providers
                            .into_iter()
                            .zip(login_urls)
                            .map(|(provider, url)| {
                                view! {
                                    <Card as_="a" href=url radius=2 border=true padding=Pad::all(3)>
                                        <Flex align="center" gap=3>
                                            <Text size=1>
                                                <Icon icon=provider_icon(&provider.name) />
                                            </Text>
                                            <Text size=1 weight=FontWeight::Medium>
                                                {provider.title}
                                            </Text>
                                        </Flex>
                                    </Card>
                                }
                            })
                            .collect_view()}
                    </Stack>
                </Stack>
            </Card>
        </Flex>
    }
}

#[component]
pub fn UnauthorizedScreen(user: User) -> impl IntoView {
    let signing_out = RwSignal::new(false);
    let account = match &user.email {
        Some(email) => format!("You are signed in as {} ({email}),", user.name),
        None => format!("You are signed in as {},", user.name),
    };
    view! {
        <Flex align="center" justify="center" height="fill" padding=Pad::all(4)>
            <Card radius=3 shadow=1 padding=Pad::all(4) style="width: 400px; max-width: 100%;">
                <Stack space=4>
                    <Stack space=3>
                        <Heading size=1>"You don't have access to this project"</Heading>
                        <Text size=1 muted=true>
                            {account}
                            " but that account has no role on project "
                            <code>{crate::config::PROJECT_ID}</code>
                            ". Ask an administrator to invite you, or request access from the JS studio."
                        </Text>
                    </Stack>
                    <Flex gap=2 justify="flex-end">
                        <Button
                            mode=ButtonMode::Ghost
                            text="Request access"
                            href=format!("/{}", crate::config::WORKSPACE)
                        />
                        <Button
                            tone=StateTone::Primary
                            icon=IconName::Leave
                            text="Sign out"
                            loading=signing_out
                            on_click=Callback::new(move |_| {
                                signing_out.set(true);
                                spawn_local(async { logout(&crate::store::store().client()).await });
                            })
                        />
                    </Flex>
                </Stack>
            </Card>
        </Flex>
    }
}
