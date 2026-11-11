//! Inputs for primitive values: string, text, number, url, email, date, datetime, boolean and
//! slug, plus `options.list` selects and radios.

use std::sync::Arc;

use leptos::html;
use leptos::prelude::*;
use sanity_mutator::dmp;
use sanity_ui::prelude::*;
use serde_json::{Value, json};
use wasm_bindgen::JsCast;

use super::Target;
use crate::schema::{Kind, Resolved};
use crate::util::preview_text;

/// What typing a text means for the value.
#[derive(Clone, Debug, PartialEq)]
pub enum Parsed {
    Set(Value),
    Unset,
    /// Not a complete value yet (eg `-` in a number input); leave the document alone.
    Ignore,
}

fn as_text(value: Option<&Value>) -> String {
    match value {
        Some(Value::String(text)) => text.clone(),
        Some(Value::Number(number)) => number.to_string(),
        _ => String::new(),
    }
}

fn string_from(text: &str) -> Parsed {
    if text.is_empty() { Parsed::Unset } else { Parsed::Set(json!(text)) }
}

pub fn number_from(text: &str) -> Parsed {
    let text = text.trim();
    if text.is_empty() {
        return Parsed::Unset;
    }
    match text.parse::<f64>() {
        Ok(number) if number.is_finite() && number.fract() == 0.0 && number.abs() < 9e15 => {
            Parsed::Set(json!(number as i64))
        }
        Ok(number) if number.is_finite() => Parsed::Set(json!(number)),
        _ => Parsed::Ignore,
    }
}

/// `2024-05-01T13:37:00.000Z` as `2024-05-01T15:37` in the browser's timezone, the format of
/// `<input type="datetime-local">`.
fn datetime_to_local(value: Option<&Value>) -> String {
    let Some(iso) = value.and_then(Value::as_str) else { return String::new() };
    let date = js_sys::Date::new(&iso.into());
    if date.get_time().is_nan() {
        return String::new();
    }
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}",
        date.get_full_year(),
        date.get_month() + 1,
        date.get_date(),
        date.get_hours(),
        date.get_minutes()
    )
}

fn datetime_from(text: &str) -> Parsed {
    if text.is_empty() {
        return Parsed::Unset;
    }
    let date = js_sys::Date::new(&text.into());
    if date.get_time().is_nan() { Parsed::Ignore } else { Parsed::Set(json!(String::from(date.to_iso_string()))) }
}

fn slug_text(value: Option<&Value>) -> String {
    value.and_then(|slug| slug.get("current")).and_then(Value::as_str).unwrap_or_default().to_owned()
}

fn slug_from(text: &str) -> Parsed {
    if text.is_empty() { Parsed::Unset } else { Parsed::Set(json!({"_type": "slug", "current": text})) }
}

/// The default `slugify` of the slug input: lowercase, words joined by `-`, at most 200
/// characters.
pub fn slugify(source: &str) -> String {
    let mut slug = String::new();
    for c in source.to_lowercase().chars() {
        if c.is_alphanumeric() {
            slug.push(c);
        } else if !slug.ends_with('-') && !slug.is_empty() {
            slug.push('-');
        }
    }
    slug.trim_end_matches('-').chars().take(200).collect()
}

/// The element of a text input, for moving its selection.
#[derive(Clone, Copy)]
enum Field {
    Input(NodeRef<html::Input>),
    TextArea(NodeRef<html::Textarea>),
}

impl Field {
    /// Shows `text` and, when the field has focus, moves the selection through the change from
    /// what the field shows now, the way a remote edit should look to someone typing in it: text
    /// inserted before the caret pushes it along, text inserted at it lands after it.
    fn show(self, text: &str) {
        let element: Option<web_sys::HtmlElement> = match self {
            Field::Input(node) => node.get_untracked().map(|input| input.unchecked_into()),
            Field::TextArea(node) => node.get_untracked().map(|textarea| textarea.unchecked_into()),
        };
        let Some(element) = element else { return };
        if !document().active_element().is_some_and(|active| active.is_same_node(Some(&element))) {
            return;
        }
        let state = |shown: String, start: Option<u32>, end: Option<u32>| Some((shown, start? as usize, end? as usize));
        let state = match self {
            Field::Input(node) => node.get_untracked().and_then(|input| {
                state(input.value(), input.selection_start().ok().flatten(), input.selection_end().ok().flatten())
            }),
            Field::TextArea(node) => node.get_untracked().and_then(|textarea| {
                state(
                    textarea.value(),
                    textarea.selection_start().ok().flatten(),
                    textarea.selection_end().ok().flatten(),
                )
            }),
        };
        let Some((shown, start, end)) = state else { return };
        let (start, end) = (dmp::map_caret(&shown, text, start) as u32, dmp::map_caret(&shown, text, end) as u32);
        match self {
            Field::Input(node) => {
                if let Some(input) = node.get_untracked() {
                    input.set_value(text);
                    let _ = input.set_selection_range(start, end);
                }
            }
            Field::TextArea(node) => {
                if let Some(textarea) = node.get_untracked() {
                    textarea.set_value(text);
                    let _ = textarea.set_selection_range(start, end);
                }
            }
        }
    }
}

/// A text input over a value. The displayed text only follows the document when the document
/// changes to something other than what this input last wrote, so the cursor and partially
/// typed values (`1.`, half a date) survive the optimistic update and the listener echo, and a
/// remote edit moves the cursor along with the text around it.
#[component]
pub fn SyncedInput(
    target: Target,
    to_text: fn(Option<&Value>) -> String,
    from_text: fn(&str) -> Parsed,
    #[prop(optional)] input_type: Option<&'static str>,
    #[prop(optional)] rows: Option<u32>,
    #[prop(optional, into)] placeholder: MaybeProp<String>,
    #[prop(optional, into)] invalid: Signal<bool>,
) -> impl IntoView {
    let remote = {
        let target = target.clone();
        Memo::new(move |_| target.value())
    };
    let emitted = StoredValue::new(remote.get_untracked());
    let display = RwSignal::new(to_text(remote.get_untracked().as_ref()));
    let field = match rows {
        Some(_) => Field::TextArea(NodeRef::new()),
        None => Field::Input(NodeRef::new()),
    };
    Effect::new(move |_| {
        let remote = remote.get();
        if emitted.with_value(|emitted| emitted != &remote) {
            emitted.set_value(remote.clone());
            let text = to_text(remote.as_ref());
            field.show(&text);
            display.set(text);
        }
    });
    let read_only = target.read_only;
    let on_input = Callback::new(move |text: String| match from_text(&text) {
        Parsed::Set(value) => {
            emitted.set_value(Some(value.clone()));
            target.set(value);
        }
        Parsed::Unset => {
            emitted.set_value(None);
            target.unset();
        }
        Parsed::Ignore => {}
    });
    match rows {
        Some(rows) => view! {
            <TextArea
                value=display
                on_input=on_input
                rows=rows
                read_only=read_only
                placeholder=placeholder
                invalid=invalid
                node_ref=match field {
                    Field::TextArea(node) => node,
                    Field::Input(_) => NodeRef::new(),
                }
            />
        }
        .into_any(),
        None => view! {
            <TextInput
                value=display
                on_input=on_input
                input_type=input_type.unwrap_or("text")
                step=if input_type == Some("number") { Some("any".to_owned()) } else { None }
                read_only=read_only
                placeholder=placeholder
                invalid=invalid
                node_ref=match field {
                    Field::Input(node) => node,
                    Field::TextArea(_) => NodeRef::new(),
                }
            />
        }
        .into_any(),
    }
}

fn list_value_key(value: &Value) -> String {
    match value {
        Value::String(text) => text.clone(),
        other => other.to_string(),
    }
}

/// `options.list` as a select, or as radios with `options.layout: 'radio'`.
fn list_input(target: Target, list: Vec<(Value, String)>, radio: bool) -> AnyView {
    let read_only = target.read_only;
    let current = {
        let target = target.clone();
        Signal::derive(move || target.value().map(|value| list_value_key(&value)).unwrap_or_default())
    };
    let values: Arc<Vec<(String, Value)>> =
        Arc::new(list.iter().map(|(value, _)| (list_value_key(value), value.clone())).collect());
    let choose = {
        let target = target.clone();
        let values = values.clone();
        Callback::new(move |key: String| match values.iter().find(|(candidate, _)| *candidate == key) {
            Some((_, value)) => target.set(value.clone()),
            None => target.unset(),
        })
    };
    if radio {
        let name = format!("radio-{}", sanity_client::random_key(8));
        return view! {
            <Stack space=3>
                {list
                    .into_iter()
                    .map(|(value, title)| {
                        let key = list_value_key(&value);
                        let checked = {
                            let key = key.clone();
                            Signal::derive(move || current.get() == key)
                        };
                        let name = name.clone();
                        view! {
                            <label style="display: flex; gap: 0.75rem; align-items: center;">
                                <input
                                    type="radio"
                                    name=name
                                    prop:checked=checked
                                    disabled=move || read_only.get()
                                    on:change=move |_| choose.run(key.clone())
                                />
                                <Text size=1>{title}</Text>
                            </label>
                        }
                    })
                    .collect_view()}
            </Stack>
        }
        .into_any();
    }
    let mut options = vec![(String::new(), "Select…".to_owned())];
    options.extend(list.into_iter().map(|(value, title)| (list_value_key(&value), title)));
    view! { <Select value=current options=Signal::stored(options) on_change=choose read_only=read_only /> }.into_any()
}

pub fn primitive_input(target: Target, resolved: Arc<Resolved>) -> AnyView {
    if let Some(list) = resolved.list_options() {
        let radio = resolved.option("layout").and_then(Value::as_str) == Some("radio");
        return list_input(target, list, radio);
    }
    let placeholder = resolved.def.placeholder.clone();
    match resolved.kind {
        Kind::Text => view! {
            <SyncedInput
                target=target
                to_text=as_text
                from_text=string_from
                rows=resolved.def.rows.unwrap_or(10)
                placeholder=placeholder
            />
        }
        .into_any(),
        Kind::Number => {
            view! { <SyncedInput target=target to_text=as_text from_text=number_from input_type="number" placeholder=placeholder /> }
                .into_any()
        }
        Kind::Date => {
            view! { <SyncedInput target=target to_text=as_text from_text=string_from input_type="date" /> }.into_any()
        }
        Kind::Datetime => view! {
            <SyncedInput target=target to_text=datetime_to_local from_text=datetime_from input_type="datetime-local" />
        }
        .into_any(),
        Kind::Url => {
            view! { <SyncedInput target=target to_text=as_text from_text=string_from input_type="url" placeholder=placeholder /> }
                .into_any()
        }
        Kind::Email => {
            view! { <SyncedInput target=target to_text=as_text from_text=string_from input_type="email" placeholder=placeholder /> }
                .into_any()
        }
        _ => view! { <SyncedInput target=target to_text=as_text from_text=string_from placeholder=placeholder /> }.into_any(),
    }
}

pub fn boolean_input(target: Target, resolved: Arc<Resolved>) -> AnyView {
    let read_only = target.read_only;
    let checked = {
        let target = target.clone();
        Signal::derive(move || target.value().and_then(|value| value.as_bool()))
    };
    let on_change = Callback::new(move |value: bool| target.set(json!(value)));
    if resolved.option("layout").and_then(Value::as_str) == Some("checkbox") {
        view! { <Checkbox checked=checked on_change=on_change read_only=read_only /> }.into_any()
    } else {
        view! { <Switch checked=checked on_change=on_change read_only=read_only /> }.into_any()
    }
}

#[component]
pub fn SlugInput(target: Target, resolved: Arc<Resolved>) -> impl IntoView {
    let source = resolved.option("source").and_then(Value::as_str).map(str::to_owned);
    let generate = source.map(|source| {
        let target = target.clone();
        let source_path = sanity_mutator::path::parse(&source).ok();
        move |_| {
            let Some(source_path) = &source_path else { return };
            let text = target.doc.with_untracked(|doc| {
                doc.as_ref().and_then(|doc| sanity_mutator::path::get(doc, source_path)).and_then(preview_text)
            });
            if let Some(text) = text.map(|text| slugify(&text)).filter(|slug| !slug.is_empty()) {
                target.set(json!({"_type": "slug", "current": text}));
            }
        }
    });
    let read_only = target.read_only;
    view! {
        <Flex gap=1>
            <Box flex=1>
                <SyncedInput target=target to_text=slug_text from_text=slug_from />
            </Box>
            {generate.map(|generate| {
                view! {
                    <Button mode=ButtonMode::Ghost text="Generate" disabled=read_only on_click=Callback::new(generate) />
                }
            })}
        </Flex>
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_numbers_like_the_number_input() {
        assert_eq!(number_from("42"), Parsed::Set(json!(42)));
        assert_eq!(number_from(" 1.5 "), Parsed::Set(json!(1.5)));
        assert_eq!(number_from(""), Parsed::Unset);
        assert_eq!(number_from("-"), Parsed::Ignore);
    }

    #[test]
    fn slugifies() {
        assert_eq!(slugify("Hello, World! 2024"), "hello-world-2024");
        assert_eq!(slugify("  Ærlig  talt  "), "ærlig-talt");
    }
}
