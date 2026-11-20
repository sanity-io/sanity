//! `Popover`, `Menu`, `MenuItem`, `Dialog` and toasts.

use leptos::ev::{self, KeyboardEvent, MouseEvent};
use leptos::html;
use leptos::portal::Portal;
use leptos::prelude::*;
use wasm_bindgen::JsCast;

use crate::button::Button;
use crate::card::{Card, use_card_tone, use_scheme};
use crate::layout::{Box, Flex, Pad, Stack, space};
use crate::styles::selectable_class;
use crate::text::{Icon, IconName, Kbd, Text};
use crate::theme::{ButtonMode, CONTAINER, CardTone, FontWeight, LAYER_DIALOG, LAYER_POPOVER, StateTone};

fn contains(element: Option<web_sys::Element>, target: &Option<web_sys::Node>) -> bool {
    element.is_some_and(|element| element.contains(target.as_ref()))
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum Placement {
    #[default]
    BottomStart,
    BottomEnd,
    RightStart,
}

/// A popover anchored to `children`, portalled to the body while `open`. Clicks outside and
/// Escape close it.
#[component]
pub fn Popover(
    open: RwSignal<bool>,
    #[prop(optional)] placement: Placement,
    #[prop(optional)] min_width: Option<u32>,
    #[prop(optional)] max_height: Option<u32>,
    /// Lay the anchor out as a block, so it stretches like the input it wraps.
    #[prop(optional)]
    block: bool,
    /// Make the panel exactly as wide as the anchor.
    #[prop(optional)]
    match_width: bool,
    #[prop(into)] content: ViewFn,
    children: Children,
) -> impl IntoView {
    let content = StoredValue::new(content);
    let anchor = NodeRef::<html::Span>::new();
    let panel = NodeRef::<html::Div>::new();
    let position = RwSignal::new(String::new());

    Effect::new(move |_| {
        if !open.get() {
            return;
        }
        let Some(anchor) = anchor.get_untracked() else { return };
        let rect = anchor.get_bounding_client_rect();
        let window = window();
        let viewport_width = window.inner_width().ok().and_then(|width| width.as_f64()).unwrap_or(0.0);
        let viewport_height = window.inner_height().ok().and_then(|height| height.as_f64()).unwrap_or(0.0);
        let gap = 4.0;
        let style = match placement {
            Placement::BottomStart => format!("top: {}px; left: {}px;", rect.bottom() + gap, rect.left()),
            Placement::BottomEnd => {
                format!("top: {}px; right: {}px;", rect.bottom() + gap, viewport_width - rect.right())
            }
            Placement::RightStart => format!("top: {}px; left: {}px;", rect.top(), rect.right() + gap),
        };
        let available = (viewport_height - rect.bottom() - gap * 3.0).max(160.0);
        let max_height = max_height.map_or(available, |max| (max as f64).min(available));
        let width = if match_width { format!(" width: {}px;", rect.width()) } else { String::new() };
        position.set(format!("{style} max-height: {max_height}px;{width}"));
    });

    let mousedown = window_event_listener(ev::mousedown, move |event| {
        if !open.get_untracked() {
            return;
        }
        let target = event.target().and_then(|target| target.dyn_into::<web_sys::Node>().ok());
        let anchor_element = anchor.get_untracked().map(|element| element.unchecked_into::<web_sys::Element>());
        let panel_element = panel.get_untracked().map(|element| element.unchecked_into::<web_sys::Element>());
        if !contains(anchor_element, &target) && !contains(panel_element, &target) {
            open.set(false);
        }
    });
    let keydown = window_event_listener(ev::keydown, move |event| {
        if event.key() == "Escape" && open.get_untracked() {
            open.set(false);
        }
    });
    on_cleanup(move || {
        mousedown.remove();
        keydown.remove();
    });

    let panel_style = move || {
        format!(
            "position: fixed; z-index: {LAYER_POPOVER}; overflow: auto; min-width: {}px; {}",
            min_width.unwrap_or(0),
            position.get()
        )
    };

    view! {
        <span
            node_ref=anchor
            style=if block { "display: block; position: relative;" } else { "display: inline-block; position: relative; max-width: 100%;" }
        >
            {children()}
        </span>
        <Show when=move || open.get()>
            <Portal>
                <div node_ref=panel data-ui="Popover" style=panel_style>
                    <Card radius=3 shadow=3 style="overflow: auto; max-height: inherit;">
                        {content.read_value().run()}
                    </Card>
                </div>
            </Portal>
        </Show>
    }
}

fn move_focus(event: &KeyboardEvent, step: i32) {
    let Some(menu) = event.current_target().and_then(|target| target.dyn_into::<web_sys::Element>().ok()) else {
        return;
    };
    let Ok(items) = menu.query_selector_all("button:not(:disabled)") else { return };
    let items: Vec<web_sys::HtmlElement> =
        (0..items.length()).filter_map(|index| items.item(index)?.dyn_into().ok()).collect();
    if items.is_empty() {
        return;
    }
    let active = document().active_element();
    let current = items.iter().position(|item| active.as_ref().is_some_and(|active| active == item.as_ref()));
    let next = match current {
        Some(index) => (index as i32 + step).rem_euclid(items.len() as i32) as usize,
        None if step > 0 => 0,
        None => items.len() - 1,
    };
    event.prevent_default();
    let _ = items[next].focus();
}

#[component]
pub fn Menu(children: Children) -> impl IntoView {
    view! {
        <div
            data-ui="Menu"
            role="menu"
            style=format!("display: grid; gap: {}; padding: {}; outline: none;", space(1), space(1))
            on:keydown=move |event| match event.key().as_str() {
                "ArrowDown" => move_focus(&event, 1),
                "ArrowUp" => move_focus(&event, -1),
                _ => {}
            }
        >
            {children()}
        </div>
    }
}

#[component]
pub fn MenuItem(
    #[prop(into)] text: String,
    #[prop(optional)] icon: Option<IconName>,
    #[prop(optional)] tone: Option<StateTone>,
    #[prop(optional, into)] hotkey: Option<String>,
    #[prop(optional, into)] selected: Signal<bool>,
    #[prop(optional, into)] disabled: Signal<bool>,
    #[prop(optional, into)] on_click: Option<Callback<MouseEvent>>,
) -> impl IntoView {
    let scheme = use_scheme();
    let card_tone = use_card_tone();
    let tone = tone.unwrap_or(StateTone::Default);
    view! {
        <button
            type="button"
            role="menuitem"
            data-ui="MenuItem"
            class=move || selectable_class(scheme.get(), card_tone, tone)
            style=format!("border-radius: {};", crate::layout::radius(2))
            data-selected=move || selected.get().then_some("")
            disabled=move || disabled.get()
            on:click=move |event| {
                if let Some(on_click) = on_click {
                    on_click.run(event);
                }
            }
        >
            <Flex align="center" gap=3 padding=Pad::all(3)>
                {icon.map(|icon| view! { <Text size=1><Icon icon=icon /></Text> })}
                <Box flex=1>
                    <Text size=1 ellipsis=true>
                        {text}
                    </Text>
                </Box>
                {hotkey.map(|hotkey| view! { <Kbd>{hotkey}</Kbd> })}
            </Flex>
        </button>
    }
}

#[component]
pub fn MenuDivider() -> impl IntoView {
    view! { <hr style="height: 1px; border: 0; margin: 0; background: var(--card-border-color);" /> }
}

/// A modal dialog over a backdrop, portalled to the body. Render it conditionally.
#[component]
pub fn Dialog(
    #[prop(into)] header: String,
    on_close: Callback<()>,
    #[prop(optional)] width: Option<usize>,
    #[prop(optional, into)] footer: Option<ViewFn>,
    #[prop(optional, into)] id: Option<String>,
    children: ChildrenFn,
) -> impl IntoView {
    let keydown = window_event_listener(ev::keydown, move |event| {
        if event.key() == "Escape" {
            on_close.run(());
        }
    });
    on_cleanup(move || keydown.remove());
    let width = CONTAINER[width.unwrap_or(1).min(CONTAINER.len() - 1)];
    let header = StoredValue::new(header);
    let id = StoredValue::new(id);
    let children = StoredValue::new(children);
    let footer = StoredValue::new(footer);

    view! {
        <Portal>
            <Card
                scheme=use_scheme().get_untracked()
                tone=CardTone::Transparent
                style=format!(
                    "position: fixed; inset: 0; z-index: {LAYER_DIALOG}; display: flex; align-items: center; justify-content: center; padding: {}; background-color: var(--card-backdrop-color);",
                    space(4),
                )
                on_click=Callback::new(move |event: MouseEvent| {
                    if event.target() == event.current_target() {
                        on_close.run(());
                    }
                })
            >
                <div
                    data-ui="Dialog"
                    id=id.get_value()
                    role="dialog"
                    aria-modal="true"
                    style=format!("width: {width}px; max-width: 100%; max-height: 100%; display: flex;")
                >
                    <Card
                        radius=3
                        shadow=4
                        style="display: flex; flex-direction: column; width: 100%; max-height: 100%; overflow: hidden;"
                    >
                        <Flex align="center" padding=Pad::all(3) gap=2 style="border-bottom: 1px solid var(--card-border-color);">
                            <Box flex=1 padding=Pad::all(2)>
                                <Text size=1 weight=FontWeight::Semibold>
                                    {header.get_value()}
                                </Text>
                            </Box>
                            <Button
                                mode=ButtonMode::Bleed
                                icon=IconName::Close
                                title="Close"
                                on_click=Callback::new(move |_| on_close.run(()))
                            />
                        </Flex>
                        <Box flex=1 overflow="auto" padding=Pad::all(4)>
                            {children.read_value()()}
                        </Box>
                        {footer
                            .get_value()
                            .map(|footer| {
                                view! {
                                    <Box padding=Pad::all(3) style="border-top: 1px solid var(--card-border-color);">
                                        {footer.run()}
                                    </Box>
                                }
                            })}
                    </Card>
                </div>
            </Card>
        </Portal>
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ToastStatus {
    Info,
    Success,
    Warning,
    Error,
}

#[derive(Clone, Debug)]
pub struct ToastParams {
    pub status: ToastStatus,
    pub title: String,
    pub description: Option<String>,
}

#[derive(Clone, Copy)]
pub struct Toasts {
    items: RwSignal<Vec<(u64, ToastParams)>>,
    next_id: StoredValue<u64>,
}

impl Toasts {
    pub fn push(&self, params: ToastParams) {
        let id = self.next_id.get_value();
        self.next_id.set_value(id + 1);
        self.items.update(|items| items.push((id, params)));
        let items = self.items;
        set_timeout(
            move || items.update(|items| items.retain(|(item, _)| *item != id)),
            std::time::Duration::from_millis(5000),
        );
    }

    pub fn error(&self, title: impl Into<String>, description: impl Into<String>) {
        self.push(ToastParams {
            status: ToastStatus::Error,
            title: title.into(),
            description: Some(description.into()),
        });
    }

    pub fn success(&self, title: impl Into<String>) {
        self.push(ToastParams { status: ToastStatus::Success, title: title.into(), description: None });
    }
}

pub fn use_toast() -> Toasts {
    expect_context::<Toasts>()
}

#[component]
pub fn ToastProvider(children: Children) -> impl IntoView {
    let toasts = Toasts { items: RwSignal::new(Vec::new()), next_id: StoredValue::new(0) };
    provide_context(toasts);
    view! {
        {children()}
        <div
            data-ui="ToastLayer"
            style=format!(
                "position: fixed; right: 0; bottom: 0; z-index: {}; padding: {}; display: grid; gap: {}; width: 420px; max-width: 100%; pointer-events: none;",
                LAYER_DIALOG + 100,
                space(4),
                space(2),
            )
        >
            <For each=move || toasts.items.get() key=|(id, _)| *id let((id, toast))>
                <Card
                    tone=match toast.status {
                        ToastStatus::Info => CardTone::Default,
                        ToastStatus::Success => CardTone::Positive,
                        ToastStatus::Warning => CardTone::Caution,
                        ToastStatus::Error => CardTone::Critical,
                    }
                    radius=3
                    shadow=2
                    style="pointer-events: all;"
                >
                    <Flex align="flex-start" gap=2 padding=Pad::all(1)>
                        <Box flex=1 padding=Pad::all(2)>
                            <Stack space=2>
                                <Text size=1 weight=FontWeight::Medium>
                                    {toast.title.clone()}
                                </Text>
                                {toast.description.clone().map(|description| view! { <Text size=1 muted=true>{description}</Text> })}
                            </Stack>
                        </Box>
                        <Button
                            mode=ButtonMode::Bleed
                            icon=IconName::Close
                            padding=Pad::all(2)
                            on_click=Callback::new(move |_| {
                                toasts.items.update(|items| items.retain(|(item, _)| *item != id))
                            })
                        />
                    </Flex>
                </Card>
            </For>
        </div>
    }
}
