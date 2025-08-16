/*
Spud Wiki Engine
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
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
/**
 * @typedef Token
 * @property {number | undefined} raw_token_length 
 */
const TOKENS = {
  newline: {
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
  em_aggregate: {
    can_have_children: true,
    is_processed_token: true,
    started_by: "em",
    ended_by: "em",
    needs_children: true,
  },
  bold: {
    raw_token_length: 2,
  },
  bold_aggregate: {
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
    raw_token_length: 1,
  },
  strikethrough_aggregate: {
    can_have_children: true,
    is_processed_token: true,
    started_by: "strikethrough",
    ended_by: "strikethrough",
    needs_children: true,
  },
  blockquote: {
    raw_token_length: 1,
  },
  blockquote_aggregate: {
    can_have_children: true,
    is_processed_token: true,
    started_by: "blockquote",
    ended_by: "blockquote",
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
  internal_link: {
    can_have_children: true,
    is_processed_token: true,
    children_cant_have_children: true,
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
    children_cant_have_children: true,
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
  embedded_file: {
    can_have_children: true,
    is_processed_token: true,
    children_cant_have_children: true,
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
  note_ref: {
    can_have_children: true,
    is_processed_token: true,
    children_cant_have_children: true,
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
  html_ready: {
    is_processed_token: true,
  },
  html_container: {
    can_have_children: true,
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
  heading2_aggregate: {
    must_be_child_of_root: true,
    started_by: "heading2",
    ended_by: "heading2",
  },
  heading3_aggregate: {
    must_be_child_of_root: true,
    started_by: "heading3",
    ended_by: "heading3",
  },
  heading4_aggregate: {
    must_be_child_of_root: true,
    started_by: "heading4",
    ended_by: "heading4",
  },
  heading5_aggregate: {
    must_be_child_of_root: true,
    started_by: "heading5",
    ended_by: "heading5",
  },
  heading6_aggregate: {
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
   * @param {TokenInstance} token_instance 
   */
  AddChild(token_instance) {
    if (!this.raw_token.can_have_children) {
      console.error("Trying to add a child to a token instance that cannot have children.");
      throw 0;
    }

    const last_child = this.GetLastChild();
    if (last_child) {
      last_child.next_sibling = token_instance;
      token_instance.prev_sibling = last_child;
    }

    this.children.push(token_instance);
    token_instance.parent = this;
  }

  GetFirstChild() {
    return this.children.length ? this.children[0] : undefined;
  }

  GetLastChild() {
    return this.children.length ? this.children[this.children.length - 1] : undefined;
  }

  HasGrandchildren() {
    return this.children.length && this.children.find(child => child.children.length);
  }

  RemoveSelfAndChildrenFromAST() {
    const { parent, next_sibling, prev_sibling } = this;
    if (parent) {
      const idx = parent.children.indexOf(this);
      parent.children.splice(idx, 1);
      delete this.parent;
    }

    if (next_sibling) {
      next_sibling.prev_sibling = prev_sibling;
      delete this.next_sibling;
    }

    if (prev_sibling) {
      prev_sibling.next_sibling = next_sibling;
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
   * Sets the title of this page
   * @param {string} title_string 
   */
  SetTitle(title_string) {
    if (!title_string || typeof title_string !== "string" || !(title_string instanceof String)) {
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
    console.log("DIRECTIVE", real_directive_name)

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
        this.#AddToken(TOKENS.newline, i);
        continue;
      } else if (c === 13) {
        // ignored
        continue;
      } else if (c <= 32) {
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
            this.#AddToken(TOKENS.strikethrough, i);
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
      s += `${indent_str}${token.raw_token.name} - ${token.original_src_start_index}, ${token.original_src_end_index}`

      if (!token.IsInstanceOf(TOKENS.newline) && token.GetTokenLength() < 20) {
        s += " - '" + token.GetRawString() + "'";
      }

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
      if (stack_top_token_instance.IsInstanceOf(raw_token.ends)) {
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
    // children_cant_have_children
    for (const token_instance of this.#ASTIteratorDepthFirstPostOrder()) {
      if (token_instance.raw_token.children_cant_have_children) {
        const who_has_grandchildren = token_instance.HasGrandchildren();
        if (who_has_grandchildren) {
          this.LogError(`You can't add a '${who_has_grandchildren.raw_token.name}' inside of a '${token_instance.raw_token.name}'.`);
          return true;
        }
      }
    }

    // must_be_child_of_root will be checked inside #ParseDirectives

    // needs_children
    for (const token_instance of this.#ASTIteratorDepthFirstPostOrder()) {
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
        if (!token_instance.parent.IsInstanceOf(TOKENS.ast_root)) {
          this.LogError(`Directives cannot be placed inside other aggregates.`);
          return true;
        }
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

  GetSpudText() {
    this.start_timestamp = performance.now();
    this.#TokenizeSource();

    this.#CheckForProcessedTokens();

    // we have raw tokens, they can be finalized now
    this.tokens = this.raw_tokens.map(raw_token_instance => raw_token_instance.GetFinalizedInstance(this));

    this.#OptimizeTextTokens();

    if (this.#MakeASTFromTokens()) {
      return;
    }

    if (this.#CheckAST()) {
      return;
    }

    if (this.#ParseDirectives()) {
      return;
    }

    this.#TrimNewlines();

    this.end_timestamp = performance.now();
    this.#DebugPrintTokens(this.ast.children);

    console.log(`Time elapsed: ${this.GetTimeElapsedString()}.`);



    return "not yet";
  }
}

export { SpudTextContext };