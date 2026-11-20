//! Port of `@sanity/diff-match-patch` 3.2.1, the library behind the mutator's `diffMatchPatch`
//! patches.
//!
//! Text is a slice of UTF-16 code units, like a JavaScript string, so diffs, match locations and
//! the UCS-2 lengths agree with the JavaScript implementation exactly. Patch headers count UTF-8
//! bytes, the way `stringify` and `parse` write and read them, so a patch made here applies in the
//! JavaScript Studio and the other way around. The JavaScript quirks that shape the output are
//! kept: `splice` with a negative index, equality stacks whose length goes negative, and the
//! one-second diff deadline.

use std::collections::HashMap;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Op {
    Delete,
    Equal,
    Insert,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Diff(pub Op, pub Vec<u16>);

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct Patch {
    pub diffs: Vec<Diff>,
    pub start1: isize,
    pub start2: isize,
    pub utf8_start1: isize,
    pub utf8_start2: isize,
    pub length1: isize,
    pub length2: isize,
    pub utf8_length1: isize,
    pub utf8_length2: isize,
}

impl Patch {
    fn new(start1: isize, start2: isize) -> Patch {
        Patch { diffs: Vec::new(), start1, start2, utf8_start1: start1, utf8_start2: start2, ..Patch::default() }
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DmpError(pub String);

impl std::fmt::Display for DmpError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0)
    }
}

const MAX_BITS: usize = 32;
const MARGIN: isize = 4;

pub fn utf16(text: &str) -> Vec<u16> {
    text.encode_utf16().collect()
}

pub fn to_string(units: &[u16]) -> String {
    String::from_utf16_lossy(units)
}

/// A `diffMatchPatch` value turning `old` into `new`, or `None` when they are equal or a diff
/// would split a surrogate pair (`encodeURI` throws on those, and the Studio then sets the value).
pub fn make_patch_string(old: &str, new: &str) -> Option<String> {
    let patches = make_patches(&utf16(old), &utf16(new));
    if patches.is_empty() {
        return None;
    }
    stringify(&patches).ok()
}

/// Applies a stringified patch the way the mutator does (`allowExceedingIndices`).
pub fn apply_patch_string(patch: &str, text: &str) -> Result<String, DmpError> {
    let patches = parse(patch)?;
    Ok(to_string(&apply(&patches, &utf16(text)).0))
}

/// Where `location` in `old` moved to in `new`, for keeping a caret in place across a remote
/// change.
pub fn map_offset(old: &[u16], new: &[u16], location: usize) -> usize {
    x_index(&diff(old, new, false), location)
}

/// Moves a caret at `caret` in `old` to where it belongs in `new`, aligned the way [`merge`]
/// aligns edits. Text inserted right at the caret ends up after it: the caret stays with what
/// its user typed last, so someone else's word never lands in the middle of the one being typed.
pub fn map_caret(old: &str, new: &str, caret: usize) -> usize {
    let edits = Edits::between(old, new);
    (0..caret.min(edits.deleted.len())).map(|i| edits.inserts[i].len() + usize::from(!edits.deleted[i])).sum()
}

/// Applies the edits that turn `base` into `ours` to `theirs`, a version of `base` someone else
/// edited (see [`merge_edits`]).
pub fn merge(base: &str, ours: &str, theirs: &str) -> String {
    merge_edits(base, &Edits::between(base, ours), theirs).0
}

/// Applies `ours`, edits to `base`, to `theirs`, a version of `base` someone else edited, without
/// fuzzy matching: a character either side deleted is gone, and everything either side inserted
/// stays. Returns the result and `ours` as edits to `theirs`.
///
/// Where both inserted at the same place, each insertion keeps to the word it belongs to: one
/// that continues the word before it comes first (ours first, since that is the word its user is
/// typing), one that starts the word after it comes last, and of two whole words theirs comes
/// first.
pub fn merge_edits(base: &str, ours: &Edits, theirs: &str) -> (String, Edits) {
    let base = utf16(base);
    let theirs_text = utf16(theirs);
    let theirs = Edits::between_units(&base, &theirs_text);
    let mut merged = Vec::with_capacity(theirs_text.len());
    let mut rebased = Edits::none(theirs_text.len());
    // Where `theirs_text` is at
    let mut at = 0;
    for i in 0..=base.len() {
        let before = i.checked_sub(1).map(|at| base[at]);
        let after = base.get(i).copied();
        let (ours_inserted, theirs_inserted) = (&ours.inserts[i], &theirs.inserts[i]);
        let ours_attaches = Attachment::of(ours_inserted, before, after);
        let ours_first = match Attachment::of(theirs_inserted, before, after) {
            Attachment::Before => ours_attaches == Attachment::Before,
            theirs_attaches => ours_attaches < theirs_attaches,
        };
        if ours_first {
            merged.extend_from_slice(ours_inserted);
            rebased.inserts[at].extend_from_slice(ours_inserted);
        }
        merged.extend_from_slice(theirs_inserted);
        at += theirs_inserted.len();
        if !ours_first {
            merged.extend_from_slice(ours_inserted);
            rebased.inserts[at].extend_from_slice(ours_inserted);
        }
        if i < base.len() && !theirs.deleted[i] {
            if ours.deleted[i] {
                rebased.deleted[at] = true;
            } else {
                merged.push(base[i]);
            }
            at += 1;
        }
    }
    (to_string(&merged), rebased)
}

/// Edits to a text, as what they delete from it and insert before each of its positions.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Edits {
    deleted: Vec<bool>,
    inserts: Vec<Vec<u16>>,
}

impl Edits {
    fn none(len: usize) -> Edits {
        Edits { deleted: vec![false; len], inserts: vec![Vec::new(); len + 1] }
    }

    /// The edits that turn `base` into `other`, from a minimal diff aligned to word boundaries,
    /// so an insertion into repeated text (typing "the " before "the") stays in one piece
    /// instead of starting inside the word it repeats.
    pub fn between(base: &str, other: &str) -> Edits {
        Edits::between_units(&utf16(base), &utf16(other))
    }

    fn between_units(base: &[u16], other: &[u16]) -> Edits {
        let mut edits = Edits::none(base.len());
        let mut at = 0;
        for Diff(op, text) in cleanup_semantic_lossless(diff_minimal(base, other)) {
            match op {
                Op::Equal => at += text.len(),
                Op::Delete => {
                    edits.deleted[at..at + text.len()].fill(true);
                    at += text.len();
                }
                Op::Insert => edits.inserts[at].extend_from_slice(&text),
            }
        }
        edits
    }

    /// The edits that turn `got` into `want`, two results of applying the same edits to `base`
    /// (by Content Lake's fuzzy matching and by [`merge_edits`]), that leave every character of
    /// `base` they both kept in place. A fresh diff would be free to move someone else's text
    /// instead of the misplaced insertion, which goes wrong as soon as they move it themselves.
    pub fn correcting(base: &str, got: &str, want: &str) -> Edits {
        let (base, got) = (utf16(base), utf16(got));
        let to_got = Edits::between_units(&base, &got);
        let to_want = Edits::between_units(&base, &utf16(want));
        let mut edits = Edits::none(got.len());
        // Where `got` is at
        let mut at = 0;
        for i in 0..=base.len() {
            let (got_inserted, want_inserted) = (&to_got.inserts[i], &to_want.inserts[i]);
            if got_inserted != want_inserted {
                edits.deleted[at..at + got_inserted.len()].fill(true);
                edits.inserts[at + got_inserted.len()].extend_from_slice(want_inserted);
            }
            at += got_inserted.len();
            if i < base.len() {
                match (to_got.deleted[i], to_want.deleted[i]) {
                    (false, false) => at += 1,
                    (false, true) => {
                        edits.deleted[at] = true;
                        at += 1;
                    }
                    (true, false) => edits.inserts[at].push(base[i]),
                    (true, true) => {}
                }
            }
        }
        edits
    }

    /// `base` with the edits applied.
    pub fn apply(&self, base: &str) -> String {
        to_string(&self.applied(&utf16(base)))
    }

    fn applied(&self, base: &[u16]) -> Vec<u16> {
        let mut out = Vec::with_capacity(base.len());
        for (i, inserted) in self.inserts.iter().enumerate() {
            out.extend_from_slice(inserted);
            if i < base.len() && !self.deleted[i] {
                out.push(base[i]);
            }
        }
        out
    }

    fn diffs(&self, base: &[u16]) -> Vec<Diff> {
        let mut diffs: Vec<Diff> = Vec::new();
        let mut push = |op: Op, units: &[u16]| match diffs.last_mut() {
            Some(Diff(last, text)) if *last == op => text.extend_from_slice(units),
            _ if !units.is_empty() => diffs.push(Diff(op, units.to_vec())),
            _ => {}
        };
        for (i, inserted) in self.inserts.iter().enumerate() {
            push(Op::Insert, inserted);
            if i < base.len() {
                push(if self.deleted[i] { Op::Delete } else { Op::Equal }, &base[i..=i]);
            }
        }
        // Deletions before insertions in each changed run, like a diff
        cleanup_merge(diffs)
    }

    /// The edits as a stringified patch of `base`, `None` when they change nothing or would
    /// split a surrogate pair.
    pub fn patch(&self, base: &str) -> Option<String> {
        let base = utf16(base);
        let mut diffs = self.diffs(&base);
        if diffs.iter().all(|Diff(op, _)| *op == Op::Equal) {
            return None;
        }
        adjust_diff_for_surrogate_pairs(&mut diffs);
        stringify(&make_from_diffs(&base, &diffs)).ok()
    }
}

/// Which neighbor an insertion belongs to, in the order insertions at one place are merged.
#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
enum Attachment {
    /// Continues the word before it.
    Before,
    /// Stands on its own, like a word and the space after it.
    Neither,
    /// Starts the word after it, like the first letters of a word typed in front of another.
    After,
}

impl Attachment {
    fn of(inserted: &[u16], before: Option<u16>, after: Option<u16>) -> Attachment {
        let joins =
            |a: Option<u16>, b: Option<&u16>| a.is_some_and(|a| !is_space(a)) && b.is_some_and(|&b| !is_space(b));
        if joins(before, inserted.first()) {
            Attachment::Before
        } else if joins(after, inserted.last()) {
            Attachment::After
        } else {
            Attachment::Neither
        }
    }
}

fn is_space(unit: u16) -> bool {
    char::from_u32(unit.into()).is_some_and(char::is_whitespace)
}

/// Whether `new` differs from `old` in one contiguous place, eg by typing at one caret.
pub fn is_single_edit(old: &str, new: &str) -> bool {
    let diffs = diff_minimal(&utf16(old), &utf16(new));
    let mut runs = 0;
    let mut in_run = false;
    for Diff(op, _) in &diffs {
        let edit = *op != Op::Equal;
        if edit && !in_run {
            runs += 1;
        }
        in_run = edit;
    }
    runs <= 1
}

#[cfg(target_arch = "wasm32")]
fn now_ms() -> f64 {
    js_sys::Date::now()
}

#[cfg(not(target_arch = "wasm32"))]
fn now_ms() -> f64 {
    std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_secs_f64() * 1000.0).unwrap_or(0.0)
}

/// `String.prototype.substring`: both ends clamped to the text, swapped when reversed.
fn sub(text: &[u16], start: isize, end: isize) -> &[u16] {
    let len = text.len() as isize;
    let a = start.clamp(0, len) as usize;
    let b = end.clamp(0, len) as usize;
    if a <= b { &text[a..b] } else { &text[b..a] }
}

fn sub_from(text: &[u16], start: isize) -> &[u16] {
    sub(text, start, text.len() as isize)
}

fn concat(parts: &[&[u16]]) -> Vec<u16> {
    let mut out = Vec::with_capacity(parts.iter().map(|p| p.len()).sum());
    for part in parts {
        out.extend_from_slice(part);
    }
    out
}

/// `String.prototype.indexOf(needle, from)`.
fn index_of(hay: &[u16], needle: &[u16], from: usize) -> Option<usize> {
    let from = from.min(hay.len());
    if needle.is_empty() {
        return Some(from);
    }
    if needle.len() > hay.len() {
        return None;
    }
    (from..=hay.len() - needle.len()).find(|&i| &hay[i..i + needle.len()] == needle)
}

/// `String.prototype.lastIndexOf(needle, from)`.
fn last_index_of(hay: &[u16], needle: &[u16], from: isize) -> Option<usize> {
    if needle.len() > hay.len() {
        return None;
    }
    let start = (from.clamp(0, hay.len() as isize) as usize).min(hay.len() - needle.len());
    (0..=start).rev().find(|&i| &hay[i..i + needle.len()] == needle)
}

fn is_high_surrogate(unit: u16) -> bool {
    (0xd800..=0xdbff).contains(&unit)
}

fn is_low_surrogate(unit: u16) -> bool {
    (0xdc00..=0xdfff).contains(&unit)
}

fn code_point_at(text: &[u16], i: usize) -> Option<u32> {
    let unit = *text.get(i)?;
    if is_high_surrogate(unit)
        && let Some(&low) = text.get(i + 1)
        && is_low_surrogate(low)
    {
        return Some(0x10000 + ((u32::from(unit) - 0xd800) << 10) + (u32::from(low) - 0xdc00));
    }
    Some(u32::from(unit))
}

fn utf8_len(code_point: u32) -> isize {
    match code_point {
        0..=0x7f => 1,
        0x80..=0x7ff => 2,
        0x800..=0xffff => 3,
        _ => 4,
    }
}

pub fn count_utf8_bytes(text: &[u16]) -> isize {
    let mut bytes = 0;
    let mut i = 0;
    while let Some(code_point) = code_point_at(text, i) {
        i += if code_point > 0xffff { 2 } else { 1 };
        bytes += utf8_len(code_point);
    }
    bytes
}

// --- diff -------------------------------------------------------------------------------------

/// `diff(a, b, {checkLines})`: the diff with surrogate pairs kept whole.
pub fn diff(a: &[u16], b: &[u16], check_lines: bool) -> Vec<Diff> {
    let mut diffs = do_diff(a, b, check_lines, now_ms() + 1000.0);
    adjust_diff_for_surrogate_pairs(&mut diffs);
    diffs
}

/// `diff(a, b, {timeout: 0})`: a minimal diff, which never deletes and inserts again text both
/// strings share. The speedups behind the deadline can, which a three-way merge would turn into
/// that text twice.
pub fn diff_minimal(a: &[u16], b: &[u16]) -> Vec<Diff> {
    let mut diffs = do_diff(a, b, false, f64::INFINITY);
    adjust_diff_for_surrogate_pairs(&mut diffs);
    diffs
}

fn do_diff(a: &[u16], b: &[u16], check_lines: bool, deadline: f64) -> Vec<Diff> {
    if a == b {
        return if a.is_empty() { Vec::new() } else { vec![Diff(Op::Equal, a.to_vec())] };
    }
    let prefix_len = common_prefix(a, b);
    let (prefix, a, b) = (&a[..prefix_len], &a[prefix_len..], &b[prefix_len..]);
    let suffix_len = common_suffix(a, b);
    let suffix = &a[a.len() - suffix_len..];
    let (a, b) = (&a[..a.len() - suffix_len], &b[..b.len() - suffix_len]);

    let mut diffs = compute(a, b, check_lines, deadline);
    if !prefix.is_empty() {
        diffs.insert(0, Diff(Op::Equal, prefix.to_vec()));
    }
    if !suffix.is_empty() {
        diffs.push(Diff(Op::Equal, suffix.to_vec()));
    }
    cleanup_merge(diffs)
}

fn compute(a: &[u16], b: &[u16], check_lines: bool, deadline: f64) -> Vec<Diff> {
    if a.is_empty() {
        return vec![Diff(Op::Insert, b.to_vec())];
    }
    if b.is_empty() {
        return vec![Diff(Op::Delete, a.to_vec())];
    }
    let (long, short) = if a.len() > b.len() { (a, b) } else { (b, a) };
    if let Some(i) = index_of(long, short, 0) {
        let op = if a.len() > b.len() { Op::Delete } else { Op::Insert };
        return vec![
            Diff(op, long[..i].to_vec()),
            Diff(Op::Equal, short.to_vec()),
            Diff(op, long[i + short.len()..].to_vec()),
        ];
    }
    if short.len() == 1 {
        return vec![Diff(Op::Delete, a.to_vec()), Diff(Op::Insert, b.to_vec())];
    }
    // Like `Diff_Timeout <= 0`, no deadline means no half match, whose result is not minimal
    if deadline.is_finite()
        && let Some([a1, b1, a2, b2, mid]) = half_match(a, b)
    {
        let mut diffs = do_diff(&a1, &a2, check_lines, deadline);
        diffs.push(Diff(Op::Equal, mid));
        diffs.extend(do_diff(&b1, &b2, check_lines, deadline));
        return diffs;
    }
    if check_lines && a.len() > 100 && b.len() > 100 {
        return line_mode(a, b, deadline);
    }
    bisect(a, b, deadline)
}

fn common_prefix(a: &[u16], b: &[u16]) -> usize {
    a.iter().zip(b).take_while(|(x, y)| x == y).count()
}

fn common_suffix(a: &[u16], b: &[u16]) -> usize {
    a.iter().rev().zip(b.iter().rev()).take_while(|(x, y)| x == y).count()
}

fn common_overlap(a: &[u16], b: &[u16]) -> usize {
    let (len1, len2) = (a.len(), b.len());
    if len1 == 0 || len2 == 0 {
        return 0;
    }
    let text1 = if len1 > len2 { &a[len1 - len2..] } else { a };
    let text2 = if len1 < len2 { &b[..len1] } else { b };
    let text_len = len1.min(len2) as isize;
    if text1 == text2 {
        return text_len as usize;
    }
    let mut best = 0;
    let mut length: isize = 1;
    loop {
        let pattern = sub_from(text1, text_len - length);
        let Some(found) = index_of(text2, pattern, 0) else {
            return best;
        };
        length += found as isize;
        if found == 0 || sub_from(text1, text_len - length) == sub(text2, 0, length) {
            best = length as usize;
            length += 1;
        }
    }
}

type HalfMatch = [Vec<u16>; 5];

fn half_match(a: &[u16], b: &[u16]) -> Option<HalfMatch> {
    let (long, short) = if a.len() > b.len() { (a, b) } else { (b, a) };
    if long.len() < 4 || short.len() * 2 < long.len() {
        return None;
    }
    let first = half_match_at(long, short, long.len().div_ceil(4));
    let second = half_match_at(long, short, long.len().div_ceil(2));
    let [long_a, long_b, short_a, short_b, mid] = match (first, second) {
        (Some(first), Some(second)) => {
            if first[4].len() > second[4].len() {
                first
            } else {
                second
            }
        }
        (Some(found), None) | (None, Some(found)) => found,
        (None, None) => return None,
    };
    Some(if a.len() > b.len() {
        [long_a, long_b, short_a, short_b, mid]
    } else {
        [short_a, short_b, long_a, long_b, mid]
    })
}

fn half_match_at(long: &[u16], short: &[u16], i: usize) -> Option<HalfMatch> {
    let seed = sub(long, i as isize, (i + long.len() / 4) as isize);
    let mut best_common: Vec<u16> = Vec::new();
    let mut best = [Vec::new(), Vec::new(), Vec::new(), Vec::new()];
    let mut from = 0;
    while let Some(j) = index_of(short, seed, from).filter(|_| from <= short.len()) {
        let prefix_len = common_prefix(&long[i..], &short[j..]);
        let suffix_len = common_suffix(&long[..i], &short[..j]);
        if best_common.len() < suffix_len + prefix_len {
            best_common = short[j - suffix_len..j + prefix_len].to_vec();
            best = [
                long[..i - suffix_len].to_vec(),
                long[i + prefix_len..].to_vec(),
                short[..j - suffix_len].to_vec(),
                short[j + prefix_len..].to_vec(),
            ];
        }
        from = j + 1;
    }
    if best_common.len() * 2 >= long.len() {
        let [la, lb, sa, sb] = best;
        Some([la, lb, sa, sb, best_common])
    } else {
        None
    }
}

fn line_mode(a: &[u16], b: &[u16], deadline: f64) -> Vec<Diff> {
    let (chars1, chars2, lines) = lines_to_chars(a, b);
    let mut diffs = do_diff(&chars1, &chars2, false, deadline);
    for diff in &mut diffs {
        diff.1 = diff.1.iter().flat_map(|&code| lines[code as usize].iter().copied()).collect();
    }
    let mut diffs = cleanup_semantic(diffs);

    diffs.push(Diff(Op::Equal, Vec::new()));
    let mut pointer = 0;
    let (mut count_delete, mut count_insert) = (0, 0);
    let (mut text_delete, mut text_insert) = (Vec::new(), Vec::new());
    while pointer < diffs.len() {
        match diffs[pointer].0 {
            Op::Insert => {
                count_insert += 1;
                text_insert.extend_from_slice(&diffs[pointer].1);
            }
            Op::Delete => {
                count_delete += 1;
                text_delete.extend_from_slice(&diffs[pointer].1);
            }
            Op::Equal => {
                if count_delete >= 1 && count_insert >= 1 {
                    let start = pointer - count_delete - count_insert;
                    diffs.drain(start..pointer);
                    pointer = start;
                    let replacement = do_diff(&text_delete, &text_insert, false, deadline);
                    let added = replacement.len();
                    diffs.splice(pointer..pointer, replacement);
                    pointer += added;
                }
                count_insert = 0;
                count_delete = 0;
                text_delete.clear();
                text_insert.clear();
            }
        }
        pointer += 1;
    }
    diffs.pop();
    diffs
}

fn lines_to_chars(a: &[u16], b: &[u16]) -> (Vec<u16>, Vec<u16>, Vec<Vec<u16>>) {
    let mut lines: Vec<Vec<u16>> = vec![Vec::new()];
    let mut hash: HashMap<Vec<u16>, usize> = HashMap::new();
    let chars1 = munge_lines(a, &mut lines, &mut hash, 40_000);
    let chars2 = munge_lines(b, &mut lines, &mut hash, 65_535);
    (chars1, chars2, lines)
}

fn munge_lines(
    text: &[u16],
    lines: &mut Vec<Vec<u16>>,
    hash: &mut HashMap<Vec<u16>, usize>,
    max_lines: usize,
) -> Vec<u16> {
    let mut chars = Vec::new();
    let mut line_start = 0;
    let mut line_end: isize = -1;
    let len = text.len() as isize;
    while line_end < len - 1 {
        line_end = index_of(text, &[u16::from(b'\n')], line_start).map_or(len - 1, |i| i as isize);
        let mut line = text[line_start..(line_end + 1) as usize].to_vec();
        if let Some(&code) = hash.get(&line) {
            chars.push(code as u16);
        } else {
            if lines.len() == max_lines {
                line = text[line_start..].to_vec();
                line_end = len;
            }
            chars.push(lines.len() as u16);
            hash.insert(line.clone(), lines.len());
            lines.push(line);
        }
        line_start = (line_end + 1) as usize;
    }
    chars
}

fn bisect(a: &[u16], b: &[u16], deadline: f64) -> Vec<Diff> {
    let (len1, len2) = (a.len() as isize, b.len() as isize);
    let max_d = (len1 + len2 + 1) / 2;
    let v_offset = max_d;
    let v_length = 2 * max_d;
    let mut v1 = vec![-1isize; (v_length + 2) as usize];
    let mut v2 = v1.clone();
    v1[(v_offset + 1) as usize] = 0;
    v2[(v_offset + 1) as usize] = 0;
    let delta = len1 - len2;
    let front = delta % 2 != 0;
    let char_at = |text: &[u16], i: isize| {
        if i < 0 { None } else { text.get(i as usize).copied() }
    };
    let (mut k1start, mut k1end, mut k2start, mut k2end) = (0, 0, 0, 0);
    for d in 0..max_d {
        if now_ms() > deadline {
            break;
        }
        let mut k1 = -d + k1start;
        while k1 <= d - k1end {
            let k1_offset = (v_offset + k1) as usize;
            let mut x1 = if k1 == -d || (k1 != d && v1[k1_offset - 1] < v1[k1_offset + 1]) {
                v1[k1_offset + 1]
            } else {
                v1[k1_offset - 1] + 1
            };
            let mut y1 = x1 - k1;
            while x1 < len1 && y1 < len2 && char_at(a, x1) == char_at(b, y1) {
                x1 += 1;
                y1 += 1;
            }
            v1[k1_offset] = x1;
            if x1 > len1 {
                k1end += 2;
            } else if y1 > len2 {
                k1start += 2;
            } else if front {
                let k2_offset = v_offset + delta - k1;
                if k2_offset >= 0 && k2_offset < v_length && v2[k2_offset as usize] != -1 {
                    let x2 = len1 - v2[k2_offset as usize];
                    if x1 >= x2 {
                        return bisect_split(a, b, x1 as usize, y1 as usize, deadline);
                    }
                }
            }
            k1 += 2;
        }

        let mut k2 = -d + k2start;
        while k2 <= d - k2end {
            let k2_offset = (v_offset + k2) as usize;
            let mut x2 = if k2 == -d || (k2 != d && v2[k2_offset - 1] < v2[k2_offset + 1]) {
                v2[k2_offset + 1]
            } else {
                v2[k2_offset - 1] + 1
            };
            let mut y2 = x2 - k2;
            while x2 < len1 && y2 < len2 && char_at(a, len1 - x2 - 1) == char_at(b, len2 - y2 - 1) {
                x2 += 1;
                y2 += 1;
            }
            v2[k2_offset] = x2;
            if x2 > len1 {
                k2end += 2;
            } else if y2 > len2 {
                k2start += 2;
            } else if !front {
                let k1_offset = v_offset + delta - k2;
                if k1_offset >= 0 && k1_offset < v_length && v1[k1_offset as usize] != -1 {
                    let x1 = v1[k1_offset as usize];
                    let y1 = v_offset + x1 - k1_offset;
                    x2 = len1 - x2;
                    if x1 >= x2 {
                        return bisect_split(a, b, x1 as usize, y1 as usize, deadline);
                    }
                }
            }
            k2 += 2;
        }
    }
    vec![Diff(Op::Delete, a.to_vec()), Diff(Op::Insert, b.to_vec())]
}

fn bisect_split(a: &[u16], b: &[u16], x: usize, y: usize, deadline: f64) -> Vec<Diff> {
    let mut diffs = do_diff(&a[..x], &b[..y], false, deadline);
    diffs.extend(do_diff(&a[x..], &b[y..], false, deadline));
    diffs
}

/// The stack of equality indices in `cleanupSemantic` and `cleanupEfficiency`. Its length can go
/// negative in JavaScript, which then stores at negative "indices"; that changes which equality a
/// later pass returns to, so it is emulated rather than replaced with a `Vec`.
#[derive(Default)]
struct Equalities {
    items: HashMap<isize, usize>,
    len: isize,
}

impl Equalities {
    fn push(&mut self, index: usize) {
        self.items.insert(self.len, index);
        self.len += 1;
    }

    fn last(&self) -> usize {
        self.items.get(&(self.len - 1)).copied().unwrap_or(0)
    }
}

pub fn cleanup_semantic(mut diffs: Vec<Diff>) -> Vec<Diff> {
    let mut has_changes = false;
    let mut equalities = Equalities::default();
    let mut last_equality: Option<Vec<u16>> = None;
    let mut pointer: isize = 0;
    let (mut insertions1, mut deletions1, mut insertions2, mut deletions2) = (0, 0, 0, 0);
    while (pointer as usize) < diffs.len() {
        let p = pointer as usize;
        if diffs[p].0 == Op::Equal {
            equalities.push(p);
            insertions1 = insertions2;
            deletions1 = deletions2;
            insertions2 = 0;
            deletions2 = 0;
            last_equality = Some(diffs[p].1.clone());
        } else {
            if diffs[p].0 == Op::Insert {
                insertions2 += diffs[p].1.len();
            } else {
                deletions2 += diffs[p].1.len();
            }
            if let Some(equality) = last_equality.clone()
                && !equality.is_empty()
                && equality.len() <= insertions1.max(deletions1)
                && equality.len() <= insertions2.max(deletions2)
            {
                let at = equalities.last();
                diffs.insert(at, Diff(Op::Delete, equality));
                diffs[at + 1].0 = Op::Insert;
                equalities.len -= 2;
                pointer = if equalities.len > 0 { equalities.last() as isize } else { -1 };
                insertions1 = 0;
                deletions1 = 0;
                insertions2 = 0;
                deletions2 = 0;
                last_equality = None;
                has_changes = true;
            }
        }
        pointer += 1;
    }

    if has_changes {
        diffs = cleanup_merge(diffs);
    }
    diffs = cleanup_semantic_lossless(diffs);

    let mut pointer = 1;
    while pointer < diffs.len() {
        if diffs[pointer - 1].0 == Op::Delete && diffs[pointer].0 == Op::Insert {
            let deletion = diffs[pointer - 1].1.clone();
            let insertion = diffs[pointer].1.clone();
            let overlap1 = common_overlap(&deletion, &insertion);
            let overlap2 = common_overlap(&insertion, &deletion);
            let (del_half, ins_half) = (deletion.len() as f64 / 2.0, insertion.len() as f64 / 2.0);
            if overlap1 >= overlap2 {
                if overlap1 as f64 >= del_half || overlap1 as f64 >= ins_half {
                    diffs.insert(pointer, Diff(Op::Equal, insertion[..overlap1].to_vec()));
                    diffs[pointer - 1].1 = deletion[..deletion.len() - overlap1].to_vec();
                    diffs[pointer + 1].1 = insertion[overlap1..].to_vec();
                    pointer += 1;
                }
            } else if overlap2 as f64 >= del_half || overlap2 as f64 >= ins_half {
                diffs.insert(pointer, Diff(Op::Equal, deletion[..overlap2].to_vec()));
                diffs[pointer - 1] = Diff(Op::Insert, insertion[..insertion.len() - overlap2].to_vec());
                diffs[pointer + 1] = Diff(Op::Delete, deletion[overlap2..].to_vec());
                pointer += 1;
            }
            pointer += 1;
        }
        pointer += 1;
    }
    diffs
}

fn is_alphanumeric(unit: u16) -> bool {
    matches!(unit, 0x30..=0x39 | 0x41..=0x5a | 0x61..=0x7a)
}

/// JavaScript's `\s`.
fn is_whitespace(unit: u16) -> bool {
    matches!(
        unit,
        0x09..=0x0d
            | 0x20
            | 0xa0
            | 0x1680
            | 0x2000..=0x200a
            | 0x2028
            | 0x2029
            | 0x202f
            | 0x205f
            | 0x3000
            | 0xfeff
    )
}

const CR: u16 = b'\r' as u16;
const LF: u16 = b'\n' as u16;

fn ends_with_blank_line(text: &[u16]) -> bool {
    text.ends_with(&[LF, LF]) || text.ends_with(&[LF, CR, LF])
}

fn starts_with_blank_line(text: &[u16]) -> bool {
    [&[LF, LF][..], &[CR, LF, LF], &[LF, CR, LF], &[CR, LF, CR, LF]].iter().any(|prefix| text.starts_with(prefix))
}

fn semantic_score(one: &[u16], two: &[u16]) -> u8 {
    let (Some(&char1), Some(&char2)) = (one.last(), two.first()) else {
        return 6;
    };
    let non_alphanumeric1 = !is_alphanumeric(char1);
    let non_alphanumeric2 = !is_alphanumeric(char2);
    let whitespace1 = non_alphanumeric1 && is_whitespace(char1);
    let whitespace2 = non_alphanumeric2 && is_whitespace(char2);
    let line_break1 = whitespace1 && (char1 == CR || char1 == LF);
    let line_break2 = whitespace2 && (char2 == CR || char2 == LF);
    let blank_line1 = line_break1 && ends_with_blank_line(one);
    let blank_line2 = line_break2 && starts_with_blank_line(two);
    if blank_line1 || blank_line2 {
        5
    } else if line_break1 || line_break2 {
        4
    } else if non_alphanumeric1 && !whitespace1 && whitespace2 {
        3
    } else if whitespace1 || whitespace2 {
        2
    } else if non_alphanumeric1 || non_alphanumeric2 {
        1
    } else {
        0
    }
}

pub fn cleanup_semantic_lossless(mut diffs: Vec<Diff>) -> Vec<Diff> {
    let mut pointer: isize = 1;
    while pointer >= 1 && (pointer as usize) + 1 < diffs.len() {
        let p = pointer as usize;
        if diffs[p - 1].0 == Op::Equal && diffs[p + 1].0 == Op::Equal {
            let mut equality1 = diffs[p - 1].1.clone();
            let mut edit = diffs[p].1.clone();
            let mut equality2 = diffs[p + 1].1.clone();

            let common = common_suffix(&equality1, &edit);
            if common > 0 {
                let common_string = edit[edit.len() - common..].to_vec();
                equality1.truncate(equality1.len() - common);
                edit = concat(&[&common_string, &edit[..edit.len() - common]]);
                equality2 = concat(&[&common_string, &equality2]);
            }

            let mut best_equality1 = equality1.clone();
            let mut best_edit = edit.clone();
            let mut best_equality2 = equality2.clone();
            let mut best_score = semantic_score(&equality1, &edit) + semantic_score(&edit, &equality2);
            while !edit.is_empty() && edit.first() == equality2.first() {
                equality1.push(edit[0]);
                edit.remove(0);
                edit.push(equality2.remove(0));
                let score = semantic_score(&equality1, &edit) + semantic_score(&edit, &equality2);
                if score >= best_score {
                    best_score = score;
                    best_equality1 = equality1.clone();
                    best_edit = edit.clone();
                    best_equality2 = equality2.clone();
                }
            }

            if diffs[p - 1].1 != best_equality1 {
                if best_equality1.is_empty() {
                    diffs.remove(p - 1);
                    pointer -= 1;
                } else {
                    diffs[p - 1].1 = best_equality1;
                }
                let p = pointer as usize;
                diffs[p].1 = best_edit;
                if best_equality2.is_empty() {
                    diffs.remove(p + 1);
                    pointer -= 1;
                } else {
                    diffs[p + 1].1 = best_equality2;
                }
            }
        }
        pointer += 1;
    }
    diffs
}

pub fn cleanup_merge(mut diffs: Vec<Diff>) -> Vec<Diff> {
    diffs.push(Diff(Op::Equal, Vec::new()));
    let mut pointer = 0;
    let (mut count_delete, mut count_insert) = (0, 0);
    let (mut text_delete, mut text_insert): (Vec<u16>, Vec<u16>) = (Vec::new(), Vec::new());
    while pointer < diffs.len() {
        match diffs[pointer].0 {
            Op::Insert => {
                count_insert += 1;
                text_insert.extend_from_slice(&diffs[pointer].1);
                pointer += 1;
            }
            Op::Delete => {
                count_delete += 1;
                text_delete.extend_from_slice(&diffs[pointer].1);
                pointer += 1;
            }
            Op::Equal => {
                if count_delete + count_insert > 1 {
                    if count_delete != 0 && count_insert != 0 {
                        let common = common_prefix(&text_insert, &text_delete);
                        if common != 0 {
                            let start = pointer - count_delete - count_insert;
                            if start > 0 && diffs[start - 1].0 == Op::Equal {
                                diffs[start - 1].1.extend_from_slice(&text_insert[..common]);
                            } else {
                                diffs.insert(0, Diff(Op::Equal, text_insert[..common].to_vec()));
                                pointer += 1;
                            }
                            text_insert.drain(..common);
                            text_delete.drain(..common);
                        }
                        let common = common_suffix(&text_insert, &text_delete);
                        if common != 0 {
                            let moved = concat(&[&text_insert[text_insert.len() - common..], &diffs[pointer].1]);
                            diffs[pointer].1 = moved;
                            text_insert.truncate(text_insert.len() - common);
                            text_delete.truncate(text_delete.len() - common);
                        }
                    }
                    pointer -= count_delete + count_insert;
                    diffs.drain(pointer..pointer + count_delete + count_insert);
                    if !text_delete.is_empty() {
                        diffs.insert(pointer, Diff(Op::Delete, text_delete.clone()));
                        pointer += 1;
                    }
                    if !text_insert.is_empty() {
                        diffs.insert(pointer, Diff(Op::Insert, text_insert.clone()));
                        pointer += 1;
                    }
                    pointer += 1;
                } else if pointer != 0 && diffs[pointer - 1].0 == Op::Equal {
                    let text = diffs.remove(pointer).1;
                    diffs[pointer - 1].1.extend(text);
                } else {
                    pointer += 1;
                }
                count_insert = 0;
                count_delete = 0;
                text_delete.clear();
                text_insert.clear();
            }
        }
    }
    if diffs.last().is_some_and(|last| last.1.is_empty()) {
        diffs.pop();
    }

    let mut has_changes = false;
    let mut pointer = 1;
    while pointer + 1 < diffs.len() {
        if diffs[pointer - 1].0 == Op::Equal && diffs[pointer + 1].0 == Op::Equal {
            let previous = diffs[pointer - 1].1.clone();
            let next = diffs[pointer + 1].1.clone();
            let current = diffs[pointer].1.clone();
            if current.ends_with(&previous) {
                diffs[pointer].1 = concat(&[&previous, &current[..current.len() - previous.len()]]);
                diffs[pointer + 1].1 = concat(&[&previous, &next]);
                diffs.remove(pointer - 1);
                has_changes = true;
            } else if current.starts_with(&next) {
                diffs[pointer - 1].1.extend_from_slice(&next);
                diffs[pointer].1 = concat(&[&current[next.len()..], &next]);
                diffs.remove(pointer + 1);
                has_changes = true;
            }
        }
        pointer += 1;
    }
    if has_changes { cleanup_merge(diffs) } else { diffs }
}

pub fn cleanup_efficiency(mut diffs: Vec<Diff>) -> Vec<Diff> {
    const EDIT_COST: usize = 4;
    let mut has_changes = false;
    let mut equalities = Equalities::default();
    let mut last_equality: Option<Vec<u16>> = None;
    let mut pointer: isize = 0;
    let (mut pre_ins, mut pre_del, mut post_ins, mut post_del) = (false, false, false, false);
    while (pointer as usize) < diffs.len() {
        let p = pointer as usize;
        if diffs[p].0 == Op::Equal {
            if diffs[p].1.len() < EDIT_COST && (post_ins || post_del) {
                equalities.push(p);
                pre_ins = post_ins;
                pre_del = post_del;
                last_equality = Some(diffs[p].1.clone());
            } else {
                equalities.len = 0;
                last_equality = None;
            }
            post_ins = false;
            post_del = false;
        } else {
            if diffs[p].0 == Op::Delete {
                post_del = true;
            } else {
                post_ins = true;
            }
            let flags = [pre_ins, pre_del, post_ins, post_del];
            let true_count = flags.iter().filter(|flag| **flag).count();
            if let Some(equality) = last_equality.clone()
                && !equality.is_empty()
                && ((pre_ins && pre_del && post_ins && post_del) || (equality.len() < EDIT_COST / 2 && true_count == 3))
            {
                let at = equalities.last();
                diffs.insert(at, Diff(Op::Delete, equality));
                diffs[at + 1].0 = Op::Insert;
                equalities.len -= 1;
                last_equality = None;
                if pre_ins && pre_del {
                    post_ins = true;
                    post_del = true;
                    equalities.len = 0;
                } else {
                    equalities.len -= 1;
                    pointer = if equalities.len > 0 { equalities.last() as isize } else { -1 };
                    post_ins = false;
                    post_del = false;
                }
                has_changes = true;
            }
        }
        pointer += 1;
    }
    if has_changes { cleanup_merge(diffs) } else { diffs }
}

fn split_char(data: &[u16], dir: isize) -> (Vec<u16>, Option<u16>) {
    match (dir, data) {
        (_, []) => (Vec::new(), None),
        (1, _) => (data[..data.len() - 1].to_vec(), data.last().copied()),
        _ => (data[1..].to_vec(), data.first().copied()),
    }
}

fn combine_char(data: &[u16], unit: Option<u16>, dir: isize) -> Vec<u16> {
    let unit: Vec<u16> = unit.into_iter().collect();
    if dir == 1 { concat(&[data, &unit]) } else { concat(&[&unit, data]) }
}

/// `Array.prototype.splice(index, 0, item)`, where a negative index counts from the end.
fn splice_insert(diffs: &mut Vec<Diff>, index: isize, item: Diff) {
    let len = diffs.len() as isize;
    let at = if index < 0 { (len + index).max(0) } else { index.min(len) };
    diffs.insert(at as usize, item);
}

fn deisolate_char(diffs: &mut Vec<Diff>, i: usize, dir: isize) {
    let inv = -dir;
    let mut insert_idx: Option<usize> = None;
    let mut delete_idx: Option<usize> = None;
    let mut j = i as isize + dir;
    while j >= 0 && (j as usize) < diffs.len() && (insert_idx.is_none() || delete_idx.is_none()) {
        let ju = j as usize;
        if diffs[ju].1.is_empty() {
            j += dir;
            continue;
        }
        match diffs[ju].0 {
            Op::Insert => {
                insert_idx.get_or_insert(ju);
                j += dir;
            }
            Op::Delete => {
                delete_idx.get_or_insert(ju);
                j += dir;
            }
            Op::Equal => {
                if insert_idx.is_none() && delete_idx.is_none() {
                    let (rest, unit) = split_char(&diffs[i].1, dir);
                    diffs[i].1 = rest;
                    diffs[ju].1 = combine_char(&diffs[ju].1, unit, inv);
                    return;
                }
                break;
            }
        }
    }

    if let (Some(ins), Some(del)) = (insert_idx, delete_idx) {
        let shared = if dir == 1 {
            diffs[ins].1.last() == diffs[del].1.last()
        } else {
            diffs[ins].1.first() == diffs[del].1.first()
        };
        if shared {
            let (insert_text, insert_char) = split_char(&diffs[ins].1, inv);
            let (delete_text, _) = split_char(&diffs[del].1, inv);
            diffs[ins].1 = insert_text;
            diffs[del].1 = delete_text;
            diffs[i].1 = combine_char(&diffs[i].1, insert_char, dir);
            return;
        }
    }

    let (text, unit) = split_char(&diffs[i].1, dir);
    diffs[i].1 = text;
    let unit_text: Vec<u16> = unit.into_iter().collect();

    let mut delete_idx = delete_idx.map(|d| d as isize);
    match insert_idx {
        None => {
            splice_insert(diffs, j, Diff(Op::Insert, unit_text.clone()));
            if let Some(d) = delete_idx
                && d >= j
            {
                delete_idx = Some(d + 1);
            }
        }
        Some(ins) => diffs[ins].1 = combine_char(&diffs[ins].1, unit, inv),
    }
    match delete_idx {
        None => splice_insert(diffs, j, Diff(Op::Delete, unit_text)),
        Some(del) => {
            let del = del as usize;
            diffs[del].1 = combine_char(&diffs[del].1, unit, inv);
        }
    }
}

fn adjust_diff_for_surrogate_pairs(diffs: &mut Vec<Diff>) {
    let mut i = 0;
    while i < diffs.len() {
        let Diff(op, text) = &diffs[i];
        if let (Some(&first), Some(&last)) = (text.first(), text.last()) {
            let op = *op;
            if is_high_surrogate(last) && op == Op::Equal {
                deisolate_char(diffs, i, 1);
            }
            if is_low_surrogate(first) && op == Op::Equal {
                deisolate_char(diffs, i, -1);
            }
        }
        i += 1;
    }
    let mut i = 0;
    while i < diffs.len() {
        if diffs[i].1.is_empty() {
            diffs.remove(i);
        }
        i += 1;
    }
}

pub fn x_index(diffs: &[Diff], location: usize) -> usize {
    let (mut chars1, mut chars2, mut last_chars1, mut last_chars2) = (0, 0, 0, 0);
    let mut x = 0;
    while x < diffs.len() {
        if diffs[x].0 != Op::Insert {
            chars1 += diffs[x].1.len();
        }
        if diffs[x].0 != Op::Delete {
            chars2 += diffs[x].1.len();
        }
        if chars1 > location {
            break;
        }
        last_chars1 = chars1;
        last_chars2 = chars2;
        x += 1;
    }
    if x != diffs.len() && diffs[x].0 == Op::Delete {
        return last_chars2;
    }
    last_chars2 + (location - last_chars1)
}

fn diff_text1(diffs: &[Diff]) -> Vec<u16> {
    diffs.iter().filter(|d| d.0 != Op::Insert).flat_map(|d| d.1.iter().copied()).collect()
}

fn diff_text2(diffs: &[Diff]) -> Vec<u16> {
    diffs.iter().filter(|d| d.0 != Op::Delete).flat_map(|d| d.1.iter().copied()).collect()
}

fn levenshtein(diffs: &[Diff]) -> usize {
    let (mut leven, mut insertions, mut deletions) = (0, 0, 0);
    for Diff(op, data) in diffs {
        match op {
            Op::Insert => insertions += data.len(),
            Op::Delete => deletions += data.len(),
            Op::Equal => {
                leven += insertions.max(deletions);
                insertions = 0;
                deletions = 0;
            }
        }
    }
    leven + insertions.max(deletions)
}

// --- match ------------------------------------------------------------------------------------

fn match_main(text: &[u16], pattern: &[u16], search_location: isize) -> isize {
    let loc = search_location.min(text.len() as isize).max(0);
    if text == pattern {
        return 0;
    }
    if text.is_empty() {
        return -1;
    }
    if sub(text, loc, loc + pattern.len() as isize) == pattern {
        return loc;
    }
    bitap(text, pattern, loc as usize)
}

fn bitap(text: &[u16], pattern: &[u16], loc: usize) -> isize {
    if pattern.len() > MAX_BITS {
        return -1;
    }
    const THRESHOLD: f64 = 0.5;
    const DISTANCE: f64 = 1000.0;
    let pattern_len = pattern.len();
    let mut alphabet: HashMap<u16, i32> = HashMap::new();
    for (i, unit) in pattern.iter().enumerate() {
        *alphabet.entry(*unit).or_insert(0) |= 1i32.wrapping_shl((pattern_len - i - 1) as u32);
    }
    let loc_i = loc as isize;
    let score = |errors: usize, x: isize| errors as f64 / pattern_len as f64 + (loc_i - x).abs() as f64 / DISTANCE;

    let mut score_threshold = THRESHOLD;
    if let Some(best) = index_of(text, pattern, loc) {
        score_threshold = score(0, best as isize).min(score_threshold);
        if let Some(best) = last_index_of(text, pattern, (loc + pattern_len) as isize) {
            score_threshold = score(0, best as isize).min(score_threshold);
        }
    }

    let match_mask = 1i32.wrapping_shl((pattern_len - 1) as u32);
    let mut best_loc: isize = -1;
    let mut bin_max = (pattern_len + text.len()) as isize;
    let mut last_rd: Vec<i32> = Vec::new();
    let at = |v: &[i32], i: usize| v.get(i).copied().unwrap_or(0);
    for d in 0..pattern_len {
        let mut bin_min = 0;
        let mut bin_mid = bin_max;
        while bin_min < bin_mid {
            if score(d, loc_i + bin_mid) <= score_threshold {
                bin_min = bin_mid;
            } else {
                bin_max = bin_mid;
            }
            bin_mid = (bin_max - bin_min) / 2 + bin_min;
        }
        bin_max = bin_mid;
        let mut start = (loc_i - bin_mid + 1).max(1);
        let finish = (loc_i + bin_mid).min(text.len() as isize) as usize + pattern_len;

        let mut rd = vec![0i32; finish + 2];
        rd[finish + 1] = 1i32.wrapping_shl(d as u32).wrapping_sub(1);
        let mut j = finish as isize;
        while j >= start {
            let ju = j as usize;
            let char_match = text.get(ju - 1).and_then(|unit| alphabet.get(unit)).copied().unwrap_or(0);
            rd[ju] = if d == 0 {
                ((rd[ju + 1] << 1) | 1) & char_match
            } else {
                (((rd[ju + 1] << 1) | 1) & char_match)
                    | (((at(&last_rd, ju + 1) | at(&last_rd, ju)) << 1) | 1)
                    | at(&last_rd, ju + 1)
            };
            if rd[ju] & match_mask != 0 {
                let candidate = score(d, j - 1);
                if candidate <= score_threshold {
                    score_threshold = candidate;
                    best_loc = j - 1;
                    if best_loc > loc_i {
                        start = (2 * loc_i - best_loc).max(1);
                    } else {
                        break;
                    }
                }
            }
            j -= 1;
        }
        if score(d + 1, loc_i) > score_threshold {
            break;
        }
        last_rd = rd;
    }
    best_loc
}

// --- patch ------------------------------------------------------------------------------------

/// `makePatches(a, b)`.
pub fn make_patches(a: &[u16], b: &[u16]) -> Vec<Patch> {
    let mut diffs = diff(a, b, true);
    if diffs.len() > 2 {
        diffs = cleanup_semantic(diffs);
        diffs = cleanup_efficiency(diffs);
    }
    make_from_diffs(a, &diffs)
}

fn make_from_diffs(text: &[u16], diffs: &[Diff]) -> Vec<Patch> {
    if diffs.is_empty() {
        return Vec::new();
    }
    let mut patches = Vec::new();
    let mut patch = Patch::new(0, 0);
    let mut patch_diff_len = 0;
    let (mut char_count1, mut char_count2, mut utf8_count1, mut utf8_count2) = (0, 0, 0, 0);
    let mut prepatch = text.to_vec();
    let mut postpatch = text.to_vec();

    for (x, current) in diffs.iter().enumerate() {
        let Diff(op, diff_text) = current;
        let len = diff_text.len() as isize;
        let bytes = count_utf8_bytes(diff_text);

        if patch_diff_len == 0 && *op != Op::Equal {
            patch.start1 = char_count1;
            patch.start2 = char_count2;
            patch.utf8_start1 = utf8_count1;
            patch.utf8_start2 = utf8_count2;
        }

        match op {
            Op::Insert => {
                patch.diffs.push(current.clone());
                patch_diff_len += 1;
                patch.length2 += len;
                patch.utf8_length2 += bytes;
                postpatch = concat(&[sub(&postpatch, 0, char_count2), diff_text, sub_from(&postpatch, char_count2)]);
            }
            Op::Delete => {
                patch.length1 += len;
                patch.utf8_length1 += bytes;
                patch.diffs.push(current.clone());
                patch_diff_len += 1;
                postpatch = concat(&[sub(&postpatch, 0, char_count2), sub_from(&postpatch, char_count2 + len)]);
            }
            Op::Equal => {
                if len <= 2 * MARGIN && patch_diff_len != 0 && diffs.len() != x + 1 {
                    patch.diffs.push(current.clone());
                    patch_diff_len += 1;
                    patch.length1 += len;
                    patch.length2 += len;
                    patch.utf8_length1 += bytes;
                    patch.utf8_length2 += bytes;
                } else if len >= 2 * MARGIN && patch_diff_len != 0 {
                    add_context(&mut patch, &prepatch);
                    patches.push(std::mem::replace(&mut patch, Patch::new(-1, -1)));
                    patch_diff_len = 0;
                    prepatch = postpatch.clone();
                    char_count1 = char_count2;
                    utf8_count1 = utf8_count2;
                }
            }
        }

        if *op != Op::Insert {
            char_count1 += len;
            utf8_count1 += bytes;
        }
        if *op != Op::Delete {
            char_count2 += len;
            utf8_count2 += bytes;
        }
    }

    if patch_diff_len != 0 {
        add_context(&mut patch, &prepatch);
        patches.push(patch);
    }
    patches
}

fn add_context(patch: &mut Patch, text: &[u16]) {
    if text.is_empty() {
        return;
    }
    let mut pattern = sub(text, patch.start2, patch.start2 + patch.length1).to_vec();
    let mut padding = 0;
    while index_of(text, &pattern, 0) != last_index_of(text, &pattern, isize::MAX)
        && (pattern.len() as isize) < MAX_BITS as isize - MARGIN - MARGIN
    {
        padding += MARGIN;
        pattern = sub(text, patch.start2 - padding, patch.start2 + patch.length1 + padding).to_vec();
    }
    padding += MARGIN;

    let mut prefix_start = patch.start2 - padding;
    if prefix_start >= 1 && text.get(prefix_start as usize).is_some_and(|u| is_low_surrogate(*u)) {
        prefix_start -= 1;
    }
    let prefix = sub(text, prefix_start, patch.start2).to_vec();
    let prefix_len = prefix.len() as isize;
    let prefix_bytes = count_utf8_bytes(&prefix);
    if !prefix.is_empty() {
        patch.diffs.insert(0, Diff(Op::Equal, prefix));
    }

    let mut suffix_end = patch.start2 + patch.length1 + padding;
    if suffix_end < text.len() as isize && is_low_surrogate(text[suffix_end as usize]) {
        suffix_end += 1;
    }
    let suffix = sub(text, patch.start2 + patch.length1, suffix_end).to_vec();
    let suffix_len = suffix.len() as isize;
    let suffix_bytes = count_utf8_bytes(&suffix);
    if !suffix.is_empty() {
        patch.diffs.push(Diff(Op::Equal, suffix));
    }

    patch.start1 -= prefix_len;
    patch.start2 -= prefix_len;
    patch.utf8_start1 -= prefix_bytes;
    patch.utf8_start2 -= prefix_bytes;
    patch.length1 += prefix_len + suffix_len;
    patch.length2 += prefix_len + suffix_len;
    patch.utf8_length1 += prefix_bytes + suffix_bytes;
    patch.utf8_length2 += prefix_bytes + suffix_bytes;
}

/// `applyPatches(patches, text, {allowExceedingIndices: true})`: the patched text and whether
/// each patch applied.
pub fn apply(patches: &[Patch], original: &[u16]) -> (Vec<u16>, Vec<bool>) {
    if patches.is_empty() {
        return (original.to_vec(), Vec::new());
    }
    let mut parsed = adjust_indices_to_ucs2(patches, original);
    let null_padding = add_padding(&mut parsed);
    let mut text = concat(&[&null_padding, original, &null_padding]);
    split_max(&mut parsed);

    const DELETE_THRESHOLD: f64 = 0.4;
    let mut delta: isize = 0;
    let mut results = Vec::with_capacity(parsed.len());
    for patch in &parsed {
        let expected_loc = patch.start2 + delta;
        let text1 = diff_text1(&patch.diffs);
        let text1_len = text1.len() as isize;
        let mut end_loc: isize = -1;
        let start_loc = if text1.len() > MAX_BITS {
            let start = match_main(&text, &text1[..MAX_BITS], expected_loc);
            if start == -1 {
                -1
            } else {
                end_loc =
                    match_main(&text, &text1[text1.len() - MAX_BITS..], expected_loc + text1_len - MAX_BITS as isize);
                if end_loc == -1 || start >= end_loc { -1 } else { start }
            }
        } else {
            match_main(&text, &text1, expected_loc)
        };

        if start_loc == -1 {
            results.push(false);
            delta -= patch.length2 - patch.length1;
            continue;
        }
        results.push(true);
        delta = start_loc - expected_loc;
        let text2 = if end_loc == -1 {
            sub(&text, start_loc, start_loc + text1_len).to_vec()
        } else {
            sub(&text, start_loc, end_loc + MAX_BITS as isize).to_vec()
        };
        if text1 == text2 {
            text =
                concat(&[sub(&text, 0, start_loc), &diff_text2(&patch.diffs), sub_from(&text, start_loc + text1_len)]);
            continue;
        }
        let diffs = diff(&text1, &text2, false);
        if text1.len() > MAX_BITS && levenshtein(&diffs) as f64 / text1.len() as f64 > DELETE_THRESHOLD {
            *results.last_mut().expect("pushed above") = false;
            continue;
        }
        let diffs = cleanup_semantic_lossless(diffs);
        let mut index1 = 0;
        let mut index2 = 0;
        for Diff(op, data) in &patch.diffs {
            if *op != Op::Equal {
                index2 = x_index(&diffs, index1) as isize;
            }
            match op {
                Op::Insert => {
                    text = concat(&[sub(&text, 0, start_loc + index2), data, sub_from(&text, start_loc + index2)]);
                }
                Op::Delete => {
                    let end = x_index(&diffs, index1 + data.len()) as isize;
                    text = concat(&[sub(&text, 0, start_loc + index2), sub_from(&text, start_loc + end)]);
                }
                Op::Equal => {}
            }
            if *op != Op::Delete {
                index1 += data.len();
            }
        }
    }
    let padding = null_padding.len() as isize;
    let text = sub(&text, padding, text.len() as isize - padding).to_vec();
    (text, results)
}

fn adjust_indices_to_ucs2(patches: &[Patch], base: &[u16]) -> Vec<Patch> {
    let mut byte_offset = 0;
    let mut idx = 0;
    let mut advance_to = |target: isize| {
        while byte_offset < target {
            let Some(code_point) = code_point_at(base, idx) else {
                return idx as isize;
            };
            byte_offset += utf8_len(code_point);
            idx += if code_point > 0xffff { 2 } else { 1 };
        }
        idx as isize
    };
    patches
        .iter()
        .map(|patch| {
            let start1 = advance_to(patch.start1);
            let start2 = advance_to(patch.start2);
            Patch { start1, start2, ..patch.clone() }
        })
        .collect()
}

fn add_padding(patches: &mut [Patch]) -> Vec<u16> {
    let padding_len = MARGIN;
    let null_padding: Vec<u16> = (1..=padding_len as u16).collect();
    for p in patches.iter_mut() {
        p.start1 += padding_len;
        p.start2 += padding_len;
        p.utf8_start1 += padding_len;
        p.utf8_start2 += padding_len;
    }

    let first = &mut patches[0];
    match first.diffs.first() {
        Some(Diff(Op::Equal, text)) if padding_len > text.len() as isize => {
            let first_len = text.len() as isize;
            let extra = padding_len - first_len;
            first.diffs[0].1 = concat(&[&null_padding[first_len as usize..], &first.diffs[0].1]);
            first.start1 -= extra;
            first.start2 -= extra;
            first.utf8_start1 -= extra;
            first.utf8_start2 -= extra;
            first.length1 += extra;
            first.length2 += extra;
            first.utf8_length1 += extra;
            first.utf8_length2 += extra;
        }
        Some(Diff(Op::Equal, _)) => {}
        _ => {
            first.diffs.insert(0, Diff(Op::Equal, null_padding.clone()));
            first.start1 -= padding_len;
            first.start2 -= padding_len;
            first.utf8_start1 -= padding_len;
            first.utf8_start2 -= padding_len;
            first.length1 += padding_len;
            first.length2 += padding_len;
            first.utf8_length1 += padding_len;
            first.utf8_length2 += padding_len;
        }
    }

    let last = patches.last_mut().expect("at least one patch");
    match last.diffs.last() {
        Some(Diff(Op::Equal, text)) if padding_len > text.len() as isize => {
            let extra = padding_len - text.len() as isize;
            let last_diff = last.diffs.len() - 1;
            last.diffs[last_diff].1.extend_from_slice(&null_padding[..extra as usize]);
            last.length1 += extra;
            last.length2 += extra;
            last.utf8_length1 += extra;
            last.utf8_length2 += extra;
        }
        Some(Diff(Op::Equal, _)) => {}
        _ => {
            last.diffs.push(Diff(Op::Equal, null_padding.clone()));
            last.length1 += padding_len;
            last.length2 += padding_len;
            last.utf8_length1 += padding_len;
            last.utf8_length2 += padding_len;
        }
    }
    null_padding
}

fn split_max(patches: &mut Vec<Patch>) {
    let patch_size = MAX_BITS as isize;
    let mut x: isize = 0;
    while (x as usize) < patches.len() {
        if patches[x as usize].length1 <= patch_size {
            x += 1;
            continue;
        }
        let mut bigpatch = patches.remove(x as usize);
        x -= 1;
        let mut start1 = bigpatch.start1;
        let mut start2 = bigpatch.start2;
        let mut pre_context: Vec<u16> = Vec::new();
        while !bigpatch.diffs.is_empty() {
            let pre_len = pre_context.len() as isize;
            let mut patch = Patch::new(start1 - pre_len, start2 - pre_len);
            let mut empty = true;
            if !pre_context.is_empty() {
                let bytes = count_utf8_bytes(&pre_context);
                patch.length1 = pre_len;
                patch.utf8_length1 = bytes;
                patch.length2 = pre_len;
                patch.utf8_length2 = bytes;
                patch.diffs.push(Diff(Op::Equal, pre_context.clone()));
            }
            while !bigpatch.diffs.is_empty() && patch.length1 < patch_size - MARGIN {
                let op = bigpatch.diffs[0].0;
                let text = bigpatch.diffs[0].1.clone();
                let len = text.len() as isize;
                if op == Op::Insert {
                    patch.length2 += len;
                    patch.utf8_length2 += count_utf8_bytes(&text);
                    start2 += len;
                    patch.diffs.push(bigpatch.diffs.remove(0));
                    empty = false;
                } else if op == Op::Delete
                    && patch.diffs.len() == 1
                    && patch.diffs[0].0 == Op::Equal
                    && len > 2 * patch_size
                {
                    patch.length1 += len;
                    patch.utf8_length1 += count_utf8_bytes(&text);
                    start1 += len;
                    empty = false;
                    patch.diffs.push(Diff(op, text));
                    bigpatch.diffs.remove(0);
                } else {
                    let piece = sub(&text, 0, patch_size - patch.length1 - MARGIN).to_vec();
                    let piece_len = piece.len() as isize;
                    let bytes = count_utf8_bytes(&piece);
                    patch.length1 += piece_len;
                    patch.utf8_length1 += bytes;
                    start1 += piece_len;
                    if op == Op::Equal {
                        patch.length2 += piece_len;
                        patch.utf8_length2 += bytes;
                        start2 += piece_len;
                    } else {
                        empty = false;
                    }
                    if piece == bigpatch.diffs[0].1 {
                        bigpatch.diffs.remove(0);
                    } else {
                        bigpatch.diffs[0].1.drain(..piece.len());
                    }
                    patch.diffs.push(Diff(op, piece));
                }
            }
            let context = diff_text2(&patch.diffs);
            pre_context = sub_from(&context, context.len() as isize - MARGIN).to_vec();
            let post_context = sub(&diff_text1(&bigpatch.diffs), 0, MARGIN).to_vec();
            if !post_context.is_empty() {
                let len = post_context.len() as isize;
                let bytes = count_utf8_bytes(&post_context);
                patch.length1 += len;
                patch.length2 += len;
                patch.utf8_length1 += bytes;
                patch.utf8_length2 += bytes;
                match patch.diffs.last_mut() {
                    Some(Diff(Op::Equal, text)) => text.extend_from_slice(&post_context),
                    _ => patch.diffs.push(Diff(Op::Equal, post_context)),
                }
            }
            if !empty {
                x += 1;
                patches.insert(x as usize, patch);
            }
        }
        x += 1;
    }
}

// --- stringify / parse ------------------------------------------------------------------------

fn coords(start: isize, length: isize) -> String {
    match length {
        0 => format!("{start},0"),
        1 => format!("{}", start + 1),
        _ => format!("{},{length}", start + 1),
    }
}

/// `stringifyPatches`.
pub fn stringify(patches: &[Patch]) -> Result<String, DmpError> {
    let mut out = String::new();
    for patch in patches {
        out.push_str(&format!(
            "@@ -{} +{} @@\n",
            coords(patch.utf8_start1, patch.utf8_length1),
            coords(patch.utf8_start2, patch.utf8_length2)
        ));
        for Diff(op, text) in &patch.diffs {
            out.push(match op {
                Op::Insert => '+',
                Op::Delete => '-',
                Op::Equal => ' ',
            });
            out.push_str(&encode_uri(text)?);
            out.push('\n');
        }
    }
    Ok(out.replace("%20", " "))
}

const URI_UNESCAPED: &[u8] = b"-_.!~*'();/?:@&=+$,#";
const URI_RESERVED: &[u8] = b";/?:@&=+$,#";

fn encode_uri(text: &[u16]) -> Result<String, DmpError> {
    let mut out = String::with_capacity(text.len());
    for unit in char::decode_utf16(text.iter().copied()) {
        let ch = unit.map_err(|_| DmpError("URI malformed".into()))?;
        if ch.is_ascii_alphanumeric() || (ch.is_ascii() && URI_UNESCAPED.contains(&(ch as u8))) {
            out.push(ch);
        } else {
            let mut buf = [0; 4];
            for byte in ch.encode_utf8(&mut buf).bytes() {
                out.push_str(&format!("%{byte:02X}"));
            }
        }
    }
    Ok(out)
}

fn hex_byte(text: &[u8], at: usize) -> Option<u8> {
    if text.get(at) != Some(&b'%') {
        return None;
    }
    let digits = std::str::from_utf8(text.get(at + 1..at + 3)?).ok()?;
    u8::from_str_radix(digits, 16).ok()
}

fn decode_uri(text: &str) -> Result<Vec<u16>, DmpError> {
    let malformed = || DmpError("URI malformed".into());
    let bytes = text.as_bytes();
    let mut out = Vec::with_capacity(text.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] != b'%' {
            let ch = text[i..].chars().next().expect("in bounds");
            let mut buf = [0; 2];
            out.extend_from_slice(ch.encode_utf16(&mut buf));
            i += ch.len_utf8();
            continue;
        }
        let first = hex_byte(bytes, i).ok_or_else(malformed)?;
        if first < 0x80 {
            if URI_RESERVED.contains(&first) {
                out.extend(text[i..i + 3].encode_utf16());
            } else {
                out.push(u16::from(first));
            }
            i += 3;
            continue;
        }
        let count = match first {
            0xc0..=0xdf => 2,
            0xe0..=0xef => 3,
            0xf0..=0xf7 => 4,
            _ => return Err(malformed()),
        };
        let mut sequence = vec![first];
        for k in 1..count {
            let byte = hex_byte(bytes, i + 3 * k).ok_or_else(malformed)?;
            if byte & 0xc0 != 0x80 {
                return Err(malformed());
            }
            sequence.push(byte);
        }
        let ch = std::str::from_utf8(&sequence).ok().and_then(|s| s.chars().next()).ok_or_else(malformed)?;
        let mut buf = [0; 2];
        out.extend_from_slice(ch.encode_utf16(&mut buf));
        i += 3 * count;
    }
    Ok(out)
}

/// The `@@ -a,b +c,d @@` header: `(a, b, c, d)` with the optional lengths as `None`.
fn parse_header(line: &str) -> Option<(isize, Option<String>, isize, Option<String>)> {
    let rest = line.strip_prefix("@@ -")?.strip_suffix(" @@")?;
    let (left, right) = rest.split_once(" +")?;
    let side = |part: &str| -> Option<(isize, Option<String>)> {
        let digits_end = part.find(|c: char| !c.is_ascii_digit()).unwrap_or(part.len());
        if digits_end == 0 {
            return None;
        }
        let start = part[..digits_end].parse().ok()?;
        let tail = &part[digits_end..];
        let tail = tail.strip_prefix(',').unwrap_or(tail);
        if !tail.chars().all(|c| c.is_ascii_digit()) {
            return None;
        }
        Some((start, Some(tail.to_owned()).filter(|t| !t.is_empty())))
    };
    let (start1, len1) = side(left)?;
    let (start2, len2) = side(right)?;
    Some((start1, len1, start2, len2))
}

/// `parsePatch`.
pub fn parse(text: &str) -> Result<Vec<Patch>, DmpError> {
    if text.is_empty() {
        return Ok(Vec::new());
    }
    let lines: Vec<&str> = text.split('\n').collect();
    let mut patches = Vec::new();
    let mut pointer = 0;
    while pointer < lines.len() {
        let (start1, len1, start2, len2) = parse_header(lines[pointer])
            .ok_or_else(|| DmpError(format!("Invalid patch string: {}", lines[pointer])))?;
        let mut patch = Patch::new(start1, start2);
        let lengths = |len: Option<String>| -> Result<(isize, bool), DmpError> {
            match len.as_deref() {
                None => Ok((1, true)),
                Some("0") => Ok((0, false)),
                Some(n) => n.parse().map(|n| (n, true)).map_err(|_| DmpError(format!("Invalid patch length: {n}"))),
            }
        };
        let (length1, shift1) = lengths(len1)?;
        if shift1 {
            patch.start1 -= 1;
            patch.utf8_start1 -= 1;
        }
        patch.length1 = length1;
        patch.utf8_length1 = length1;
        let (length2, shift2) = lengths(len2)?;
        if shift2 {
            patch.start2 -= 1;
            patch.utf8_start2 -= 1;
        }
        patch.length2 = length2;
        patch.utf8_length2 = length2;
        pointer += 1;

        while pointer < lines.len() {
            let line = lines[pointer];
            let Some(sign) = line.chars().next() else {
                pointer += 1;
                continue;
            };
            if sign == '@' {
                break;
            }
            let body = decode_uri(&line[sign.len_utf8()..])
                .map_err(|_| DmpError(format!("Illegal escape in parse: {line}")))?;
            let utf8_diff = count_utf8_bytes(&body) - body.len() as isize;
            match sign {
                '-' => {
                    patch.diffs.push(Diff(Op::Delete, body));
                    patch.length1 -= utf8_diff;
                }
                '+' => {
                    patch.diffs.push(Diff(Op::Insert, body));
                    patch.length2 -= utf8_diff;
                }
                ' ' => {
                    patch.diffs.push(Diff(Op::Equal, body));
                    patch.length1 -= utf8_diff;
                    patch.length2 -= utf8_diff;
                }
                _ => return Err(DmpError(format!("Invalid patch mode \"{sign}\" in: {line}"))),
            }
            pointer += 1;
        }
        patches.push(patch);
    }
    Ok(patches)
}

#[cfg(test)]
mod tests {
    use super::*;

    struct Rng(u64);

    impl Rng {
        fn below(&mut self, n: usize) -> usize {
            self.0 ^= self.0 << 13;
            self.0 ^= self.0 >> 7;
            self.0 ^= self.0 << 17;
            (self.0 % n as u64) as usize
        }

        /// `text` with a few random insertions and deletions, from an alphabet small enough to
        /// make repeated text likely.
        fn edit(&mut self, text: &str) -> String {
            let mut units = utf16(text);
            for _ in 0..=self.below(4) {
                let at = self.below(units.len() + 1);
                if self.below(2) == 0 && at < units.len() {
                    let end = (at + 1 + self.below(3)).min(units.len());
                    units.drain(at..end);
                } else {
                    let inserted: Vec<u16> = (0..=self.below(3)).map(|_| u16::from(b"ab "[self.below(3)])).collect();
                    units.splice(at..at, inserted);
                }
            }
            to_string(&units)
        }
    }

    #[test]
    fn merging_keeps_both_sides() {
        assert_eq!(merge("The fox", "The quick fox", "The fox jumps"), "The quick fox jumps");
        assert_eq!(merge("The brown fox", "The fox", "The brown fox!"), "The fox!");
        // Both typed a word into the same gap: the words stay whole, theirs first
        assert_eq!(merge("a b", "a one b", "a two b"), "a two one b");
        // Ours continues the word before the gap, theirs starts the word after it
        assert_eq!(merge("ab cd", "abX cd", "ab Ycd"), "abX Ycd");
        assert_eq!(merge("ab cd", "ab Ycd", "abX cd"), "abX Ycd");
    }

    #[test]
    fn merged_edits_rebase_onto_the_other_side() {
        let mut rng = Rng(7);
        for _ in 0..2000 {
            let base = rng.edit("ab ba ab");
            let (ours, theirs) = (rng.edit(&base), rng.edit(&base));
            let (merged, rebased) = merge_edits(&base, &Edits::between(&base, &ours), &theirs);
            assert_eq!(rebased.apply(&theirs), merged, "{base:?} {ours:?} {theirs:?}");
            assert_eq!(merge(&base, &base, &theirs), theirs);
            assert_eq!(merge(&base, &ours, &base), ours);
            assert_eq!(Edits::between(&base, &ours).apply(&base), ours);
            if let Some(patch) = Edits::between(&base, &ours).patch(&base) {
                assert_eq!(apply_patch_string(&patch, &base).unwrap(), ours);
            }
        }
    }

    #[test]
    fn corrections_turn_the_result_into_the_intended_text() {
        let mut rng = Rng(11);
        for _ in 0..2000 {
            let base = rng.edit("ab ba ab");
            let (got, want) = (rng.edit(&base), rng.edit(&base));
            assert_eq!(Edits::correcting(&base, &got, &want).apply(&got), want, "{base:?} {got:?} {want:?}");
        }
        // A word Content Lake put in the wrong gap moves back, the text around it stays put
        let edits = Edits::correcting("one two", "one tw mineo", "one mine two");
        assert_eq!(edits.apply("one tw mineo"), "one mine two");
    }

    #[test]
    fn carets_stay_left_of_text_inserted_at_them() {
        assert_eq!(map_caret("ab", "aXb", 1), 1);
        assert_eq!(map_caret("ab", "Xab", 1), 2);
        assert_eq!(map_caret("abc", "ac", 2), 1);
        assert_eq!(map_caret("abc", "abcd", 3), 3);
    }
}
