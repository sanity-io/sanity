//! Sanity Studio in Rust: the shell, the structure tool and the document form, rendered with
//! Leptos and the `sanity-ui` port, editing through the `sanity-mutator` optimistic layer.

mod auth;
mod command_menu;
mod comments;
mod config;
mod document;
mod form;
mod history;
mod list;
mod navbar;
mod presence;
mod previews;
mod releases;
mod replica;
mod router;
mod schema;
mod store;
mod structure;
mod util;

use std::sync::Arc;

use leptos::prelude::*;
use leptos::task::spawn_local;
use sanity_client::{Client, Config};
use sanity_ui::css::{self, with_theme};
use sanity_ui::prelude::*;
use serde_json::{Map, Value};
use wasm_bindgen::prelude::*;

use crate::auth::{AuthState, LoginScreen, UnauthorizedScreen, User};
use crate::router::Router;
use crate::util::{now_ms, storage_get, storage_set};

const SCHEME_KEY: &str = "sanityStudio:ui:colorScheme";
const SCHEMA_CACHE_KEY: &str = "rust-studio:schema:v1";

/// Load timings for the performance panel, in milliseconds since navigation start unless noted.
#[derive(Clone, Copy)]
pub struct Perf {
    pub wasm_ready: f64,
    pub auth: RwSignal<Option<f64>>,
    pub schema: RwSignal<Option<f64>>,
    pub schema_cached: RwSignal<bool>,
    pub interactive: RwSignal<Option<f64>>,
    /// Duration of the first page of the latest document list.
    pub list: RwSignal<Option<f64>>,
    pub list_cached: RwSignal<bool>,
}

#[derive(Clone, Copy)]
pub struct AppState {
    pub router: Router,
    pub scheme: RwSignal<Scheme>,
    pub system_scheme: RwSignal<bool>,
    pub user: RwSignal<Option<User>>,
    /// Bumped when a fresher schema replaces the cached one.
    pub schema_version: RwSignal<u64>,
    pub perf: Perf,
    pub command_open: RwSignal<bool>,
}

pub fn use_app() -> AppState {
    expect_context::<AppState>()
}

fn prefers_dark() -> bool {
    window().match_media("(prefers-color-scheme: dark)").ok().flatten().is_some_and(|query| query.matches())
}

fn initial_scheme() -> (Scheme, bool) {
    match storage_get(SCHEME_KEY).as_deref() {
        Some("dark") => (Scheme::Dark, false),
        Some("light") => (Scheme::Light, false),
        _ => (if prefers_dark() { Scheme::Dark } else { Scheme::Light }, true),
    }
}

impl AppState {
    pub fn set_scheme(&self, scheme: Option<Scheme>) {
        match scheme {
            Some(scheme) => {
                storage_set(SCHEME_KEY, scheme.name());
                self.system_scheme.set(false);
                self.scheme.set(scheme);
            }
            None => {
                storage_set(SCHEME_KEY, "system");
                self.system_scheme.set(true);
                self.scheme.set(if prefers_dark() { Scheme::Dark } else { Scheme::Light });
            }
        }
    }
}

#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
    leptos::mount::mount_to_body(App);
}

/// The scrollbars of the test studio's `GlobalStyle`: a thumb in the card's border color, clipped
/// to 4px by a transparent border, on a transparent track. A scrollbar takes the custom properties
/// of the card it scrolls; the fallbacks follow its `color-scheme`.
fn global_style() {
    css::global("studio", || {
        with_theme(|theme| {
            let light = theme.card(Scheme::Light, CardTone::Default);
            let dark = theme.card(Scheme::Dark, CardTone::Default);
            vec![
                "::-webkit-scrollbar { width: 12px; height: 12px; }".into(),
                "::-webkit-scrollbar-corner { background-color: transparent; }".into(),
                format!(
                    "::-webkit-scrollbar-thumb {{ background-clip: content-box; background-color: var(--card-border-color, light-dark({}, {})); border: 4px solid transparent; }}",
                    light.base.border, dark.base.border
                ),
                format!(
                    "::-webkit-scrollbar-thumb:hover {{ background-color: var(--card-muted-fg-color, light-dark({}, {})); }}",
                    light.base.muted_fg, dark.base.muted_fg
                ),
                "::-webkit-scrollbar-track { background: transparent; }".into(),
                "body { scrollbar-gutter: stable; }".into(),
            ]
        })
    });
}

#[component]
fn App() -> impl IntoView {
    global_style();
    let (scheme, system) = initial_scheme();
    let scheme = RwSignal::new(scheme);
    Effect::new(move |_| {
        let dark = scheme.get() == Scheme::Dark;
        if let Some(root) = document().document_element() {
            let _ = root.set_attribute(
                "style",
                &format!(
                    "background-color: {}; color-scheme: {};",
                    if dark { "#13141b" } else { "#ffffff" },
                    scheme.get().name()
                ),
            );
        }
    });
    let state = AppState {
        router: Router::install(),
        scheme,
        system_scheme: RwSignal::new(system),
        user: RwSignal::new(None),
        schema_version: RwSignal::new(0),
        perf: Perf {
            wasm_ready: now_ms(),
            auth: RwSignal::new(None),
            schema: RwSignal::new(None),
            schema_cached: RwSignal::new(false),
            interactive: RwSignal::new(None),
            list: RwSignal::new(None),
            list_cached: RwSignal::new(false),
        },
        command_open: RwSignal::new(false),
    };
    provide_context(state);

    view! {
        <ThemeProvider scheme=scheme>
            <ToastProvider>
                <Boot />
            </ToastProvider>
        </ThemeProvider>
    }
}

/// The types of the deployed schema, as the JSON text it is cached as.
async fn fetch_schema(client: &Client) -> Result<String, String> {
    let groq = r#"*[_id == "_.schemas.default"][0].schema"#;
    let schema = client.query(groq, &Map::new(), "schema").await.map_err(|err| err.to_string())?;
    // Schema documents of version 2025-05-01 hold the types as a JSON string.
    match schema {
        Value::String(text) if text.trim_start().starts_with('[') => Ok(text),
        Value::Array(types) => Ok(Value::Array(types).to_string()),
        _ => Err("This dataset has no deployed schema. Run `sanity schema deploy` in the test studio.".into()),
    }
}

#[component]
fn Boot() -> impl IntoView {
    let app = use_app();
    let toasts = use_toast();
    let auth = RwSignal::new(AuthState::Checking);
    let schema_ready = RwSignal::new(false);
    let schema_error = RwSignal::new(None::<String>);

    spawn_local(async move {
        let base = Client::new(Config {
            project_id: config::PROJECT_ID.into(),
            dataset: config::DATASET.into(),
            api_host: config::API_HOST.into(),
            token: None,
            request_tag_prefix: config::REQUEST_TAG_PREFIX.into(),
        });
        let (client, state) = auth::authenticate(&base).await;
        app.perf.auth.set(Some(now_ms()));
        store::store().set_client(client.clone(), toasts);
        if let AuthState::LoggedIn(user) = &state {
            app.user.set(Some(user.clone()));
            presence::presence().start(client.clone(), user);
            releases::releases().start(client.clone());
            let cached = storage_get(SCHEMA_CACHE_KEY);
            if let Some(schema) = cached.as_deref().and_then(|types| schema::Schema::from_json(types).ok()) {
                schema::set_current(Arc::new(schema));
                replica::replica().start(client.clone());
                app.perf.schema.set(Some(now_ms()));
                app.perf.schema_cached.set(true);
                schema_ready.set(true);
            }
            auth.set(state);
            let fetched = fetch_schema(&client).await.and_then(|types| {
                if cached.as_deref() == Some(types.as_str()) {
                    return Ok(None);
                }
                let schema = schema::Schema::from_json(&types).map_err(|err| format!("Invalid schema: {err}"))?;
                storage_set(SCHEMA_CACHE_KEY, &types);
                Ok(Some(schema))
            });
            match fetched {
                Ok(schema) => {
                    if let Some(schema) = schema {
                        schema::set_current(Arc::new(schema));
                        app.schema_version.update(|version| *version += 1);
                    }
                    // Setting a signal notifies even when the value is unchanged, which would
                    // mount the studio a second time.
                    if !schema_ready.get_untracked() {
                        replica::replica().start(client.clone());
                        app.perf.schema.set(Some(now_ms()));
                        schema_ready.set(true);
                    }
                }
                Err(err) if !schema_ready.get_untracked() => schema_error.set(Some(err)),
                Err(_) => {}
            }
        } else {
            auth.set(state);
        }
    });

    move || match auth.get() {
        AuthState::Checking => view! { <Splash text="Loading" /> }.into_any(),
        AuthState::Failed(message) => view! { <Splash text=message /> }.into_any(),
        AuthState::LoggedOut { providers, login_urls } => {
            view! { <LoginScreen providers=providers login_urls=login_urls /> }.into_any()
        }
        AuthState::Unauthorized(user) => view! { <UnauthorizedScreen user=user /> }.into_any(),
        AuthState::LoggedIn(_) => {
            if let Some(message) = schema_error.get() {
                return view! { <Splash text=message /> }.into_any();
            }
            if !schema_ready.get() {
                return view! { <Splash text="Loading schema" /> }.into_any();
            }
            view! { <Studio /> }.into_any()
        }
    }
}

#[component]
fn Splash(#[prop(into)] text: String) -> impl IntoView {
    view! {
        <Flex direction="column" align="center" justify="center" gap=4 height="fill">
            <Text muted=true>
                <Spinner />
            </Text>
            <Text size=1 muted=true>
                {text}
            </Text>
        </Flex>
    }
}

#[component]
fn Studio() -> impl IntoView {
    let app = use_app();
    Effect::new(move |_| {
        if app.perf.interactive.get_untracked().is_none() {
            app.perf.interactive.set(Some(now_ms()));
        }
    });
    let keydown = window_event_listener(leptos::ev::keydown, move |event| {
        if (event.meta_key() || event.ctrl_key()) && event.key() == "k" {
            event.prevent_default();
            app.command_open.update(|open| *open = !*open);
        }
    });
    on_cleanup(move || keydown.remove());

    view! {
        <div data-ui="Studio" style="height: 100%; display: flex; flex-direction: column;">
            <navbar::Navbar />
            <Card flex=1 overflow="hidden" style="min-height: 0;">
                <structure::Structure />
            </Card>
            <Show when=move || app.command_open.get()>
                <command_menu::CommandMenu />
            </Show>
        </div>
    }
}
