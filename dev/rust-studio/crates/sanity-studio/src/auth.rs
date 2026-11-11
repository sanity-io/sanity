//! Authentication, compatible with the JS studio's: the same token storage key and format, so
//! signing in to either studio signs in to both, plus `#token=` / `#sid=` in the URL hash.

use leptos::prelude::*;
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
    fn from_json(value: &Value) -> Option<User> {
        let text = |key: &str| value.get(key).and_then(Value::as_str).map(str::to_owned);
        Some(User {
            id: text("id")?,
            name: text("name").unwrap_or_else(|| "Unknown user".into()),
            email: text("email"),
            image: text("profileImage"),
        })
    }

    pub fn initials(&self) -> String {
        self.name.split_whitespace().filter_map(|word| word.chars().next()).take(2).collect::<String>().to_uppercase()
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
    LoggedOut { providers: Vec<Provider>, login_urls: Vec<String> },
    LoggedIn(User),
    Failed(String),
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

/// Removes a credential from the URL so it does not end up in history or screenshots.
fn strip_hash() {
    let location = window().location();
    let url = format!("{}{}", location.pathname().unwrap_or_default(), location.search().unwrap_or_default());
    let _ = window()
        .history()
        .and_then(|history| history.replace_state_with_url(&wasm_bindgen::JsValue::NULL, "", Some(&url)));
}

fn hash_param(name: &str) -> Option<String> {
    let hash = window().location().hash().ok()?;
    let params = web_sys::UrlSearchParams::new_with_str(hash.trim_start_matches('#')).ok()?;
    params.get(name).filter(|value| !value.is_empty())
}

/// Resolves the session and returns the client to use for it: with a bearer token, or with the
/// session cookie when there is no token but the cookie is valid.
pub async fn authenticate(base: &Client) -> (Client, AuthState) {
    if let Some(token) = hash_param("token") {
        store_token(&token);
        strip_hash();
    } else if let Some(sid) = hash_param("sid") {
        strip_hash();
        match base.exchange_session_id(&sid).await {
            Ok(token) => store_token(&token),
            Err(err) => return (base.clone(), AuthState::Failed(format!("Could not complete the login: {err}"))),
        }
    }

    if let Some(token) = stored_token() {
        let client = base.with_token(Some(token));
        match client.current_user().await {
            Ok(Some(user)) => {
                if let Some(user) = User::from_json(&user) {
                    return (client, AuthState::LoggedIn(user));
                }
            }
            Ok(None) => storage_remove(TOKEN_KEY),
            Err(err) if err.is_unauthorized() => storage_remove(TOKEN_KEY),
            Err(err) => return (client, AuthState::Failed(err.to_string())),
        }
    }

    let cookie = base.with_token(None);
    if let Ok(Some(user)) = cookie.current_user().await
        && let Some(user) = User::from_json(&user)
    {
        return (cookie, AuthState::LoggedIn(user));
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

pub async fn logout(client: &Client) {
    // Hit logout with and without the bearer token: token requests omit cookies, but a cookie
    // session may still exist from login (same as the JS studio's dual logout).
    let _ = client.logout().await;
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
