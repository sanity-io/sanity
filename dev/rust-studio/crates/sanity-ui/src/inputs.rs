//! `TextInput`, `TextArea`, `Select`, `Switch` and `Checkbox`.

use leptos::ev::{FocusEvent, KeyboardEvent};
use leptos::html;
use leptos::prelude::*;

use crate::card::{use_card_tone, use_scheme};
use crate::layout::radius;
use crate::styles::{FontKind, checkbox_class, font_class, input_classes, input_size_style, switch_class};
use crate::text::{Icon, IconName};
use crate::theme::{FontWeight, SPACE, rem};

const DEFAULT_PADDING: usize = 3;
const DEFAULT_FONT_SIZE: usize = 2;

fn icon_box(icon: IconName, font_size: usize, side: &'static str) -> impl IntoView {
    let style = format!(
        "position: absolute; top: 0; {side}: 0; z-index: 2; pointer-events: none; padding: {};",
        rem(SPACE[DEFAULT_PADDING] as f64)
    );
    view! {
        <span style=style>
            <span class=font_class(FontKind::Text, font_size, FontWeight::Regular)>
                <span>
                    <Icon icon=icon />
                </span>
            </span>
        </span>
    }
}

/// A controlled `<input>`: `value` is written to the element's `value` property and every edit
/// is reported through `on_input`.
#[component]
pub fn TextInput(
    #[prop(into)] value: Signal<String>,
    #[prop(optional, into)] on_input: Option<Callback<String>>,
    #[prop(optional, into)] on_blur: Option<Callback<FocusEvent>>,
    #[prop(optional, into)] on_keydown: Option<Callback<KeyboardEvent>>,
    #[prop(optional)] input_type: Option<&'static str>,
    #[prop(optional, into)] placeholder: MaybeProp<String>,
    #[prop(optional, into)] disabled: Signal<bool>,
    #[prop(optional, into)] read_only: Signal<bool>,
    #[prop(optional, into)] invalid: Signal<bool>,
    #[prop(optional)] icon: Option<IconName>,
    #[prop(optional)] font_size: Option<usize>,
    #[prop(optional)] border: Option<bool>,
    #[prop(optional)] autofocus: bool,
    #[prop(optional, into)] step: MaybeProp<String>,
    #[prop(optional, into)] id: MaybeProp<String>,
    #[prop(optional)] node_ref: Option<NodeRef<html::Input>>,
) -> impl IntoView {
    let scheme = use_scheme();
    let tone = use_card_tone();
    let font_size = font_size.unwrap_or(DEFAULT_FONT_SIZE);
    let node_ref = node_ref.unwrap_or_default();
    let classes = Memo::new(move |_| input_classes(scheme.get(), tone));
    let size_style = input_size_style(DEFAULT_PADDING, font_size, icon.is_some(), false);

    Effect::new(move |_| {
        let invalid = invalid.get();
        if let Some(input) = node_ref.get() {
            input.set_custom_validity(if invalid { "Invalid" } else { "" });
        }
    });
    Effect::new(move |_| {
        if autofocus && let Some(input) = node_ref.get() {
            let _ = input.focus();
        }
    });

    view! {
        <span data-ui="TextInput" style=format!("position: relative; display: block; border-radius: {};", radius(2))>
            <input
                node_ref=node_ref
                data-as="input"
                id=move || id.get()
                type=input_type.unwrap_or("text")
                class=move || classes.get().0
                style=size_style
                step=move || step.get()
                placeholder=move || placeholder.get()
                disabled=move || disabled.get()
                readonly=move || read_only.get()
                spellcheck="false"
                autocomplete="off"
                prop:value=move || value.get()
                on:input=move |event| {
                    if let Some(on_input) = on_input {
                        on_input.run(event_target_value(&event));
                    }
                }
                on:blur=move |event| {
                    if let Some(on_blur) = on_blur {
                        on_blur.run(event);
                    }
                }
                on:keydown=move |event| {
                    if let Some(on_keydown) = on_keydown {
                        on_keydown.run(event);
                    }
                }
            />
            <span
                class=move || classes.get().1
                data-border=border.unwrap_or(true).then_some("")
                style=format!("border-radius: {};", radius(2))
            ></span>
            {icon.map(|icon| icon_box(icon, font_size, "left"))}
        </span>
    }
}

#[component]
pub fn TextArea(
    #[prop(into)] value: Signal<String>,
    #[prop(optional, into)] on_input: Option<Callback<String>>,
    #[prop(optional, into)] on_blur: Option<Callback<FocusEvent>>,
    #[prop(optional, into)] placeholder: MaybeProp<String>,
    #[prop(optional, into)] disabled: Signal<bool>,
    #[prop(optional, into)] read_only: Signal<bool>,
    #[prop(optional, into)] invalid: Signal<bool>,
    #[prop(optional)] rows: Option<u32>,
    #[prop(optional)] font_size: Option<usize>,
    #[prop(optional, into)] id: MaybeProp<String>,
) -> impl IntoView {
    let scheme = use_scheme();
    let tone = use_card_tone();
    let node_ref = NodeRef::<html::Textarea>::new();
    let classes = Memo::new(move |_| input_classes(scheme.get(), tone));
    let size_style = input_size_style(DEFAULT_PADDING, font_size.unwrap_or(DEFAULT_FONT_SIZE), false, false);

    Effect::new(move |_| {
        let invalid = invalid.get();
        if let Some(textarea) = node_ref.get() {
            textarea.set_custom_validity(if invalid { "Invalid" } else { "" });
        }
    });

    view! {
        <span data-ui="TextArea" style=format!("position: relative; display: block; border-radius: {};", radius(2))>
            <textarea
                node_ref=node_ref
                data-as="textarea"
                id=move || id.get()
                class=move || classes.get().0
                style=size_style
                rows=rows.unwrap_or(10)
                placeholder=move || placeholder.get()
                disabled=move || disabled.get()
                readonly=move || read_only.get()
                prop:value=move || value.get()
                on:input=move |event| {
                    if let Some(on_input) = on_input {
                        on_input.run(event_target_value(&event));
                    }
                }
                on:blur=move |event| {
                    if let Some(on_blur) = on_blur {
                        on_blur.run(event);
                    }
                }
            ></textarea>
            <span class=move || classes.get().1 data-border="" style=format!("border-radius: {};", radius(2))></span>
        </span>
    }
}

#[component]
pub fn Select(
    #[prop(into)] value: Signal<String>,
    #[prop(into)] options: Signal<Vec<(String, String)>>,
    #[prop(optional, into)] on_change: Option<Callback<String>>,
    #[prop(optional, into)] disabled: Signal<bool>,
    #[prop(optional, into)] read_only: Signal<bool>,
    #[prop(optional, into)] id: MaybeProp<String>,
) -> impl IntoView {
    let scheme = use_scheme();
    let tone = use_card_tone();
    let classes = Memo::new(move |_| input_classes(scheme.get(), tone));
    let size_style = input_size_style(DEFAULT_PADDING, DEFAULT_FONT_SIZE, false, true);

    view! {
        <span data-ui="Select" style=format!("position: relative; display: block; border-radius: {};", radius(2))>
            <select
                data-as="select"
                id=move || id.get()
                class=move || classes.get().0
                style=size_style
                disabled=move || disabled.get() || read_only.get()
                on:change=move |event| {
                    if let Some(on_change) = on_change {
                        on_change.run(event_target_value(&event));
                    }
                }
            >
                <For each=move || options.get() key=|(value, _)| value.clone() let((option_value, title))>
                    <option value=option_value.clone() selected=move || value.get() == option_value>
                        {title}
                    </option>
                </For>
            </select>
            <span class=move || classes.get().1 data-border="" style=format!("border-radius: {};", radius(2))></span>
            {icon_box(IconName::ChevronDown, DEFAULT_FONT_SIZE, "right")}
        </span>
    }
}

#[component]
pub fn Switch(
    #[prop(into)] checked: Signal<Option<bool>>,
    #[prop(optional, into)] on_change: Option<Callback<bool>>,
    #[prop(optional, into)] disabled: Signal<bool>,
    #[prop(optional, into)] read_only: Signal<bool>,
    #[prop(optional, into)] id: MaybeProp<String>,
) -> impl IntoView {
    let scheme = use_scheme();
    let tone = use_card_tone();
    view! {
        <span data-ui="Switch" class=move || switch_class(scheme.get(), tone)>
            <input
                type="checkbox"
                id=move || id.get()
                prop:checked=move || checked.get().unwrap_or(false)
                prop:indeterminate=move || checked.get().is_none()
                disabled=move || disabled.get() || read_only.get()
                data-read-only=move || read_only.get().then_some("")
                on:change=move |event| {
                    if let Some(on_change) = on_change {
                        on_change.run(event_target_checked(&event));
                    }
                }
            />
            <span>
                <span></span>
                <span></span>
            </span>
        </span>
    }
}

#[component]
pub fn Checkbox(
    #[prop(into)] checked: Signal<Option<bool>>,
    #[prop(optional, into)] on_change: Option<Callback<bool>>,
    #[prop(optional, into)] disabled: Signal<bool>,
    #[prop(optional, into)] read_only: Signal<bool>,
    #[prop(optional, into)] id: MaybeProp<String>,
) -> impl IntoView {
    let scheme = use_scheme();
    let tone = use_card_tone();
    view! {
        <span data-ui="Checkbox" class=move || checkbox_class(scheme.get(), tone)>
            <input
                type="checkbox"
                id=move || id.get()
                prop:checked=move || checked.get().unwrap_or(false)
                prop:indeterminate=move || checked.get().is_none()
                disabled=move || disabled.get() || read_only.get()
                data-read-only=move || read_only.get().then_some("")
                on:change=move |event| {
                    if let Some(on_change) = on_change {
                        on_change.run(event_target_checked(&event));
                    }
                }
            />
            <span>
                <Icon icon=IconName::Checkmark />
            </span>
        </span>
    }
}
