//! The Portable Text editor, on the model of `@portabletext/editor`: a contenteditable element
//! whose DOM the editor renders itself. Every `beforeinput` is cancelled and applied to the
//! value (`model.rs`), which is written back as keyed patches (`diff.rs`) and re-rendered block
//! by block (`dom.rs`). Objects and annotations are edited in dialogs with the form's inputs.

mod diff;
mod dom;
mod model;

use std::collections::HashMap;
use std::sync::Arc;

use leptos::html;
use leptos::prelude::*;
use sanity_mutator::Segment;
use sanity_ui::css;
use sanity_ui::prelude::*;
use sanity_ui::theme::{FONT_CODE, FONT_HEADING, FONT_TEXT};
use serde_json::{Value, json};
use wasm_bindgen::JsCast;
use wasm_bindgen::closure::Closure;
use web_sys::{ClipboardEvent, CompositionEvent, HtmlElement, InputEvent, KeyboardEvent, MouseEvent};

use self::dom::{ObjectLabel, Renderer};
use self::model::{Block, Doc, Point, Selection, new_key};
use super::{Target, render_input};
use crate::previews::image_url;
use crate::schema::{self, Kind, Resolved, TypeDef, member_type_name, title_of};
use crate::util::{now_ms, preview_text};

pub fn unsupported_block() -> AnyView {
    view! { <Text size=1 muted=true>"Blocks outside an array can't be edited."</Text> }.into_any()
}

pub fn portable_text_input(target: Target, resolved: Arc<Resolved>, level: usize) -> AnyView {
    view! { <PortableTextInput target=target resolved=resolved level=level /> }.into_any()
}

#[derive(Clone)]
struct MemberType {
    type_name: String,
    title: String,
    def: TypeDef,
}

/// What the array's members allow, from the schema.
struct Config {
    text_types: Vec<String>,
    styles: Vec<(String, String)>,
    lists: Vec<(String, String)>,
    decorators: Vec<(String, String)>,
    decorator_values: Vec<String>,
    annotations: Vec<MemberType>,
    inline: Vec<MemberType>,
    objects: Vec<MemberType>,
}

impl Config {
    fn new(resolved: &Resolved) -> Config {
        let schema = schema::current();
        let member = |def: &TypeDef| {
            let type_name = member_type_name(def);
            let title =
                if def.title.is_some() || !def.name.is_empty() { title_of(def) } else { schema.type_title(&type_name) };
            MemberType { type_name, title, def: def.clone() }
        };
        let mut text_types = Vec::new();
        let mut block = None;
        let mut objects = Vec::new();
        for def in resolved.of.iter() {
            if schema.resolve(def).kind == Kind::Block {
                text_types.push(member_type_name(def));
                block.get_or_insert_with(|| schema.block_config(def));
            } else {
                objects.push(member(def));
            }
        }
        let block =
            block.unwrap_or_else(|| schema.block_config(&TypeDef { type_name: "block".into(), ..TypeDef::default() }));
        let pairs = |items: &[schema::TitledValue]| -> Vec<(String, String)> {
            items.iter().map(|item| (item.value.clone(), item.title())).collect()
        };
        Config {
            text_types: if text_types.is_empty() { vec!["block".into()] } else { text_types },
            styles: pairs(&block.styles),
            lists: pairs(&block.lists),
            decorators: pairs(&block.decorators),
            decorator_values: block.decorators.iter().map(|decorator| decorator.value.clone()).collect(),
            annotations: block.annotations.iter().map(member).collect(),
            inline: block.inline.iter().map(member).collect(),
            objects,
        }
    }

    fn text_type(&self) -> &str {
        &self.text_types[0]
    }

    fn parse(&self, value: Option<&Value>) -> Doc {
        Doc::parse(value, |type_name| self.text_types.iter().any(|text| text == type_name), self.text_type())
    }

    fn label(&self, value: &Value) -> ObjectLabel {
        let type_name = value.get("_type").and_then(Value::as_str).unwrap_or_default();
        let schema = schema::current();
        let member = self.objects.iter().chain(&self.inline).find(|member| member.type_name == type_name);
        let type_title = member.map(|member| member.title.clone()).unwrap_or_else(|| schema.type_title(type_name));
        let Some(member) = member else { return ObjectLabel { type_title, title: None, image: None } };
        let resolved = schema.resolve(&member.def);
        let image_of = |image: Option<&Value>| {
            image
                .and_then(|image| image.pointer("/asset/_ref"))
                .and_then(Value::as_str)
                .and_then(|asset| image_url(asset, 66))
        };
        let (title, image) = match resolved.kind {
            Kind::Image | Kind::File => (
                ["caption", "alt", "title"].iter().find_map(|field| value.get(*field).and_then(preview_text)),
                image_of(Some(value)).filter(|_| resolved.kind == Kind::Image),
            ),
            Kind::Reference => (value.get("_ref").and_then(Value::as_str).map(str::to_owned), None),
            _ => {
                let guess = schema.guess_fields_preview(&resolved.fields);
                let field = |name: &Option<String>| name.as_ref().and_then(|name| value.get(name));
                (field(&guess.title).and_then(preview_text), image_of(field(&guess.media)))
            }
        };
        ObjectLabel { type_title, title, image }
    }

    fn annotation(&self, type_name: &str) -> Option<&MemberType> {
        self.annotations.iter().find(|annotation| annotation.type_name == type_name)
    }
}

#[derive(Clone, Copy, PartialEq)]
enum EditKind {
    Typing,
    Deleting,
    Other,
}

/// Snapshots to undo to, grouping consecutive typing (and deleting) within a second.
#[derive(Default)]
struct History {
    undo: Vec<(Doc, Option<Selection>)>,
    redo: Vec<(Doc, Option<Selection>)>,
    last: Option<(EditKind, f64)>,
}

const HISTORY_LIMIT: usize = 100;

#[derive(Clone, PartialEq)]
enum Editing {
    Block { key: String },
    Inline { block: String, child: String },
    Annotation { block: String, key: String },
}

#[derive(Clone, Copy)]
struct Editor {
    target: StoredValue<Target>,
    config: StoredValue<Arc<Config>>,
    doc: StoredValue<Doc>,
    /// The signature of each rendered block, by key.
    cache: StoredValue<HashMap<String, String>>,
    /// The last selection in the editor, kept while focus is elsewhere (the toolbar, a dialog).
    selection: RwSignal<Option<Selection>>,
    /// Marks toggled at a collapsed caret, which the next text typed there gets.
    pending: StoredValue<Option<(Selection, Vec<String>)>>,
    history: StoredValue<History>,
    /// Bumped on every change of the value, for what the toolbar shows.
    version: RwSignal<u64>,
    composing: StoredValue<Option<Selection>>,
    root: NodeRef<html::Div>,
    read_only: Signal<bool>,
    editing: RwSignal<Option<Editing>>,
}

fn document() -> web_sys::Document {
    window().document().expect("a document")
}

impl Editor {
    fn root(&self) -> Option<HtmlElement> {
        self.root.get_untracked().map(Into::into)
    }

    fn has_focus(&self) -> bool {
        let Some(root) = self.root() else { return false };
        document().active_element().is_some_and(|active| root.contains(Some(&active)))
    }

    fn render(&self) {
        let Some(root) = self.root() else { return };
        let config = self.config.get_value();
        let label = |value: &Value| config.label(value);
        let renderer = Renderer { label: &label, decorators: &config.decorator_values };
        self.doc.with_value(|doc| {
            self.cache.update_value(|cache| renderer.render(&root, doc, cache, None));
            let _ =
                if doc.is_empty() { root.set_attribute("data-empty", "") } else { root.remove_attribute("data-empty") };
        });
        if let Some(selection) = self.selection.get_untracked() {
            self.mark_selected(selection);
        }
    }

    /// Marks the object blocks the selection covers, which the browser doesn't highlight.
    fn mark_selected(&self, selection: Selection) {
        let Some(root) = self.root() else { return };
        let (start, end) = (selection.start(), selection.end());
        let children = root.children();
        self.doc.with_value(|doc| {
            for (index, block) in doc.blocks.iter().enumerate() {
                let Some(element) = children.item(index as u32) else { continue };
                let selected = matches!(block, Block::Object(_))
                    && (if selection.is_collapsed() {
                        index == start.block
                    } else {
                        start.block <= index && index < end.block.max(start.block + 1)
                    });
                let _ = if selected {
                    element.set_attribute("data-selected", "")
                } else {
                    element.remove_attribute("data-selected")
                };
            }
        });
    }

    /// The selection the next edit applies to: the document's when it is in the editor, else
    /// the last one, with a selected object block as a caret on it.
    fn current_selection(&self) -> Selection {
        let read = self.root().and_then(|root| self.doc.with_value(|doc| dom::read_selection(&root, doc)));
        let selection = read
            .or_else(|| self.selection.get_untracked())
            .unwrap_or_else(|| self.doc.with_value(|doc| Selection::caret(doc.end_of(doc.blocks.len() - 1))));
        self.doc.with_value(|doc| doc.object_selection(selection))
    }

    fn set_selection(&self, selection: Selection) {
        self.selection.set(Some(selection));
        if let Some(root) = self.root() {
            self.doc.with_value(|doc| dom::write_selection(&root, doc, selection));
        }
        self.mark_selected(selection);
    }

    fn focus(&self) {
        if let Some(root) = self.root() {
            let _ = root.focus();
            if let Some(selection) = self.selection.get_untracked() {
                self.set_selection(selection);
            }
        }
    }

    fn commit(&self) {
        let target = self.target.get_value();
        let (blocks, empty) = self.doc.with_value(|doc| (doc.to_json(), doc.is_empty()));
        let ops = diff::diff(&target.path, target.value_untracked().as_ref(), &blocks, empty);
        if !ops.is_empty() {
            target.patch(ops);
        }
    }

    /// Applies `edit` to the value, writes it and puts the selection where `edit` says.
    fn apply(&self, kind: EditKind, edit: impl FnOnce(&mut Doc) -> Option<Selection>) {
        if self.read_only.get_untracked() {
            return;
        }
        let before = self.doc.get_value();
        let selection = self.selection.get_untracked();
        let mut next = None;
        self.doc.update_value(|doc| next = edit(doc));
        if self.doc.with_value(|doc| *doc != before) {
            self.history.update_value(|history| {
                let now = now_ms();
                let grouped = kind != EditKind::Other
                    && history.last.is_some_and(|(last, time)| last == kind && now - time < 1000.0);
                if !grouped {
                    history.undo.push((before, selection));
                    if history.undo.len() > HISTORY_LIMIT {
                        history.undo.remove(0);
                    }
                }
                history.redo.clear();
                history.last = Some((kind, now));
            });
            self.commit();
        }
        self.render();
        if let Some(next) = next {
            self.set_selection(next);
        }
        self.version.update(|version| *version += 1);
    }

    fn step_history(&self, undo: bool) {
        if self.read_only.get_untracked() {
            return;
        }
        let mut entry = None;
        self.history.update_value(|history| entry = if undo { history.undo.pop() } else { history.redo.pop() });
        let Some((doc, selection)) = entry else { return };
        let current = (self.doc.get_value(), self.selection.get_untracked());
        self.history.update_value(|history| {
            if undo {
                history.redo.push(current)
            } else {
                history.undo.push(current)
            }
            history.last = None;
        });
        self.doc.set_value(doc);
        self.commit();
        self.render();
        if let Some(selection) = selection {
            self.set_selection(selection);
        }
        self.version.update(|version| *version += 1);
    }

    fn typing_marks(&self, selection: Selection) -> Vec<String> {
        self.pending
            .with_value(|pending| pending.as_ref().filter(|(at, _)| *at == selection).map(|(_, marks)| marks.clone()))
            .unwrap_or_else(|| self.doc.with_value(|doc| doc.marks_at(selection.start())))
    }

    fn has_mark(&self, selection: Selection, mark: &str) -> bool {
        if selection.is_collapsed() {
            return self.typing_marks(selection).iter().any(|existing| existing == mark);
        }
        self.doc.with_value(|doc| doc.has_mark(selection, mark))
    }

    fn toggle_decorator(&self, decorator: &str) {
        if !self.config.with_value(|config| config.decorator_values.iter().any(|value| value == decorator)) {
            return;
        }
        let selection = self.current_selection();
        if selection.is_collapsed() {
            let mut marks = self.typing_marks(selection);
            if marks.iter().any(|mark| mark == decorator) {
                marks.retain(|mark| mark != decorator);
            } else {
                marks.push(decorator.to_owned());
            }
            self.pending.set_value(Some((selection, marks)));
            self.selection.set(Some(selection));
            self.version.update(|version| *version += 1);
            return;
        }
        self.apply(EditKind::Other, |doc| {
            doc.toggle_decorator(selection, decorator);
            Some(selection)
        });
    }

    fn insert_text(&self, kind: EditKind, selection: Selection, text: &str) {
        let marks = self.typing_marks(selection);
        self.apply(kind, |doc| Some(Selection::caret(doc.insert_text(selection, text, &marks))));
        self.pending.set_value(None);
    }

    fn before_input(&self, event: InputEvent) {
        let input_type = event.input_type();
        if event.is_composing()
            || matches!(
                input_type.as_str(),
                "insertCompositionText" | "insertFromComposition" | "deleteCompositionText"
            )
        {
            return;
        }
        event.prevent_default();
        let selection = self.current_selection();
        let target_range = self.root().and_then(|root| {
            let range = event.get_target_ranges().get(0).dyn_into::<web_sys::StaticRange>().ok()?;
            self.doc.with_value(|doc| dom::read_range(&root, doc, &range))
        });
        let transfer_text = || event.data_transfer().and_then(|transfer| transfer.get_data("text/plain").ok());
        match input_type.as_str() {
            "insertText" | "insertReplacementText" => {
                let text = event.data().or_else(transfer_text).unwrap_or_default();
                let at =
                    if input_type == "insertReplacementText" { target_range.unwrap_or(selection) } else { selection };
                if !text.is_empty() {
                    self.insert_text(EditKind::Typing, at, &text);
                }
            }
            "insertLineBreak" => self.insert_text(EditKind::Other, selection, "\n"),
            "insertParagraph" => self.apply(EditKind::Other, |doc| Some(Selection::caret(doc.split(selection)))),
            "insertFromPaste" | "insertFromDrop" | "insertFromYank" => {
                if let Some(text) = transfer_text() {
                    let marks = self.typing_marks(selection);
                    self.apply(EditKind::Other, |doc| {
                        Some(Selection::caret(doc.insert_plain(selection, &text, &marks)))
                    });
                }
            }
            "historyUndo" => self.step_history(true),
            "historyRedo" => self.step_history(false),
            "formatBold" => self.toggle_decorator("strong"),
            "formatItalic" => self.toggle_decorator("em"),
            "formatUnderline" => self.toggle_decorator("underline"),
            "formatStrikeThrough" => self.toggle_decorator("strike-through"),
            kind if kind.starts_with("delete") => {
                let backward = !kind.contains("Forward");
                self.apply(EditKind::Deleting, |doc| {
                    Some(Selection::caret(if !selection.is_collapsed() {
                        doc.delete(selection)
                    } else if let Some(range) = target_range.filter(|range| {
                        !range.is_collapsed() && !matches!(kind, "deleteContentBackward" | "deleteContentForward")
                    }) {
                        doc.delete(range)
                    } else if backward {
                        doc.delete_backward(selection.start())
                    } else {
                        doc.delete_forward(selection.start())
                    }))
                });
            }
            _ => {}
        }
    }

    fn keydown(&self, event: KeyboardEvent) {
        let modifier = event.meta_key() || event.ctrl_key();
        let key = event.key().to_lowercase();
        if modifier && !event.alt_key() {
            match key.as_str() {
                "b" => self.toggle_decorator("strong"),
                "i" => self.toggle_decorator("em"),
                "u" => self.toggle_decorator("underline"),
                "'" => self.toggle_decorator("code"),
                "z" => self.step_history(!event.shift_key()),
                "y" => self.step_history(false),
                _ => return,
            }
            event.prevent_default();
            return;
        }
        if key == "tab" && !modifier {
            let selection = self.current_selection();
            if self.doc.with_value(|doc| doc.list_at(selection).is_some()) {
                event.prevent_default();
                let delta = if event.shift_key() { -1 } else { 1 };
                self.apply(EditKind::Other, |doc| {
                    doc.indent(selection, delta);
                    Some(selection)
                });
            }
        }
    }

    fn composition_end(&self, event: CompositionEvent) {
        let Some(selection) = self.composing.get_value() else { return };
        self.composing.set_value(None);
        // The browser changed the DOM of the blocks it composed in, so they render afresh.
        let keys: Vec<String> = self.doc.with_value(|doc| {
            (selection.start().block..=selection.end().block)
                .filter_map(|index| doc.blocks.get(index).map(|block| block.key().to_owned()))
                .collect()
        });
        self.cache.update_value(|cache| keys.iter().for_each(|key| drop(cache.remove(key))));
        let text = event.data().unwrap_or_default();
        if text.is_empty() {
            self.render();
            self.set_selection(selection);
        } else {
            self.insert_text(EditKind::Typing, selection, &text);
        }
    }

    fn clipboard(&self, event: ClipboardEvent, cut: bool) {
        let selection = self.current_selection();
        let text = self.doc.with_value(|doc| doc.plain_text(selection));
        let Some(data) = event.clipboard_data() else { return };
        if selection.is_collapsed() {
            return;
        }
        event.prevent_default();
        let _ = data.set_data("text/plain", &text);
        if cut {
            self.apply(EditKind::Other, |doc| Some(Selection::caret(doc.delete(selection))));
        }
    }

    fn paste(&self, event: ClipboardEvent) {
        event.prevent_default();
        let Some(text) = event.clipboard_data().and_then(|data| data.get_data("text/plain").ok()) else { return };
        let selection = self.current_selection();
        let marks = self.typing_marks(selection);
        self.apply(EditKind::Other, |doc| Some(Selection::caret(doc.insert_plain(selection, &text, &marks))));
    }

    fn click(&self, event: MouseEvent, open: bool) {
        let Some(element) = event.target().and_then(|target| target.dyn_into::<web_sys::Element>().ok()) else {
            return;
        };
        let closest = |selector: &str| element.closest(selector).ok().flatten();
        let block_key = closest("[data-block]").and_then(|block| block.get_attribute("data-key"));
        let Some(block_key) = block_key else { return };
        if let Some(action) = closest("[data-action]").and_then(|button| button.get_attribute("data-action")) {
            event.prevent_default();
            match action.as_str() {
                "edit" => self.editing.set(Some(Editing::Block { key: block_key })),
                "remove" => self.apply(EditKind::Other, |doc| doc.remove_block(&block_key).map(Selection::caret)),
                _ => {}
            }
            return;
        }
        if let Some(child) = closest("[data-inline]").and_then(|inline| inline.get_attribute("data-child")) {
            self.editing.set(Some(Editing::Inline { block: block_key, child }));
            return;
        }
        if closest("[data-block=\"object\"]").is_some() {
            let Some(index) = self.doc.with_value(|doc| doc.index_of(&block_key)) else { return };
            if open {
                self.editing.set(Some(Editing::Block { key: block_key }));
            } else {
                self.set_selection(Selection::caret(Point { block: index, offset: 0 }));
            }
        }
    }

    /// Keeps the value in step with the document, when someone else (or a dialog) changed it,
    /// with the selection on the same blocks.
    fn sync(&self, value: Option<&Value>) {
        let config = self.config.get_value();
        let incoming = config.parse(value);
        let same =
            self.doc.with_value(|doc| (value.is_none() && doc.is_empty()) || doc.to_json() == incoming.to_json());
        if !same {
            let keyed = self.selection.get_untracked().map(|selection| {
                self.doc.with_value(|doc| {
                    let key = |point: Point| (doc.blocks.get(point.block).map(|block| block.key().to_owned()), point);
                    (key(selection.anchor), key(selection.focus))
                })
            });
            self.doc.set_value(incoming);
            let restore = keyed.map(|(anchor, focus)| {
                self.doc.with_value(|doc| {
                    let point = |(key, point): (Option<String>, Point)| {
                        let block = key.and_then(|key| doc.index_of(&key)).unwrap_or(point.block);
                        doc.clamp(Point { block, offset: point.offset })
                    };
                    Selection { anchor: point(anchor), focus: point(focus) }
                })
            });
            self.render();
            match restore {
                Some(selection) if self.has_focus() => self.set_selection(selection),
                Some(selection) => self.selection.set(Some(selection)),
                None => {}
            }
            self.version.update(|version| *version += 1);
        } else {
            self.render();
        }
    }
}

fn editor_class() -> String {
    css::class("pte-editable".into(), || {
        let mut rules = vec![
            format!(
                "& {{ outline: none; min-height: 7.5rem; padding: 0.75rem; box-sizing: border-box; white-space: pre-wrap; overflow-wrap: anywhere; font-family: {}; font-size: 1rem; line-height: 1.5625; color: var(--card-fg-color); caret-color: var(--card-fg-color); }}",
                FONT_TEXT.family
            ),
            "& > [data-block] { position: relative; margin: 0; }".into(),
            "& > [data-block] + [data-block] { margin-top: 0.75rem; }".into(),
            "& > [data-list] + [data-list] { margin-top: 0.25rem; }".into(),
            "& > [data-style=\"blockquote\"] { border-left: 2px solid var(--card-border-color); padding-left: 0.75rem; color: var(--card-muted-fg-color); }".into(),
            "& > [data-marker]::before { content: attr(data-marker); position: absolute; left: calc(var(--pte-indent) - 1.5rem); width: 1.25rem; text-align: right; color: var(--card-muted-fg-color); user-select: none; font-variant-numeric: tabular-nums; }".into(),
            "& > [data-list=\"bullet\"]::before { font-size: 0.5rem; line-height: 3.125; }".into(),
            "&[data-empty] > [data-block]:first-child::after { content: 'Empty'; position: absolute; left: 0; top: 0; color: var(--card-muted-fg-color); pointer-events: none; user-select: none; }".into(),
            "& [data-marks~=\"strong\"] { font-weight: 600; }".into(),
            "& [data-marks~=\"em\"] { font-style: italic; }".into(),
            "& [data-marks~=\"underline\"] { text-decoration: underline; }".into(),
            "& [data-marks~=\"strike-through\"] { text-decoration: line-through; }".into(),
            "& [data-marks~=\"underline\"][data-marks~=\"strike-through\"] { text-decoration: underline line-through; }".into(),
            format!(
                "& [data-marks~=\"code\"] {{ font-family: {}; font-size: 0.875em; background-color: var(--card-code-bg-color); color: var(--card-code-fg-color); border-radius: 2px; padding: 0 2px; }}",
                FONT_CODE.family
            ),
            "& [data-annotated] { color: var(--card-link-color); text-decoration: underline; text-decoration-color: color-mix(in srgb, currentColor 40%, transparent); text-underline-offset: 2px; }".into(),
            "& [data-inline] { display: inline-flex; align-items: center; gap: 4px; margin: 0 1px; padding: 0 6px 0 4px; border: 1px solid var(--card-border-color); border-radius: 3px; font-size: 0.8125rem; line-height: 1.5; vertical-align: 1px; cursor: pointer; user-select: none; white-space: nowrap; }".into(),
            "& [data-inline] svg { font-size: 1.0625rem; color: var(--card-muted-fg-color); }".into(),
            "& [data-inline]:hover { border-color: var(--card-focus-ring-color); }".into(),
            "& > [data-block=\"object\"] { display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem; border: 1px solid var(--card-border-color); border-radius: 3px; white-space: normal; user-select: none; cursor: default; }".into(),
            "& > [data-block=\"object\"][data-selected] { border-color: var(--card-focus-ring-color); box-shadow: 0 0 0 1px var(--card-focus-ring-color); }".into(),
            "& [data-part=\"media\"] { flex: none; width: 33px; height: 33px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 1px; font-size: 1.3125rem; color: var(--card-muted-fg-color); box-shadow: inset 0 0 0 1px var(--card-border-color); }".into(),
            "& [data-part=\"media\"] img { width: 100%; height: 100%; object-fit: cover; }".into(),
            "& [data-part=\"body\"] { flex: 1; min-width: 0; }".into(),
            "& [data-part=\"title\"] { font-size: 0.8125rem; line-height: 1.25rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }".into(),
            "& [data-part=\"type\"] { font-size: 0.8125rem; line-height: 1.25rem; color: var(--card-muted-fg-color); }".into(),
            "& [data-action] { appearance: none; display: flex; border: 0; background: none; color: var(--card-muted-fg-color); padding: 0.375rem; border-radius: 3px; font-size: 1.0625rem; cursor: pointer; }".into(),
            "& [data-action]:hover { color: var(--card-fg-color); background-color: var(--card-code-bg-color); }".into(),
            "& [data-action=\"remove\"]:hover { color: var(--card-badge-critical-fg-color); }".into(),
            "&[contenteditable=\"false\"] [data-action=\"remove\"] { display: none; }".into(),
        ];
        for level in 1..=10 {
            rules.push(format!(
                "& > [data-level=\"{level}\"] {{ --pte-indent: {}rem; padding-left: var(--pte-indent); }}",
                level as f32 * 1.5
            ));
        }
        for (style, size, line_height) in [
            ("h1", 2.0625, 1.2),
            ("h2", 1.6875, 1.25),
            ("h3", 1.3125, 1.3),
            ("h4", 1.0625, 1.4),
            ("h5", 0.9375, 1.4),
            ("h6", 0.8125, 1.4),
        ] {
            rules.push(format!(
                "& > [data-style=\"{style}\"] {{ font-family: {}; font-size: {size}rem; line-height: {line_height}; font-weight: 700; }}",
                FONT_HEADING.family
            ));
        }
        rules
    })
}

fn decorator_icon(value: &str) -> IconName {
    match value {
        "strong" => IconName::Bold,
        "em" => IconName::Italic,
        "underline" => IconName::Underline,
        "strike-through" => IconName::Strikethrough,
        "code" => IconName::Code,
        _ => IconName::Text,
    }
}

fn decorator_hotkey(value: &str) -> &'static str {
    match value {
        "strong" => " (Ctrl+B)",
        "em" => " (Ctrl+I)",
        "underline" => " (Ctrl+U)",
        "code" => " (Ctrl+')",
        _ => "",
    }
}

fn list_icon(value: &str) -> IconName {
    match value {
        "number" => IconName::Olist,
        "bullet" => IconName::Ulist,
        _ => IconName::ThList,
    }
}

fn toolbar_button(
    icon: IconName,
    title: String,
    selected: Signal<bool>,
    disabled: Signal<bool>,
    on_click: Callback<MouseEvent>,
) -> AnyView {
    view! {
        <Button
            mode=ButtonMode::Bleed
            icon=icon
            title=title
            padding=Pad::all(2)
            selected=selected
            disabled=disabled
            on_click=on_click
        />
    }
    .into_any()
}

fn divider() -> AnyView {
    view! { <span style="width: 1px; align-self: stretch; margin: 0.25rem 0.125rem; background: var(--card-border-color);"></span> }
        .into_any()
}

#[component]
fn PortableTextInput(target: Target, resolved: Arc<Resolved>, level: usize) -> impl IntoView {
    let config = Arc::new(Config::new(&resolved));
    let read_only = target.read_only;
    let value = {
        let target = target.clone();
        Memo::new(move |_| target.value())
    };
    let editor = Editor {
        doc: StoredValue::new(config.parse(target.value_untracked().as_ref())),
        target: StoredValue::new(target.clone()),
        config: StoredValue::new(config.clone()),
        cache: StoredValue::new(HashMap::new()),
        selection: RwSignal::new(None),
        pending: StoredValue::new(None),
        history: StoredValue::new(History::default()),
        version: RwSignal::new(0),
        composing: StoredValue::new(None),
        root: NodeRef::new(),
        read_only,
        editing: RwSignal::new(None),
    };
    let focused = RwSignal::new(false);

    Effect::new(move |_| {
        let value = value.get();
        if editor.root.get().is_some() {
            editor.sync(value.as_ref());
        }
    });

    let on_selection_change = Closure::<dyn FnMut()>::new(move || {
        if editor.composing.with_value(Option::is_some) {
            return;
        }
        let Some(root) = editor.root() else { return };
        if let Some(selection) = editor.doc.with_value(|doc| dom::read_selection(&root, doc)) {
            if editor.selection.get_untracked() != Some(selection) {
                editor.selection.set(Some(selection));
            }
            editor.mark_selected(selection);
        }
    });
    let _ =
        document().add_event_listener_with_callback("selectionchange", on_selection_change.as_ref().unchecked_ref());
    let on_selection_change = StoredValue::new_local(on_selection_change);
    on_cleanup(move || {
        on_selection_change.with_value(|listener| {
            let _ =
                document().remove_event_listener_with_callback("selectionchange", listener.as_ref().unchecked_ref());
        });
    });

    let selection_state = move || {
        editor.version.track();
        editor.selection.get().map(|selection| editor.doc.with_value(|doc| doc.object_selection(selection)))
    };
    let style_value = Signal::derive(move || {
        selection_state()
            .and_then(|selection| editor.doc.with_value(|doc| doc.style_at(selection)))
            .unwrap_or_else(|| "normal".into())
    });
    let styles = StoredValue::new(config.styles.clone());
    let on_style = Callback::new(move |style: String| {
        let selection = editor.selection.get_untracked().unwrap_or_else(|| editor.current_selection());
        editor.focus();
        editor.apply(EditKind::Other, |doc| {
            doc.set_style(selection, &style);
            Some(selection)
        });
    });
    let in_text = Signal::derive(move || {
        selection_state().is_none_or(|selection| {
            editor.doc.with_value(|doc| matches!(doc.blocks.get(selection.start().block), Some(Block::Text(_))))
        })
    });
    let disabled = Signal::derive(move || read_only.get() || !in_text.get());

    let decorator_buttons = config
        .decorators
        .iter()
        .map(|(value, title)| {
            let selected = {
                let value = value.clone();
                Signal::derive(move || selection_state().is_some_and(|selection| editor.has_mark(selection, &value)))
            };
            let value = value.clone();
            toolbar_button(
                decorator_icon(&value),
                format!("{title}{}", decorator_hotkey(&value)),
                selected,
                disabled,
                Callback::new(move |_| editor.toggle_decorator(&value)),
            )
        })
        .collect_view();
    let list_buttons = config
        .lists
        .iter()
        .map(|(value, title)| {
            let selected = {
                let value = value.clone();
                Signal::derive(move || {
                    selection_state().is_some_and(|selection| {
                        editor.doc.with_value(|doc| doc.list_at(selection).as_deref() == Some(value.as_str()))
                    })
                })
            };
            let value = value.clone();
            toolbar_button(
                list_icon(&value),
                title.clone(),
                selected,
                disabled,
                Callback::new(move |_| {
                    let selection = editor.current_selection();
                    editor.apply(EditKind::Other, |doc| {
                        doc.toggle_list(selection, &value);
                        Some(selection)
                    });
                }),
            )
        })
        .collect_view();
    let annotation_buttons = config
        .annotations
        .iter()
        .map(|annotation| {
            let type_name = annotation.type_name.clone();
            let existing = {
                let type_name = type_name.clone();
                move || {
                    selection_state().and_then(|selection| {
                        editor.doc.with_value(|doc| {
                            doc.annotations_at(selection)
                                .into_iter()
                                .find(|(_, def)| def.get("_type").and_then(Value::as_str) == Some(type_name.as_str()))
                        })
                    })
                }
            };
            let selected = Signal::derive({
                let existing = existing.clone();
                move || existing().is_some()
            });
            let annotation_disabled = Signal::derive({
                let existing = existing.clone();
                move || {
                    disabled.get()
                        || (existing().is_none() && selection_state().is_none_or(|selection| selection.is_collapsed()))
                }
            });
            let icon = if type_name == "link" { IconName::Link } else { IconName::Edit };
            toolbar_button(
                icon,
                annotation.title.clone(),
                selected,
                annotation_disabled,
                Callback::new(move |_| {
                    if let Some((block, def)) = existing() {
                        let key = def.get("_key").and_then(Value::as_str).unwrap_or_default().to_owned();
                        editor.editing.set(Some(Editing::Annotation { block, key }));
                        return;
                    }
                    let selection = editor.current_selection();
                    let mut created = None;
                    editor.apply(EditKind::Other, |doc| {
                        created = doc.add_annotation(selection, &type_name);
                        Some(selection)
                    });
                    if let Some((block, key)) = created {
                        editor.editing.set(Some(Editing::Annotation { block, key }));
                    }
                }),
            )
        })
        .collect_view();

    let insert_open = RwSignal::new(false);
    let insert = move |type_name: String, inline: bool| {
        insert_open.set(false);
        let key = new_key();
        let mut value = schema::current().initial_document(&type_name).unwrap_or_else(|| json!({}));
        value["_key"] = json!(key);
        value["_type"] = json!(type_name);
        let selection = editor.selection.get_untracked().unwrap_or_else(|| editor.current_selection());
        let block = editor.doc.with_value(|doc| {
            doc.blocks.get(selection.start().block).map(|block| block.key().to_owned()).unwrap_or_default()
        });
        editor.focus();
        editor.apply(EditKind::Other, |doc| {
            Some(Selection::caret(if inline {
                doc.insert_inline(selection, value)
            } else {
                doc.insert_block(selection, value)
            }))
        });
        let block = if inline {
            editor.doc.with_value(|doc| {
                doc.blocks
                    .iter()
                    .find(|candidate| {
                        candidate.to_json()["children"]
                            .as_array()
                            .is_some_and(|children| children.iter().any(|child| child["_key"] == json!(key)))
                    })
                    .map(|candidate| candidate.key().to_owned())
                    .unwrap_or(block)
            })
        } else {
            block
        };
        editor.editing.set(Some(if inline { Editing::Inline { block, child: key } } else { Editing::Block { key } }));
    };
    let insert = StoredValue::new(insert);
    let insertable: Vec<(String, String, bool)> = config
        .objects
        .iter()
        .map(|member| (member.type_name.clone(), member.title.clone(), false))
        .chain(config.inline.iter().map(|member| (member.type_name.clone(), member.title.clone(), true)))
        .collect();
    let insert_menu = (!insertable.is_empty()).then(|| {
        let has_blocks = insertable.iter().any(|(_, _, inline)| !inline);
        let insertable = StoredValue::new(insertable);
        view! {
            <Popover
                open=insert_open
                placement=Placement::BottomEnd
                content=move || {
                    let items = insertable.get_value();
                    view! {
                        <Menu>
                            {items
                                .into_iter()
                                .enumerate()
                                .map(|(index, (type_name, title, inline))| {
                                    let divider = (has_blocks && inline && index > 0 && !insertable.with_value(|items| items[index - 1].2))
                                        .then(|| view! { <MenuDivider /> });
                                    let icon = if inline { IconName::InlineElement } else { IconName::BlockElement };
                                    let disabled = Signal::derive(move || inline && !in_text.get());
                                    view! {
                                        {divider}
                                        <MenuItem
                                            text=title
                                            icon=icon
                                            disabled=disabled
                                            on_click=Callback::new(move |_| insert.read_value()(type_name.clone(), inline))
                                        />
                                    }
                                })
                                .collect_view()}
                        </Menu>
                    }
                }
            >
                <Button
                    mode=ButtonMode::Bleed
                    icon=IconName::Add
                    icon_right=IconName::ChevronDown
                    text="Insert"
                    font_size=1
                    padding=Pad::all(2)
                    disabled=read_only
                    on_click=Callback::new(move |_| insert_open.update(|open| *open = !*open))
                />
            </Popover>
        }
    });

    let has_styles = config.styles.len() > 1;
    let has_lists = !config.lists.is_empty();
    let has_annotations = !config.annotations.is_empty();
    let toolbar = view! {
        <Card border_bottom=true padding=Pad::all(1) radius=2 style="border-bottom-left-radius: 0; border-bottom-right-radius: 0;">
            <Flex gap=1 align="center" wrap=true>
                {has_styles.then(|| view! {
                    <div style="width: 9.5rem; flex: none;">
                        <Select
                            value=style_value
                            options=Signal::derive(move || styles.get_value())
                            on_change=on_style
                            disabled=disabled
                        />
                    </div>
                })}
                <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 1px;" on:mousedown=|event: MouseEvent| event.prevent_default()>
                    {decorator_buttons}
                    {has_lists.then(divider)}
                    {list_buttons}
                    {has_annotations.then(divider)}
                    {annotation_buttons}
                </div>
                <Box flex=1 />
                {insert_menu}
            </Flex>
        </Card>
    };

    let dialog = move || {
        let editing = editor.editing.get()?;
        let config = editor.config.get_value();
        let target = editor.target.get_value();
        let schema = schema::current();
        let (item, value, member, is_annotation) = match &editing {
            Editing::Block { key } => {
                let value = editor.doc.with_value(|doc| doc.index_of(key).map(|index| doc.blocks[index].to_json()))?;
                let type_name = value.get("_type").and_then(Value::as_str).unwrap_or_default().to_owned();
                let member = config.objects.iter().find(|member| member.type_name == type_name).cloned();
                (target.child(Segment::key(key.as_str())), value, member, false)
            }
            Editing::Inline { block, child } => {
                let item = target
                    .child(Segment::key(block.as_str()))
                    .child(Segment::attr("children"))
                    .child(Segment::key(child.as_str()));
                let value = item.value_untracked()?;
                let type_name = value.get("_type").and_then(Value::as_str).unwrap_or_default().to_owned();
                let member = config.inline.iter().find(|member| member.type_name == type_name).cloned();
                (item, value, member, false)
            }
            Editing::Annotation { block, key } => {
                let item = target
                    .child(Segment::key(block.as_str()))
                    .child(Segment::attr("markDefs"))
                    .child(Segment::key(key.as_str()));
                let value = item.value_untracked()?;
                let type_name = value.get("_type").and_then(Value::as_str).unwrap_or_default().to_owned();
                let member = config.annotation(&type_name).cloned();
                (item, value, member, true)
            }
        };
        let type_name = value.get("_type").and_then(Value::as_str).unwrap_or_default().to_owned();
        let title = member.as_ref().map(|member| member.title.clone()).unwrap_or_else(|| schema.type_title(&type_name));
        let header = if read_only.get_untracked() { title.clone() } else { format!("Edit {title}") };
        let close = Callback::new(move |_: ()| {
            editor.editing.set(None);
            editor.focus();
        });
        let remove = {
            let editing = editing.clone();
            Callback::new(move |_: MouseEvent| {
                editor.editing.set(None);
                editor.focus();
                let editing = editing.clone();
                editor.apply(EditKind::Other, move |doc| match editing {
                    Editing::Block { key } => doc.remove_block(&key).map(Selection::caret),
                    Editing::Inline { block, child } => {
                        doc.remove_inline(&block, &child);
                        None
                    }
                    Editing::Annotation { block, key } => {
                        doc.remove_annotation(&block, &key);
                        None
                    }
                });
            })
        };
        let remove_text = if is_annotation { format!("Remove {}", title.to_lowercase()) } else { "Remove".to_owned() };
        let footer = move || {
            let remove_text = remove_text.clone();
            view! {
                <Flex gap=2 justify="flex-end">
                    {(!read_only.get_untracked()).then(|| view! {
                        <Button mode=ButtonMode::Ghost tone=StateTone::Critical icon=IconName::Trash text=remove_text on_click=remove />
                    })}
                    <Button tone=StateTone::Primary text="Done" on_click=Callback::new(move |_| close.run(())) />
                </Flex>
            }
        };
        let body = StoredValue::new((item, member.map(|member| Arc::new(schema.resolve(&member.def)))));
        Some(view! {
            <Dialog header=header on_close=close width=1 footer=footer id="pte-object-dialog".to_owned()>
                {move || {
                    let (item, resolved) = body.get_value();
                    match resolved {
                        Some(resolved) => render_input(item, resolved, level + 1),
                        None => view! { <Text size=1 muted=true>"The schema doesn't define this type."</Text> }.into_any(),
                    }
                }}
            </Dialog>
        })
    };

    let frame_style = move || {
        if focused.get() {
            "border-radius: 3px; box-shadow: 0 0 0 1px var(--card-focus-ring-color);"
        } else {
            "border-radius: 3px;"
        }
    };
    view! {
        <div data-ui="PortableTextInput" style=frame_style>
            <Card border=true radius=2>
                {toolbar}
                <div
                    node_ref=editor.root
                    class=editor_class()
                    contenteditable=move || if read_only.get() { "false" } else { "true" }
                    spellcheck="true"
                    role="textbox"
                    aria-multiline="true"
                    data-testid="pt-editable"
                    on:beforeinput=move |event: InputEvent| editor.before_input(event)
                    on:keydown=move |event: KeyboardEvent| editor.keydown(event)
                    on:compositionstart=move |_| editor.composing.set_value(Some(editor.current_selection()))
                    on:compositionend=move |event: CompositionEvent| editor.composition_end(event)
                    on:copy=move |event: ClipboardEvent| editor.clipboard(event, false)
                    on:cut=move |event: ClipboardEvent| editor.clipboard(event, true)
                    on:paste=move |event: ClipboardEvent| editor.paste(event)
                    on:dragstart=|event: web_sys::DragEvent| event.prevent_default()
                    on:drop=|event: web_sys::DragEvent| event.prevent_default()
                    on:click=move |event: MouseEvent| editor.click(event, false)
                    on:dblclick=move |event: MouseEvent| editor.click(event, true)
                    on:focus=move |_| focused.set(true)
                    on:blur=move |_| focused.set(false)
                ></div>
            </Card>
            {dialog}
        </div>
    }
}
