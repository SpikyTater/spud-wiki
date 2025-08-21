/*Spud Wiki Engine
Copyright (C) 2025  SpikyTater

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.*/
import { ContributorFromString } from "./contributors.js";
import { MEDIA_ASSETS } from "./media_assets.js";

/**
 * @typedef Token
 * @property {number | undefined} raw_token_length 
 */
const TOKENS = {
  newline: {
    must_be_child_of_root: true,
    raw_token_length: 1,
  },
  text: {
    raw_token_length: 1,
  },
  backslash: {
    raw_token_length: 1,
    cant_appear_in_finalized_list: true,
  },
  em: {
    raw_token_length: 1,
  },
  em_aggregate: { // handled
    can_have_children: true,
    is_processed_token: true,
    started_by: "em",
    ended_by: "em",
    needs_children: true,
  },
  bold: {
    raw_token_length: 2,
  },
  bold_aggregate: { // handled
    can_have_children: true,
    is_processed_token: true,
    started_by: "bold",
    ended_by: "bold",
    needs_children: true,
  },
  embold: {
    raw_token_length: 3,
  },
  embold_aggregate: {
    can_have_children: true,
    is_processed_token: true,
    started_by: "embold",
    ended_by: "embold",
    needs_children: true,
  },
  strikethrough: {
    raw_token_length: 2,
  },
  strikethrough_aggregate: {
    can_have_children: true,
    is_processed_token: true,
    started_by: "strikethrough",
    ended_by: "strikethrough",
    needs_children: true,
  },
  blockquote: {
    must_be_child_of_root: true,
    raw_token_length: 1,
  },
  blockquote_aggregate: {
    can_have_children: true,
    must_be_child_of_root: true,
    is_processed_token: true,
    started_by: "blockquote",
    ended_by: "newline",
    needs_children: true,
  },
  directive_start: {},
  directive: {
    can_have_children: true,
    is_processed_token: true,
    must_be_child_of_root: true,
    started_by: "directive_start",
    ended_by: "newline",
  },
  internal_link: { // TODO
    can_have_children: true,
    is_processed_token: true,
    only_one_text_child_allowed: true,
    started_by: "internal_link_start",
    ended_by: "internal_link_end",
    needs_children: true,
  },
  internal_link_start: {
    raw_token_length: 1,
  },
  internal_link_end: {
    raw_token_length: 1,
  },
  external_link: {
    can_have_children: true,
    is_processed_token: true,
    only_one_text_child_allowed: true,
    started_by: "external_link_start",
    ended_by: "external_link_end",
    needs_children: true,
  },
  external_link_start: {
    raw_token_length: 2,
  },
  external_link_end: {
    raw_token_length: 2,
  },
  embedded_file: { // TODO
    can_have_children: true,
    is_processed_token: true,
    only_one_text_child_allowed: true,
    started_by: "embedded_file_start",
    ended_by: "embedded_file_end",
    needs_children: true,
  },
  embedded_file_start: {
    raw_token_length: 3,
  },
  embedded_file_end: {
    raw_token_length: 3,
  },
  note_ref: { // handled
    can_have_children: true,
    is_processed_token: true,
    only_one_text_child_allowed: true,
    started_by: "note_ref_start",
    ended_by: "note_ref_end",
    needs_children: true,
  },
  note_ref_start: {
    raw_token_length: 1,
  },
  note_ref_end: {
    raw_token_length: 1,
  },
  html_element: { // handled
    is_processed_token: true,
  },
  html_container: { // handled
    can_have_children: true,
    is_processed_token: true,
  },
  html_text: { // handled
    is_processed_token: true,
  },
  ast_root: {
    can_have_children: true,
    is_processed_token: true,
  },
  heading2: {
    raw_token_length: 2,
  },
  heading3: {
    raw_token_length: 3,
  },
  heading4: {
    raw_token_length: 4,
  },
  heading5: {
    raw_token_length: 5,
  },
  heading6: {
    raw_token_length: 6,
  },
  heading2_aggregate: { // handled
    only_one_text_child_allowed: true,
    can_have_children: true,
    is_processed_token: true,
    must_be_child_of_root: true,
    started_by: "heading2",
    ended_by: "heading2",
  },
  heading3_aggregate: {
    only_one_text_child_allowed: true,
    can_have_children: true,
    is_processed_token: true,
    must_be_child_of_root: true,
    started_by: "heading3",
    ended_by: "heading3",
  },
  heading4_aggregate: {
    only_one_text_child_allowed: true,
    can_have_children: true,
    is_processed_token: true,
    must_be_child_of_root: true,
    started_by: "heading4",
    ended_by: "heading4",
  },
  heading5_aggregate: {
    only_one_text_child_allowed: true,
    can_have_children: true,
    is_processed_token: true,
    must_be_child_of_root: true,
    started_by: "heading5",
    ended_by: "heading5",
  },
  heading6_aggregate: {
    only_one_text_child_allowed: true,
    can_have_children: true,
    is_processed_token: true,
    must_be_child_of_root: true,
    started_by: "heading6",
    ended_by: "heading6",
  },
};

function PostProcessTokensGlobal() {
  for (const token_name in TOKENS) {
    const raw_token = TOKENS[token_name];
    raw_token.name = token_name;

    if (raw_token.started_by) {
      raw_token.started_by = TOKENS[raw_token.started_by];
      raw_token.started_by.starts = raw_token;
      if (!raw_token.started_by) {
        throw 0;
      }
    }

    if (raw_token.ended_by) {
      raw_token.ended_by = TOKENS[raw_token.ended_by];
      if (!raw_token.ended_by) {
        throw 0;
      }
      raw_token.ended_by.ends = raw_token;
    }
  }
}

PostProcessTokensGlobal();

class TokenInstance {

  /**
   * @type {any} any of the values inside the global constant TOKENS
   */
  raw_token;

  /**
   * @type {number[]}
   */
  code_point_array;

  /**
   * @type {number}
   */
  original_src_start_index;

  /**
   * @type {number}
   */
  original_src_end_index;

  /**
   * @type {TokenInstance[]}
   */
  children = [];

  /**
   * @type {TokenInstance}
   */
  parent;

  /**
   * @type {TokenInstance}
   */
  next_sibling;

  /**
   * @type {TokenInstance}
   */
  prev_sibling;

  /**
   * @type {TokenInstance}
   */
  aggregate_starter_token_instance;

  /**
   * @type {TokenInstance}
   */
  aggregate_ender_token_instance;

  /**
   * @param {any} raw_token any of the values inside the global constant TOKENS
   */
  constructor(raw_token) {
    this.raw_token = raw_token;
    this.name = raw_token.name;
  }

  GetTokenLength() {
    return this.code_point_array?.length ?? 0;
  }

  GetRawString() {
    return this.code_point_array?.length ? String.fromCodePoint(...this.code_point_array) : "";
  }

  /**
   * @param {any} raw_token any of the values inside the global constant TOKENS
   * @returns {boolean}
   */
  IsInstanceOf(raw_token) {
    return raw_token === this.raw_token;
  }

  /**
   * @param {SpudTextContext} ctx
   * @param {RawTokenInstance} raw_token_instance
   */
  static CreateFromRawInstance(ctx, raw_token_instance) {
    const token_inst = new TokenInstance(raw_token_instance.raw_token);
    //token_inst.raw_token = raw_token_instance.raw_token;
    token_inst.code_point_array = ctx.src_text.slice(raw_token_instance.start_index, raw_token_instance.end_index);
    token_inst.original_src_start_index = raw_token_instance.start_index;
    token_inst.original_src_end_index = raw_token_instance.end_index;

    return token_inst;
  }

  /**
   * @param {any} raw_token any of the values inside the global constant TOKENS
   */
  static CreateFromRawToken(raw_token) {
    const token_inst = new TokenInstance(raw_token);
    //token_inst.raw_token = raw_token;

    return token_inst;
  }

  /**
   * Adds a new child at index 'index',while shifting all children 
   * from 'index' until the end by one. Leaving 'index' undefined
   * will add it at the end of the children array.
   * 
   * @param {TokenInstance} token_instance 
   * @param {number | undefined} index 
   */
  AddChild(token_instance, index) {
    if (!this.raw_token.can_have_children) {
      console.error(`Trying to add a child (${token_instance.raw_token.name} at index ${token_instance.original_src_start_index}) to a token instance that cannot have children. ('${this.raw_token.name}')`);
      throw 0;
    }

    const { children } = this;
    index ??= children.length;

    if (typeof index !== "number") {
      console.error("C'mon now, how.");
      throw 0;
    }

    const prev_index = index - 1, next_index = index + 1;

    children.splice(index, 0, token_instance);

    if (prev_index >= 0) {
      const prev_child = children[prev_index];
      prev_child.next_sibling = token_instance;
      token_instance.prev_sibling = prev_child;
    }

    if (next_index < children.length) {
      const next_child = children[next_index];
      next_child.prev_sibling = token_instance;
      token_instance.next_sibling = next_child;
    }

    token_instance.parent = this;
  }

  GetFirstChild() {
    return this.children.length ? this.children[0] : undefined;
  }

  GetLastChild() {
    return this.children.length ? this.children[this.children.length - 1] : undefined;
  }

  /**
   * @param {TokenInstance} token_instance_to_switch_with 
   */
  RemoveSelfAndChildrenFromAST(token_instance_to_switch_with) {
    const { parent, next_sibling, prev_sibling } = this;
    if (parent) {
      const idx = parent.children.indexOf(this);

      if (token_instance_to_switch_with) {
        parent.children.splice(idx, 1, token_instance_to_switch_with);
        token_instance_to_switch_with.parent = parent;
      } else {
        parent.children.splice(idx, 1);
      }
      delete this.parent;
    }

    if (next_sibling) {
      if (token_instance_to_switch_with) {
        next_sibling.prev_sibling = token_instance_to_switch_with;
        token_instance_to_switch_with.next_sibling = next_sibling;
      } else {
        next_sibling.prev_sibling = prev_sibling;
      }
      delete this.next_sibling;
    }

    if (prev_sibling) {
      if (token_instance_to_switch_with) {
        prev_sibling.next_sibling = token_instance_to_switch_with;
        token_instance_to_switch_with.prev_sibling = prev_sibling;
      } else {
        prev_sibling.next_sibling = next_sibling;
      }
      delete this.prev_sibling;
    }
  }

  DepthFirstPostOrderFirst() {
    // assuming this is the AST root
    if (!this.IsInstanceOf(TOKENS.ast_root)) {
      console.error("NO.");
      throw 0;
    }

    let n = this;

    while (n.GetFirstChild()) {
      n = n.GetFirstChild();
    }

    return n;
  }

  DepthFirstPostOrderNext() {
    if (this.next_sibling) {
      let n = this.next_sibling;

      while (n.GetFirstChild()) {
        n = n.GetFirstChild();
      }

      return n;
    } else {
      // no next sibing, use parent
      return this.parent;
    }
  }

  ReverseDepthFirstPostOrderFirst() {
    // assuming this is the AST root
    if (!this.IsInstanceOf(TOKENS.ast_root)) {
      console.error("NO.");
      throw 0;
    }
    return this;
  }

  ReverseDepthFirstPostOrderNext() {
    if (this.children.length) {
      return this.children[this.children.length - 1];
    }
    if (this.prev_sibling) {
      return this.prev_sibling;
    }

    let n = this.parent;
    while (n && !n.prev_sibling) {
      n = n.parent;
    }

    return n?.prev_sibling;
  }
}

class RawTokenInstance {
  /**
   * @type {any} any of the values inside the global constant TOKENS
   */
  raw_token;

  /**
   * @type {number}
   */
  start_index;

  /**
   * @type {number}
   */
  end_index;

  /**
   * @param {any} raw_token any of the values inside the global constant TOKENS
   * @param {number} src_index
   * @param {number | undefined} raw_token_length
   */
  constructor(raw_token, src_index, raw_token_length) {
    // I don't care if 'raw_token' is valid, performance and lazyness reasons
    // src_index will be checked inside Finalize()

    raw_token_length ??= raw_token.raw_token_length;
    if (typeof raw_token_length !== "number") {
      console.error("SpudTextContext: raw_token_length is not a number", { raw_token, src_index, raw_token_length });
      throw 0;
    }

    this.raw_token = raw_token;
    this.start_index = src_index;
    this.end_index = src_index + raw_token_length;
  }

  /**
   * @param {SpudTextContext}
   * @returns {TokenInstance}
   */
  GetFinalizedInstance(ctx) {
    return TokenInstance.CreateFromRawInstance(ctx, this);
  }

  /**
   * @param {any} raw_token any of the values inside the global constant TOKENS
   * @returns {boolean}
   */
  IsInstanceOf(raw_token) {
    return raw_token === this.raw_token;
  }

}

/**
 * This class contains the processed SpudText, ready to be turned into HTML
 */
class SpudText {
  title = "";

  /**
   * @type {TokenInstance[]}
   */
  directive_instances = [];

  /**
   * @type {Map<string, TokenInstance[]>}
   */
  directive_instances_map = new Map();

  /**
   * @type {any[]} array of contributors from 'CONTRIBUTORS' in contributors.js
   */
  contributors = [];

  /**
   * @type {TokenInstance}
   */
  html_tree_root;

  /**
   * @type {number}
   */
  time_taken;

  /**
   * @type {string | undefined}
   */
  html_string;

  /**
   * @type {boolean}
   */
  do_center_title = false;

  /**
   * @type {boolean}
   */
  make_blue_red = false;

  /**
   * @type {boolean}
   */
  no_search_index = false;

  /**
   * @type {boolean}
   */
  no_edit = false;

  /**
   * @type {string[]}
   */
  commands = [];

  /**
   * Sets the title of this page
   * @param {string} title_string 
   */
  SetTitle(title_string) {
    if (typeof title_string !== "string" && !(title_string instanceof String)) {
      console.error("Dev error, again.");
      throw 0;
    }
    if (this.title.length) {
      console.error("What are you even doing.");
      throw 0;
    }
    this.title = title_string;
  }

  /**
   * @param {TokenInstance} directive_instance 
   */
  AddAndElaborateDirectiveInstance(directive_instance) {
    if (!directive_instance.IsInstanceOf(TOKENS.directive)) {
      console.error("Pls no.");
      throw 0;
    }

    let real_directive_name = directive_instance.aggregate_starter_token_instance.GetRawString().substring(1);

    let real_directive_subname = "";

    if (real_directive_name.startsWith("note")) {
      // it's a note
      real_directive_subname = real_directive_name.substring(4);
      real_directive_name = "note";
    }

    directive_instance.real_directive_name = real_directive_name;
    directive_instance.real_directive_subname = real_directive_subname;

    this.directive_instances.push(directive_instance);

    const mapped_array = this.directive_instances_map.get(real_directive_name);

    if (mapped_array) {
      mapped_array.push(directive_instance);
    } else {
      this.directive_instances_map.set(real_directive_name, [directive_instance]);
    }
  }

  /**
   * @param {any} contributor this comes straight from 'CONTRIBUTORS'
   */
  AddContributor(contributor) {
    this.contributors.push(contributor);
  }

  /**
   * @param {TokenInstance} tree 
   */
  SetHtmlTree(tree) {
    this.html_tree_root = tree;
  }

  /**
   * @param {number} ms 
   */
  SetTimeTakenMs(ms) {
    this.time_taken = ms;
  }

  /**
   * @returns {string}
   */
  GetTimeTakenMsString() {
    return this.time_taken.toFixed(3) + " ms";
  }

  GetTitleHtmlString() {
    if (this.do_center_title) {
      return `<h1 class="_title" style="text-align:center">${this.title}</h1>`;
    } else {
      return `<h1 class="_title">${this.title}</h1>`;
    }
  }

  GetHtmlString() {
    if (this.html_string) {
      return this.html_string;
    }

    return this.html_string = this.#Htmlify(this.html_tree_root.children);
  }

  /**
   * 
   * @param {string} s 
   * @returns {string}
   */
  #EscapeContent(s) {
    s = s.replaceAll("<", "&lt;");
    s = s.replaceAll(">", "&gt;");

    return s;
  }

  /**
   * 
   * @param {TokenInstance} html_tokens 
   * @returns {string}
   */
  #Htmlify(html_tokens) {
    let s = "";

    for (const token of html_tokens) {
      switch (token.raw_token) {
        case TOKENS.html_container:
          s += `<${token.tag} ${token.id ? 'id="' + token.id + '"' : ""} ${token.title ? 'title="' + token.title + '"' : ""} ${token.class ? 'class="' + token.class + '"' : ""} ${token.href ? 'href="' + token.href + '"' : ""} ${token.src ? 'src="' + token.src + '"' : ""} ${token.style ? 'style="' + token.style + '"' : ""}>`;
          s += this.#Htmlify(token.children);
          s += `</${token.tag}>`
          break;
        case TOKENS.html_element:
          // TODO: this is a hack. I hate it with every fiber of my being
          if (token.tag !== "h1") {
            s += `<${token.tag} ${token.id ? 'id="' + token.id + '"' : ""} ${token.title ? 'title="' + token.title + '"' : ""} ${token.class ? 'class="' + token.class + '"' : ""} ${token.href ? 'href="' + token.href + '"' : ""} ${token.src ? 'src="' + token.src + '"' : ""} ${token.style ? 'style="' + token.style + '"' : ""}`;

            if (token.ext_link) {
              s += ' target="_blank" rel="noopener noreferrer"';
            }
            s += ">";
            s += this.#EscapeContent(token.content);
            s += `</${token.tag}>`
          }
          break;
        case TOKENS.html_text:
          s += this.#EscapeContent(token.content);
          break;
        default:
          //sigh
          //  console.error("why...", this.title);

          throw "YOU CAN'T BE HERE, C'MON!"
      }
    }

    return s;
  }

}

/**
 * This class is used to parse raw strings into a format the program can understand
 */
class SpudTextContext {
  static SEGMENTER = Intl?.Segmenter && new Intl.Segmenter("en", { granularity: "grapheme" });

  static LOG_LEVEL_VERBOSE = 0;
  static LOG_LEVEL_WARN = 1;
  static LOG_LEVEL_ERROR = 2;

  /**
   * @type {number}
   */
  start_timestamp;

  /**
   * @type {number}
   */
  end_timestamp;

  /**
   * @type {number[]}
   */
  src_text;

  /**
   * @type {Function[]}
   */
  verbose_callbacks = [];

  /**
   * @type {Function[]}
   */
  warn_callbacks = [];

  /**
   * @type {Function[]}
   */
  error_callbacks = [];

  /**
   * @type {RawTokenInstance[]}
   */
  raw_tokens = [];

  /**
   * @type {TokenInstance[]}
   */
  tokens = [];

  /**
   * @type {TokenInstance}
   */
  ast = TokenInstance.CreateFromRawToken(TOKENS.ast_root);

  spudtext = new SpudText();

  /**
   * @param {string} src_text 
   * @param {any} options 
   */
  constructor(src_text, options) {
    const DEFAULT_OPTIONS = {
      verbose_callbacks: [],
      warn_callbacks: [
        function (data) {
          console.warn(`SpudTextContext: ${data}`);
        }
      ],
      error_callbacks: [
        function (data) {
          console.error(`SpudTextContext: ${data}`);
        }
      ],
    };

    options ||= DEFAULT_OPTIONS;
    options.verbose_callbacks ||= DEFAULT_OPTIONS.verbose_callbacks;
    options.warn_callbacks ||= DEFAULT_OPTIONS.warn_callbacks;
    options.error_callbacks ||= DEFAULT_OPTIONS.error_callbacks;

    if (typeof src_text !== "string" && !(src_text instanceof String)) {
      console.error(`SpudTextContext: 'src_text' must be a string, but instead it is`, src_text);
      throw 0;
    }

    if (0 === src_text.length) {
      console.error(`SpudTextContext: 'src_text' must be a non-empty string.`);
      throw 0;
    }

    /**
     * We use this function to account for complex unicode characters
     * Also soory, I ain't adding lodash just to use its split function
     * @param {string} src_text 
     * @returns {number[]}
     */
    function GetCodePointArray(src_text) {
      if (SpudTextContext.SEGMENTER) {
        const segments = SpudTextContext.SEGMENTER.segment(src_text);
        return [...segments].map(s => s.segment.codePointAt(0));
      }
      return Array.from(src_text).map(c => c.codePointAt(0));
    }

    this.src_text = GetCodePointArray(src_text);

    function CheckIfArrayOfFunctions(arr) {
      if (!Array.isArray(arr)) {
        console.error("SpudTextContext: not an array.");
        throw 0;
      }

      for (const fn of arr) {
        if (typeof fn !== "function") {
          console.error("SpudTextContext: callback is not a function.");
          throw 0;
        }
      }

      return arr;
    }

    this.verbose_callbacks = CheckIfArrayOfFunctions(options.verbose_callbacks);
    this.warn_callbacks = CheckIfArrayOfFunctions(options.warn_callbacks);
    this.error_callbacks = CheckIfArrayOfFunctions(options.error_callbacks);
  }

  /**
   * @param {number} log_level 
   * @param {string} message 
   */
  #LogInternal(log_level, message) {
    let s;

    /**
     * @type {any[]}
     */
    let cbs;
    switch (log_level) {
      case SpudTextContext.LOG_LEVEL_VERBOSE:
        cbs = this.verbose_callbacks;
        s = "Verbose: " + message;
        break;
      case SpudTextContext.LOG_LEVEL_WARN:
        cbs = this.warn_callbacks;
        s = "Warning: " + message;
        break;
      case SpudTextContext.LOG_LEVEL_ERROR:
        cbs = this.error_callbacks;
        s = "Error:   " + message;
        break;
      default:
        console.error("Why did this even happen.");
        throw 0;
    }

    for (const cb of cbs) {
      cb(s);
    }
  }

  /**
   * @param {string} message 
   */
  LogVerbose(message) {
    this.#LogInternal(SpudTextContext.LOG_LEVEL_VERBOSE, message);
  }

  /**
   * @param {string} message 
   */
  LogWarn(message) {
    this.#LogInternal(SpudTextContext.LOG_LEVEL_WARN, message);
  }

  /**
   * @param {string} message 
   */
  LogError(message) {
    this.#LogInternal(SpudTextContext.LOG_LEVEL_ERROR, message);
  }

  /**
   * @param {any} raw_token any of the values inside the global constant TOKENS
   * @param {number} src_index
   * @param {number | undefined} raw_token_length
   */
  #AddToken(raw_token, src_index, raw_token_length) {
    this.raw_tokens.push(new RawTokenInstance(raw_token, src_index, raw_token_length));
  }

  /**
   * @param {any} raw_token any of the values inside the global constant TOKENS
   */
  #PreviousTokenEquals(raw_token) {
    const t = this.raw_tokens, l = t.length;
    return l !== 0 && t[l - 1].IsInstanceOf(raw_token);
  }

  /**
   * @param {any} raw_token any of the values inside the global constant TOKENS
   * @param {number} src_index
   * @param {number | undefined} raw_token_length
   */
  #MergeSameOrAddToken(raw_token, src_index, raw_token_length) {
    const t = this.raw_tokens, l = t.length;
    if (0 === l) {
      this.#AddToken(raw_token, src_index, raw_token_length);
      return;
    }
    const lt = t[l - 1];
    if (lt.IsInstanceOf(raw_token) && lt.end_index === src_index) {
      // the argument 'raw_token_length' can still be undefined
      lt.end_index += raw_token_length ?? raw_token.raw_token_length;
    } else {
      this.#AddToken(raw_token, src_index, raw_token_length);
    }
  }

  /**
   * There is no possibility of this function failing.
   * Or at least I hope so...
   */
  #TokenizeSource() {
    const t = this.raw_tokens, code_point_array = this.src_text, l = code_point_array.length;
    let i = 0, c;

    for (i = 0; i < l; i++) {
      c = code_point_array[i];

      if (c === 10) {
        // \n
        this.#AddToken(TOKENS.newline, i);
        continue;
      } else if (c === 13) {
        // \r, would like to ignore, but everything stopped working. I have no idea why
        this.#AddToken(TOKENS.newline, i);
        continue;
      } else if (c <= 32) {
        // other whitespaces
        this.#MergeSameOrAddToken(TOKENS.text, i);
        continue;
      }

      // not a whitespace
      switch (c) {
        case 33: // !
          // directives
          if (i === 0 || this.#PreviousTokenEquals(TOKENS.newline)) {
            const start_index = i;

            // at i we have !, now let's skip until a whitespace or EOF
            while (++i < l && code_point_array[i] > 32);

            // code_point_array[i] is now either a whitespace or EOF
            // so token ends at i, including the code point just before it
            this.#AddToken(TOKENS.directive_start, start_index, i - start_index);

            // decrease i because we want to tokenize the eventual whitespace
            // since it could be a newline
            i--;
          } else {
            this.#MergeSameOrAddToken(TOKENS.text, i);
          }
          continue;
        case 35: // #
          if (this.#PreviousTokenEquals(TOKENS.backslash)) {
            t.pop();
            this.#MergeSameOrAddToken(TOKENS.text, i);
          } else {
            if (i + 1 < l && 35 === code_point_array[i + 1]) {
              this.#AddToken(TOKENS.strikethrough, i);
              i += 1;
            } else {
              this.#MergeSameOrAddToken(TOKENS.text, i);
            }
          }
          continue;
        case 42: // *
          // em, bold or embold
          if (this.#PreviousTokenEquals(TOKENS.backslash)) {
            t.pop();
            this.#MergeSameOrAddToken(TOKENS.text, i);
            continue;
          }
          if (i + 1 < l && 42 === code_point_array[i + 1]) {
            // bold or embold
            if (i + 2 < l && 42 === code_point_array[i + 2]) {
              // embold
              this.#AddToken(TOKENS.embold, i);
              i += 2;
            } else {
              // bold
              this.#AddToken(TOKENS.bold, i);
              i += 1;
            }
          } else {
            // em
            this.#AddToken(TOKENS.em, i);
          }
          continue;
        case 61: // =
          // headings
          if (this.#PreviousTokenEquals(TOKENS.backslash)) {
            t.pop();
            this.#MergeSameOrAddToken(TOKENS.text, i);
            continue;
          }
          // Larry forgive me for this...
          if (i + 1 < l && 61 === code_point_array[i + 1]) {
            // heading23456
            if (i + 2 < l && 61 === code_point_array[i + 2]) {
              // heading3456
              if (i + 3 < l && 61 === code_point_array[i + 3]) {
                // heading456
                if (i + 4 < l && 61 === code_point_array[i + 4]) {
                  // heading456
                  if (i + 4 < l && 61 === code_point_array[i + 4]) {
                    // heading6
                    this.#AddToken(TOKENS.heading6, i);
                    i += 5;
                  } else {
                    // heading5
                    this.#AddToken(TOKENS.heading5, i);
                    i += 4;
                  }
                } else {
                  // heading4
                  this.#AddToken(TOKENS.heading4, i);
                  i += 3;
                }
              } else {
                // heading3
                this.#AddToken(TOKENS.heading3, i);
                i += 2;
              }
            } else {
              // heading2
              this.#AddToken(TOKENS.heading2, i);
              i += 1;
            }
          } else {
            // text
            this.#MergeSameOrAddToken(TOKENS.text, i);
          }
          continue;
        case 62: // >
          if (this.#PreviousTokenEquals(TOKENS.newline)) {
            this.#AddToken(TOKENS.blockquote, i);
          } else {
            this.#MergeSameOrAddToken(TOKENS.text, i);
          }
          continue;
        case 91: // [
          // internal_link_start, external_link_start or embedded_file_start

          if (this.#PreviousTokenEquals(TOKENS.backslash)) {
            t.pop();
            this.#MergeSameOrAddToken(TOKENS.text, i);
            continue;
          }
          if (i + 1 < l && 91 === code_point_array[i + 1]) {
            // external_link_start or embedded_file_start
            if (i + 2 < l && 91 === code_point_array[i + 2]) {
              // embedded_file_start
              this.#AddToken(TOKENS.embedded_file_start, i);
              i += 2;
            } else {
              // external_link_start
              this.#AddToken(TOKENS.external_link_start, i);
              i += 1;
            }
          } else {
            // internal_link_start
            this.#AddToken(TOKENS.internal_link_start, i);
          }
          continue;
        case 92: // backslash
          if (this.#PreviousTokenEquals(TOKENS.backslash)) {
            t.pop();
            this.#MergeSameOrAddToken(TOKENS.text, i);
          } else {
            this.#AddToken(TOKENS.backslash, i);
          }
          continue;
        case 93: // ]
          // internal_link_end, external_link_end or embedded_file_end

          if (this.#PreviousTokenEquals(TOKENS.backslash)) {
            t.pop();
            this.#MergeSameOrAddToken(TOKENS.text, i);
            continue;
          }
          if (i + 1 < l && 93 === code_point_array[i + 1]) {
            // external_link_end or embedded_file_end
            if (i + 2 < l && 93 === code_point_array[i + 2]) {
              // embedded_file_end
              this.#AddToken(TOKENS.embedded_file_end, i);
              i += 2;
            } else {
              // external_link_end
              this.#AddToken(TOKENS.external_link_end, i);
              i += 1;
            }
          } else {
            // internal_link_end
            this.#AddToken(TOKENS.internal_link_end, i);
          }
          continue;
        case 123: // {
          if (this.#PreviousTokenEquals(TOKENS.backslash)) {
            t.pop();
            this.#MergeSameOrAddToken(TOKENS.text, i);
          } else {
            this.#AddToken(TOKENS.note_ref_start, i);
          }
          continue;
        case 125: // }
          if (this.#PreviousTokenEquals(TOKENS.backslash)) {
            t.pop();
            this.#MergeSameOrAddToken(TOKENS.text, i);
          } else {
            this.#AddToken(TOKENS.note_ref_end, i);
          }
          continue;
        default:
          this.#MergeSameOrAddToken(TOKENS.text, i);
          continue;
      }
    } // big for end

    // directives end with new lines, this is to help when the last
    // line of a file is a directive
    this.src_text.push(10);
    this.#AddToken(TOKENS.newline, i);
  }

  /**
   * @param {TokenInstance[] | undefined} tokens 
   * @param {number | undefined} indent
   */
  #StringifyTokens(tokens, indent) {
    tokens ||= this.tokens;
    indent ||= 0;

    const indent_str = " ".repeat(indent);

    let s = "";
    for (const token of tokens) {
      s += `${indent_str}${token.raw_token.name} - ${token.original_src_start_index || token.start_index}, ${token.original_src_end_index || token.end_index}`

      /*if (!token.IsInstanceOf(TOKENS.newline) && token.GetTokenLength() < 20) {
        s += " - '" + token.GetRawString() + "'";
      }*/

      s += "\n";
      if (Array.isArray(token.children)) {
        s += this.#StringifyTokens(token.children, indent + 2);
      }
    }

    return s;
  }

  /**
   * @param {TokenInstance[] | undefined} tokens 
   */
  #DebugPrintTokens(tokens) {
    console.log(this.#StringifyTokens(tokens));
  }

  #MakeASTFromTokens() {
    const { ast, tokens } = this, aggregate_stack = [ast], l = tokens.length;
    /**
     * @type {TokenInstance}
     */
    let stack_top_token_instance = ast;

    /**
     * @param {TokenInstance} token_instance 
     */
    function add_to_stack_top_or_ast(token_instance) {
      stack_top_token_instance.AddChild(token_instance);
    }

    /**
     * @param {TokenInstance} token_instance 
     */
    function aggregate_stack_push(token_instance) {
      aggregate_stack.push(token_instance);
      stack_top_token_instance = token_instance;
    }

    function aggregate_stack_pop() {
      aggregate_stack.pop();

      stack_top_token_instance = aggregate_stack[aggregate_stack.length - 1];
    }

    for (let i = 0; i < l; i++) {
      const token = tokens[i], { raw_token } = token;

      // first check if the current aggregate can be ended by the current token
      //if (stack_top_token_instance.IsInstanceOf(raw_token.ends)) {
      if (stack_top_token_instance.raw_token.ended_by === raw_token) {
        // yes it can. it also means there's a current aggregate stack top
        // set current token instance as aggregate ender
        stack_top_token_instance.aggregate_ender_token_instance = token;

        // pop aggregate stack since it ended
        aggregate_stack_pop();
      } else if (raw_token.starts) {
        // this token instance can start a new aggregate, create it
        const aggregate_token_instance = TokenInstance.CreateFromRawToken(raw_token.starts);

        // add aggregate as a child of stack top, or to ast in case stack is empty
        add_to_stack_top_or_ast(aggregate_token_instance);

        // set current token instance as aggregate starter
        aggregate_token_instance.aggregate_starter_token_instance = token;

        // push aggregate on top of stack
        aggregate_stack_push(aggregate_token_instance);
      } else {
        // nothin', add current token instance as child of stack top or ast
        add_to_stack_top_or_ast(token);
      }
    } // for loop end


    if (aggregate_stack.length > 1) {
      /**
       * @type {TokenInstance}
       */
      const last_open_aggregate = aggregate_stack[aggregate_stack.length - 1];

      this.LogError(`One aggregate was left unclosed: '${last_open_aggregate.aggregate_starter_token_instance.raw_token.name}' starting at index ${last_open_aggregate.aggregate_starter_token_instance.original_src_start_index}.`);

      return true;
    }

    return false;
  }

  // works on this.tokens
  #OptimizeTextTokens() {
    const { tokens } = this;
    for (let i = 0; i < tokens.length - 1; i++) {
      const current_token = tokens[i];

      if (current_token.IsInstanceOf(TOKENS.text) && tokens[i + 1].IsInstanceOf(TOKENS.text)) {
        // merge them into the a NEW one
        const merged_token_instance = TokenInstance.CreateFromRawToken(TOKENS.text);

        merged_token_instance.code_point_array = [
          ...current_token.code_point_array,
          ...tokens[i + 1].code_point_array
        ];

        tokens.splice(i, 2, merged_token_instance);
        i--;
      }
    }
  }

  #CheckForProcessedTokens() {
    const { raw_tokens } = this, l = raw_tokens.length;

    for (let i = 0; i < l; i++) {
      const raw_token_instance = raw_tokens[i];

      if (raw_token_instance.raw_token.is_processed_token) {
        console.error("Processed token should never appear in the list of raw tokens.");
        throw 0;
      }
    }
  }

  GetTimeElapsedString() {
    return (this.end_timestamp - this.start_timestamp).toFixed(3) + " ms";
  }

  /**
   * @returns {boolean}
   */
  #CheckAST() {
    for (const token_instance of this.#ASTIteratorDepthFirstPostOrder()) {
      // only_one_text_child_allowed
      if (token_instance.raw_token.only_one_text_child_allowed) {
        const { children } = token_instance;
        if (children.length !== 1 || !children[0].IsInstanceOf(TOKENS.text)) {
          this.LogError(`You are only allowed to have pure text inside of a '${token_instance.raw_token.name}'`);
          return true;
        }
      }
      // must_be_child_of_root
      if (token_instance.raw_token.must_be_child_of_root) {
        if (!token_instance.parent.IsInstanceOf(TOKENS.ast_root)) {
          this.LogError(`'${token_instance.raw_token.name}' cannot be placed inside other aggregates.`);
          return true;
        }
      }

      // needs_children
      if (token_instance.raw_token.needs_children && !token_instance.children.length) {
        // can be safely removed inside this loop... hopefully
        token_instance.RemoveSelfAndChildrenFromAST();
        this.LogWarn(`'${token_instance.raw_token.name}' (found at index ${token_instance.aggregate_starter_token_instance.original_src_start_index}) without any non-whitespace characters inside are useless.`);
      }

    }



    return false;
  }

  *#ASTIteratorDepthFirstPostOrder() {
    let n = this.ast.DepthFirstPostOrderFirst(), next;
    do {
      next = n.DepthFirstPostOrderNext();
      yield n;
      n = next;
    } while (n);
  }

  *#ASTIteratorReverseDepthFirstPostOrder() {
    let n = this.ast.ReverseDepthFirstPostOrderFirst();
    do {
      yield n;
    } while (n = n.ReverseDepthFirstPostOrderNext());
  }

  #ParseDirectives() {
    /**
     * @type {TokenInstance[]}
     */
    const directive_instances = [];

    for (const token_instance of this.#ASTIteratorDepthFirstPostOrder()) {
      if (token_instance.IsInstanceOf(TOKENS.directive)) {
        /*if (!token_instance.parent.IsInstanceOf(TOKENS.ast_root)) {
          this.LogError(`Directives cannot be placed inside other aggregates.`);
          return true;
        }*/
        directive_instances.push(token_instance);
      }
    }

    for (const directive_instance of directive_instances) {
      directive_instance.RemoveSelfAndChildrenFromAST();
      this.spudtext.AddAndElaborateDirectiveInstance(directive_instance)
    }

    return false;
  }

  #TrimNewlines() {
    const starting_newlines = [];

    for (const token_instance of this.#ASTIteratorDepthFirstPostOrder()) {
      if (token_instance.IsInstanceOf(TOKENS.newline)) {
        starting_newlines.push(token_instance);
      } else {
        break;
      }
    }

    starting_newlines.forEach(ti => ti.RemoveSelfAndChildrenFromAST());

    const ending_newlines = [];

    const gen = this.#ASTIteratorReverseDepthFirstPostOrder();

    // skip ast_root, which is the first node
    gen.next();
    for (const token_instance of gen) {
      if (token_instance.IsInstanceOf(TOKENS.newline)) {
        ending_newlines.push(token_instance);
      } else {
        break;
      }
    }

    ending_newlines.forEach(ti => ti.RemoveSelfAndChildrenFromAST());
  }

  /**
   * @returns {boolean}
   */
  #ParseTitle() {
    const title_directives = this.spudtext.directive_instances_map.get("title");
    const directive_instances = this.spudtext.directive_instances;
    if (!title_directives || 0 === title_directives.length) {
      this.LogError("There needs to be one title directive in the page.");
      return true;
    }

    if (title_directives.length > 1) {
      this.LogWarn(`There can be only one title in a page. There are ${title_directives.length} in this one. Only the first one will be used and the others will be ignored.`);
    }

    const token_instance = title_directives[0];

    for (const inst of title_directives) {
      directive_instances.splice(directive_instances.indexOf(inst), 1);
    }
    this.spudtext.directive_instances_map.delete("title");

    if (token_instance.children.length > 1) {
      this.LogError(`Title directives can only have text inside them.`);
      return true;
    }

    const text_token = token_instance.children[0];

    if (!text_token.IsInstanceOf(TOKENS.text)) {
      this.LogError(`Title directives can only have text inside them.`);
      return true;
    }

    const title = text_token.GetRawString().trim();

    this.spudtext.SetTitle(title);

    const html_element_token_instance = TokenInstance.CreateFromRawToken(TOKENS.html_element);

    html_element_token_instance.tag = "h1";
    html_element_token_instance.class = "_title";
    html_element_token_instance.content = title;

    this.ast.AddChild(html_element_token_instance, 0);

    return false;
  }

  /**
   * @returns {boolean}
   */
  #ParseContributors() {
    const { directive_instances, directive_instances_map } = this.spudtext;
    const contributor_directives = directive_instances_map.get("contributor") || [];
    directive_instances_map.delete("contributor");

    const contributors = new Set();

    for (const contributor_directive_token_instance of contributor_directives) {
      directive_instances.splice(directive_instances.indexOf(contributor_directive_token_instance), 1);

      if (contributor_directive_token_instance.children.length > 1) {
        this.LogError(`Contributor directives can only have text inside them.`);
        return true;
      }

      const text_token = contributor_directive_token_instance.children[0];
      if (!text_token.IsInstanceOf(TOKENS.text)) {
        this.LogError(`Contributor directives can only have text inside them.`);
        return true;
      }

      const contributor_username = text_token.GetRawString().trim().toLowerCase();
      const contributor = ContributorFromString(contributor_username);
      if (!contributor) {
        this.LogWarn(`Contributor '${contributor_username}' does not exist in the database located in './src/contributors.js'. If you are sure you haven't made a spelling mistake, please contact a Wiki mantainer or make a pull request to add that contributor to the list.`);
        continue;
      }

      if (contributors.has(contributor)) {
        this.LogWarn(`Contributor '${contributor_username}' has already been added in another directive, rendering this one (at index ${text_token.original_src_start_index}) useless.`);
        continue;
      }

      contributors.add(contributor);
      this.spudtext.AddContributor(contributor);
    }

    return false;
  }

  #ParseNotes() {
    /**
     * @type {TokenInstance[]}
     */
    const all_note_ref_token_instances = [];

    for (const token_instance of this.#ASTIteratorDepthFirstPostOrder()) {
      if (token_instance.IsInstanceOf(TOKENS.note_ref)) {
        all_note_ref_token_instances.push(token_instance);
      }
    }

    /**
     * @type {Map<string,{refs:TokenInstance[], note: TokenInstance | undefined}>}
     */
    const note_data_map = new Map();

    for (const note_ref of all_note_ref_token_instances) {
      // they have only one text node, checked earlier
      const note_name = note_ref.children[0].GetRawString().trim();

      const note_data = note_data_map.get(note_name);
      if (note_data) {
        note_data.refs.push(note_ref);
      } else {
        note_data_map.set(note_name, {
          refs: [note_ref]
        });
      }
    }

    const { directive_instances, directive_instances_map } = this.spudtext;
    const note_directives = directive_instances_map.get("note") || [];
    directive_instances_map.delete("note");

    for (const note_directive of note_directives) {
      directive_instances.splice(directive_instances.indexOf(note_directive), 1);

      const note_name = note_directive.real_directive_subname;
      if ((typeof note_name !== "string" && !(note_name instanceof String)) || 0 === note_name.length) {
        this.LogWarn(`'Note' directive at index ${note_directive.aggregate_starter_token_instance.original_src_start_index} does not have a valid note name. It will be ignored.`);
        continue;
      }

      const note_data = note_data_map.get(note_name);

      if (!note_data) {
        this.LogWarn(`'Note' directive '${note_name}' at index ${note_directive.aggregate_starter_token_instance.original_src_start_index} is never used inside the article. It will be ignored.`);
        continue;
      }

      if (note_data.note) {
        this.LogWarn(`'Note' directive '${note_name}' at index ${note_directive.aggregate_starter_token_instance.original_src_start_index} is a duplicate of another 'note' directive. It will be ignored.`);
        continue;
      }

      note_data.note = note_directive;
    }

    let number_of_ok_notes = 0;
    for (const [note_name, { refs, note }] of note_data_map) {
      // there could be notes without a corresponding note directive
      // they will be ignored
      if (!note) {
        this.LogWarn(`Note reference(s) named '${note_name}' do not have a corresponding note. They will be removed.`);
        for (const note_ref of refs) {
          note_ref.RemoveSelfAndChildrenFromAST();
        }

        note_data_map.delete(note_name);
        continue;
      } else {
        // this note is ok
        number_of_ok_notes++;
      }
    }

    // and finally...
    if (number_of_ok_notes) {
      // first of all, append a dang heading2 named 'Notes' to root

      const html_element_token_instance = TokenInstance.CreateFromRawToken(TOKENS.html_element);
      html_element_token_instance.tag = "h2";
      html_element_token_instance.id = "_notes";
      html_element_token_instance.content = "Notes";

      this.ast.AddChild(html_element_token_instance);

      const notes_container = TokenInstance.CreateFromRawToken(TOKENS.html_container);
      notes_container.tag = "div";
      notes_container.id = "_notes-container";

      this.ast.AddChild(notes_container);


      function index_to_letter_index(n) {
        let res = "";
        do {
          res = String.fromCharCode(97 + n % 26);
        } while (n = (n / 26 | 0));
        return res;
      }

      // change all note refs to <sup> elements containing an <a> element linking to the note at the bottom of the page
      // iterate note_data in the given order. all elements are now ok
      for (const [note_name, { refs, note }] of note_data_map) {
        const nrefs = refs.length;

        const note_backlink_div = TokenInstance.CreateFromRawToken(TOKENS.html_container);
        note_backlink_div.tag = "span";
        note_backlink_div.class = "page-note-backlinks";

        const note_text_div = TokenInstance.CreateFromRawToken(TOKENS.html_container);
        note_text_div.tag = "span";
        note_text_div.class = "page-note-text";
        note_text_div.children = note.children;
        for (const token of note.children) {
          token.parent = note_text_div;
        }

        const note_name_div = TokenInstance.CreateFromRawToken(TOKENS.html_element);
        note_name_div.tag = "span";
        note_name_div.class = "page-note-name";
        note_name_div.content = `${note_name}:`;

        const note_content_div = TokenInstance.CreateFromRawToken(TOKENS.html_container);
        note_content_div.tag = "span";
        note_content_div.class = "page-note-content";
        note_content_div.AddChild(note_backlink_div);
        note_content_div.AddChild(note_text_div);

        const note_container = TokenInstance.CreateFromRawToken(TOKENS.html_container);
        note_container.tag = "div";
        note_container.id = `_note-${note_name}`;
        note_container.class = "page-note";
        note_container.AddChild(note_name_div);
        note_container.AddChild(note_content_div);

        notes_container.AddChild(note_container);

        if (nrefs > 1) {
          const backlink_up_test = TokenInstance.CreateFromRawToken(TOKENS.html_text);
          backlink_up_test.content = "^";
          note_backlink_div.AddChild(backlink_up_test);
        }

        for (let i = 0; i < nrefs; i++) {
          const letter_index = index_to_letter_index(i);

          const id = `_note-ref-${note_name}-${letter_index}`;

          const note_ref_a = TokenInstance.CreateFromRawToken(TOKENS.html_element);
          note_ref_a.tag = "a";
          note_ref_a.class = "page-note-ref-a";
          note_ref_a.content = `[${note_name}]`;
          note_ref_a.href = `#_note-${note_name}`;

          const note_ref_sup = TokenInstance.CreateFromRawToken(TOKENS.html_container);
          note_ref_sup.tag = "sup";
          note_ref_sup.id = id;
          note_ref_sup.class = "page-note-ref-sup";
          note_ref_sup.AddChild(note_ref_a);

          refs[i].RemoveSelfAndChildrenFromAST(note_ref_sup);

          // create backlinks

          const note_backlink = TokenInstance.CreateFromRawToken(TOKENS.html_element);
          note_backlink.tag = "a";
          note_backlink.class = "page-note-backlink";
          note_backlink.content = `${nrefs === 1 ? "^" : letter_index}`;
          note_backlink.href = `#${id}`;

          const note_backlinks_sup = TokenInstance.CreateFromRawToken(TOKENS.html_container);
          note_backlinks_sup.tag = "sup";
          note_backlinks_sup.AddChild(note_backlink);

          note_backlink_div.AddChild(note_backlinks_sup);
        }
      }
    }
  }

  #HandleStyles() {
    for (const token_instance of this.#ASTIteratorDepthFirstPostOrder()) {
      switch (token_instance.raw_token) {
        case TOKENS.em_aggregate: {
          const html_container = TokenInstance.CreateFromRawToken(TOKENS.html_container);
          html_container.tag = "i";
          html_container.children = token_instance.children;
          for (const token of token_instance.children) {
            token.parent = html_container;
          }

          token_instance.RemoveSelfAndChildrenFromAST(html_container);
          break;
        }
        case TOKENS.bold_aggregate: {
          const html_container = TokenInstance.CreateFromRawToken(TOKENS.html_container);
          html_container.tag = "b";
          html_container.children = token_instance.children;
          for (const token of token_instance.children) {
            token.parent = html_container;
          }

          token_instance.RemoveSelfAndChildrenFromAST(html_container);
          break;
        }
        case TOKENS.embold_aggregate: {
          const html_container = TokenInstance.CreateFromRawToken(TOKENS.html_container);
          html_container.tag = "b";
          html_container.children = token_instance.children;
          for (const token of token_instance.children) {
            token.parent = html_container;
          }

          const html_container2 = TokenInstance.CreateFromRawToken(TOKENS.html_container);
          html_container2.tag = "em";
          html_container2.children = [html_container];
          html_container.parent = html_container2;

          token_instance.RemoveSelfAndChildrenFromAST(html_container2);
          break;
        }
        case TOKENS.text: {
          const html_text = TokenInstance.CreateFromRawToken(TOKENS.html_text);
          html_text.content = token_instance.GetRawString();

          token_instance.RemoveSelfAndChildrenFromAST(html_text);
          break;
        }
        case TOKENS.heading2_aggregate: {
          const html_container = TokenInstance.CreateFromRawToken(TOKENS.html_container);
          html_container.tag = "h2";
          html_container.children = token_instance.children;
          for (const token of token_instance.children) {
            token.parent = html_container;
          }

          token_instance.RemoveSelfAndChildrenFromAST(html_container);
          break;
        }
        case TOKENS.heading3_aggregate: {
          const html_container = TokenInstance.CreateFromRawToken(TOKENS.html_container);
          html_container.tag = "h3";
          html_container.children = token_instance.children;
          for (const token of token_instance.children) {
            token.parent = html_container;
          }

          token_instance.RemoveSelfAndChildrenFromAST(html_container);
          break;
        }
        case TOKENS.heading4_aggregate: {
          const html_container = TokenInstance.CreateFromRawToken(TOKENS.html_container);
          html_container.tag = "h4";
          html_container.children = token_instance.children;
          for (const token of token_instance.children) {
            token.parent = html_container;
          }

          token_instance.RemoveSelfAndChildrenFromAST(html_container);
          break;
        }
        case TOKENS.heading5_aggregate: {
          const html_container = TokenInstance.CreateFromRawToken(TOKENS.html_container);
          html_container.tag = "h5";
          html_container.children = token_instance.children;
          for (const token of token_instance.children) {
            token.parent = html_container;
          }

          token_instance.RemoveSelfAndChildrenFromAST(html_container);
          break;
        }
        case TOKENS.heading6_aggregate: {
          const html_container = TokenInstance.CreateFromRawToken(TOKENS.html_container);
          html_container.tag = "h6";
          html_container.children = token_instance.children;
          for (const token of token_instance.children) {
            token.parent = html_container;
          }

          token_instance.RemoveSelfAndChildrenFromAST(html_container);
          break;
        }
        case TOKENS.strikethrough_aggregate: {
          const html_container = TokenInstance.CreateFromRawToken(TOKENS.html_container);
          html_container.tag = "s";
          html_container.children = token_instance.children;
          for (const token of token_instance.children) {
            token.parent = html_container;
          }

          token_instance.RemoveSelfAndChildrenFromAST(html_container);
          break;
        }
        case TOKENS.blockquote_aggregate: {
          const html_container = TokenInstance.CreateFromRawToken(TOKENS.html_container);
          html_container.tag = "blockquote";
          html_container.children = token_instance.children;
          for (const token of token_instance.children) {
            token.parent = html_container;
          }

          token_instance.RemoveSelfAndChildrenFromAST(html_container);
          break;
        }

      }
    }
  }

  #WarnAboutRemainingDirectives() {
    const directive_instances = this.spudtext.directive_instances, l = directive_instances.length;

    for (let i = 0; i < l; i++) {
      const directive_instance = directive_instances[i];
      this.LogWarn(`Unknown directive '${directive_instance.real_directive_name}' at index ${directive_instance.aggregate_starter_token_instance.original_src_start_index}.`);
    }
  }

  #ParseBlockquotes() {
    const token_instances = this.ast.children;

    let is_prev_blockquote = false, l = token_instances.length;

    for (let i = 0; i < l; i++) {
      const token_instance = token_instances[i],
        is_curr_blockquote = token_instance.IsInstanceOf(TOKENS.blockquote_aggregate);

      if (is_curr_blockquote) {
        // since a blockquote ends with a newline token, all its children are in one line and that must be kept
        const html_container = TokenInstance.CreateFromRawToken(TOKENS.html_container);
        html_container.tag = "p";
        html_container.children = token_instance.children;
        for (const token of token_instance.children) {
          token.parent = html_container;
        }
        token_instance.children = [html_container];
        html_container.parent = token_instance;

        if (is_prev_blockquote) {
          // merge em
          const prev_token_instance = token_instances[i - 1], prev_token_child = prev_token_instance.children[prev_token_instance.children.length - 1];
          // remove current token from AST
          token_instance.RemoveSelfAndChildrenFromAST();

          prev_token_child.next_sibling = html_container;
          html_container.prev_sibling = prev_token_child;
          html_container.parent = prev_token_instance;
          prev_token_instance.children.push(html_container);

          i--; l--;
        }
      }

      is_prev_blockquote = is_curr_blockquote;
    }
  }

  #ParseParagraphs() {
    const token_instances = this.ast.children;

    let curr_paragraph_start = 0, i = 0;
    // TODO: something in here causes the issues with paragraphs and blockquotes
    const make_into_a_paragraph = (ends_in_newline) => {
      const token_instance = token_instances[i];

      if (!token_instance || token_instance.IsInstanceOf(TOKENS.newline)) {
        // end current paragraph
        const paragraph_length = i - curr_paragraph_start;

        if (0 === paragraph_length) {
          // remove current newline as it is superfluous
          token_instance.RemoveSelfAndChildrenFromAST();
          // curr_paragraph_start stays the same
          i--;
          return;
        }

        const html_container = TokenInstance.CreateFromRawToken(TOKENS.html_container);
        html_container.tag = "p";
        html_container.class = "paragraph";
        html_container.parent = this.ast;

        // we have to splice paragraph_length + 1 (newline as well) token instances, and we switch it with the paragraph
        const spliced_token_instances = token_instances.splice(curr_paragraph_start, paragraph_length + !!ends_in_newline, html_container);
        // get rid of that newline, nobody likes it
        if (ends_in_newline) {
          const hateful_new_line = spliced_token_instances.pop();

          html_container.next_sibling = hateful_new_line.next_sibling;
          if (html_container.next_sibling) {
            html_container.next_sibling.prev_sibling = html_container;
          }
        }
        html_container.prev_sibling = spliced_token_instances[0].prev_sibling;
        if (html_container.prev_sibling) {
          html_container.prev_sibling.next_sibling = html_container;
        }

        html_container.children = spliced_token_instances;

        spliced_token_instances[0].prev_sibling = undefined;
        spliced_token_instances[paragraph_length - 1].next_sibling = undefined;

        for (const ti of spliced_token_instances) {
          ti.parent = html_container;
        }

        // newline will be removed and not added back


        curr_paragraph_start++;
        i -= paragraph_length + 1;

      }
    }

    for (; i < token_instances.length; i++) {
      make_into_a_paragraph(true);
    }

    make_into_a_paragraph(false);
  }

  #ParseExternalLinks() {
    for (const token_instance of this.#ASTIteratorDepthFirstPostOrder()) {
      if (token_instance.IsInstanceOf(TOKENS.external_link)) {
        // always has only one text child
        const text_token_instance = token_instance.children[0],
          { code_point_array } = text_token_instance;

        const first_non_whitespace = code_point_array.findIndex(c => c > 32);
        if (-1 === first_non_whitespace) {
          this.LogWarn(`External link empty at index ${text_token_instance.original_src_start_index}.`);
          continue;
        }

        const first_whitespace_after_that = first_non_whitespace + code_point_array.slice(first_non_whitespace).findIndex(c => c <= 32);

        let link, label;
        if (first_whitespace_after_that === first_non_whitespace - 1) {
          // use link as label
          label = link = String.fromCodePoint(...code_point_array.slice(first_non_whitespace));
        } else {
          link = String.fromCodePoint(...code_point_array.slice(first_non_whitespace, first_whitespace_after_that));
          label = String.fromCodePoint(...code_point_array.slice(first_whitespace_after_that)).trim();
        }



        const html_element = TokenInstance.CreateFromRawToken(TOKENS.html_element);
        html_element.tag = "a";
        html_element.content = label;
        html_element.href = link;
        html_element.ext_link = true;

        token_instance.RemoveSelfAndChildrenFromAST(html_element);


      }
    }
  }

  /*
  "redirect",
  "category",
  "tag",
  
  */
  #ParseFlagDirectives() {
    const { spudtext } = this, { directive_instances, directive_instances_map } = spudtext;

    const to_delete = [];

    for (const [directive_name, token_instances] of directive_instances_map) {
      switch (directive_name) {
        case "center_title": {
          if (token_instances.length > 1) {
            this.LogWarn(`Only one '${directive_name}' directive is needed.`);
          }
          spudtext.do_center_title = true;
          to_delete.push(directive_name);
          break;
        }
        case "make_blue_red": {
          if (token_instances.length > 1) {
            this.LogWarn(`Only one '${directive_name}' directive is needed.`);
          }
          spudtext.make_blue_red = true;
          to_delete.push(directive_name);
          break;
        }
        case "nosearchindex": {
          if (token_instances.length > 1) {
            this.LogWarn(`Only one '${directive_name}' directive is needed.`);
          }
          spudtext.no_search_index = true;
          to_delete.push(directive_name);
          break;
        }
        case "command": {
          for (const token_instance of token_instances) {

            spudtext.commands.push(token_instance.children[0].GetRawString().trim().toLowerCase());
          }
          // !command implies !nosearchindex <- not anymore
          // spudtext.no_search_index = true;
          to_delete.push(directive_name);
          break;
        }
        case "noedit": {
          if (token_instances.length > 1) {
            this.LogWarn(`Only one '${directive_name}' directive is needed.`);
          }
          spudtext.no_edit = true;
          to_delete.push(directive_name);
          break;
        }

      }
    }

    for (const directive_name of to_delete) {
      directive_instances_map.delete(directive_name);
      for (let i = directive_instances.length - 1; i >= 0; i--) {
        if (directive_name === directive_instances[i].real_directive_name) {
          directive_instances.splice(i, 1);
        }
      }

    }

  }

  #ParseEmbeddedFiles() {
    for (const token_instance of this.#ASTIteratorDepthFirstPostOrder()) {
      if (token_instance.IsInstanceOf(TOKENS.embedded_file)) {
        // only one text child... for now. later optional description will be able to
        // be styled
        const t = token_instance.children[0].code_point_array, l = t.length;

        if (0 === l) {
          this.LogWarn("empty embedded aggregate.")
          token_instance.RemoveSelfAndChildrenFromAST();
          continue;
        }

        let media_name, desc = "", percentage = "30", alignment = "right";

        const add_media_to_ast = () => {
          media_name = media_name.toLowerCase();
          if (!Object.hasOwn(MEDIA_ASSETS, media_name)) {
            this.LogWarn("no media by this name");
            return;
          }

          const asset = MEDIA_ASSETS[media_name];
          const html_figure = TokenInstance.CreateFromRawToken(TOKENS.html_container);
          html_figure.tag = "figure";
          html_figure.style = "width:" + percentage + "%;";
          html_figure.class = "img-align-" + alignment;

          //  console.log(html_figure)
          // TODO: enclose the img in an 'a' element, which redirects to a page with info about the img
          const html_img = TokenInstance.CreateFromRawToken(TOKENS.html_element);
          html_img.tag = "img";
          html_img.content = "";
          html_img.class = "embedded-img";
          html_img.src = asset.GetLink();

          const html_figcaption = TokenInstance.CreateFromRawToken(TOKENS.html_element);
          html_figcaption.tag = "figcaption";
          html_figcaption.content = desc || asset.description;

          html_figure.AddChild(html_img);
          html_figure.AddChild(html_figcaption);

          token_instance.RemoveSelfAndChildrenFromAST(html_figure);
        }

        let i = 0;
        // skip whitespaces
        while (i < l && t[i] <= 32) i++;
        const media_name_start = i;
        // skip non-whitespaces
        while (i < l && t[i] > 32) i++;
        media_name = String.fromCodePoint(...t.slice(media_name_start, i));

        if (i >= l) {
          add_media_to_ast();
          continue;
        }

        while (i < l) {
          while (i < l && t[i] <= 32) i++;

          if (i >= l) {
            add_media_to_ast();
            continue;
          }

          // we have a string
          const str_init = i;
          // skip non-| (124)
          while (i < l && t[i] !== 124) i++;

          const str = String.fromCodePoint(...t.slice(str_init, i)).trim();
          if (/^[0-9]+$/.test(str)) {
            // use it as page width percentage
            percentage = str;
          } else {
            switch (str) {
              case "left":
              case "right":
                alignment = str; break;
              default:
                desc = str;
                break;
            }
          }

          // skip | if one was encountered
          if (i < l && t[i] === 124) i++;
        }
        add_media_to_ast();
      }
    }
  }

  GetSpudText() {
    this.start_timestamp = performance.now();
    this.#TokenizeSource();

    this.#CheckForProcessedTokens();

    // we have raw tokens, they can be finalized now
    this.tokens = this.raw_tokens.map(raw_token_instance => raw_token_instance.GetFinalizedInstance(this));

    //this.#DebugPrintTokens(this.raw_tokens);

    this.#OptimizeTextTokens();

    if (this.#MakeASTFromTokens()) {
      this.#DebugPrintTokens(this.ast.children);
      return;
    }


    if (this.#CheckAST()) {
      return;
    }

    if (this.#ParseDirectives()) {
      return;
    }

    this.#ParseBlockquotes();

    this.#TrimNewlines();

    this.#ParseParagraphs();

    // this.#DebugPrintTokens(this.ast.children);


    if (this.#ParseTitle()) {
      return;
    }

    if (this.#ParseContributors()) {
      return;
    }

    this.#ParseNotes();

    this.#ParseExternalLinks();

    this.#ParseEmbeddedFiles();

    this.#HandleStyles();

    this.#ParseFlagDirectives();

    this.#WarnAboutRemainingDirectives();

    this.end_timestamp = performance.now();
    // this.#DebugPrintTokens(this.ast.children);

    // console.log(`Time elapsed: ${this.GetTimeElapsedString()}.`);

    this.spudtext.SetTimeTakenMs(this.end_timestamp - this.start_timestamp);
    this.spudtext.SetHtmlTree(this.ast);

    return this.spudtext;
  }
}

export { SpudTextContext, SpudText, TokenInstance, RawTokenInstance, TOKENS };