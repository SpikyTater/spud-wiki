


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
  },
  em: {
    raw_token_length: 1,
  },
  bold: {
    raw_token_length: 2,
  },
  embold: {
    raw_token_length: 3,
  },
  blockquote: {
    raw_token_length: 1,
  },
  directive_start: {},
  directive: {
    can_have_children: true,
    is_processed_token: true,
  },
  special: {
    can_have_children: true,
    is_processed_token: true,
  },
  special_start: {
    raw_token_length: 1,
  },
  special_args_start: {
    raw_token_length: 1,
  },
  special_args_end: {
    raw_token_length: 1,
  },
  note_ref: {
    can_have_children: true,
    is_processed_token: true,
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
};

function PostProcessTokensGlobal() {
  for (const token_name in TOKENS) {
    TOKENS[token_name].name = token_name;
  }
}

PostProcessTokensGlobal();

let XXXXX = true;
function RUN_ONCE(f) {
  if (XXXXX) {
    XXXXX = false;
    f();
  }
}

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
  children;

  /**
   * @param {SpudTextContext} ctx
   * @param {RawTokenInstance} raw_token_instance
   */
  constructor(ctx, raw_token_instance) {
    this.raw_token = raw_token_instance.raw_token;
    this.code_point_array = ctx.src_text.slice(raw_token_instance.start_index, raw_token_instance.end_index);
    this.original_src_start_index = raw_token_instance.start_index;
    this.original_src_end_index = raw_token_instance.end_index;
    this.children = [];
  }

  GetTokenLength() {
    return this.code_point_array.length;
  }

  GetRawString() {
    return String.fromCodePoint(...this.code_point_array);
  }

  /**
   * @param {any} raw_token any of the values inside the global constant TOKENS
   * @returns {boolean}
   */
  IsInstanceOf(raw_token) {
    return raw_token === this.raw_token;
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
    return new TokenInstance(ctx, this);
  }

  /**
   * @param {any} raw_token any of the values inside the global constant TOKENS
   * @returns {boolean}
   */
  IsInstanceOf(raw_token) {
    return raw_token === this.raw_token;
  }

}

class SpudTextContext {
  static SEGMENTER = Intl?.Segmenter && new Intl.Segmenter("en", { granularity: "grapheme" });

  static LOG_LEVEL_VERBOSE = 0;
  static LOG_LEVEL_WARN = 1;
  static LOG_LEVEL_ERROR = 2;

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
   * @type {TokenInstance[]}
   */
  ast = [];

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
      // ^^ the only place where i is incremented
      // it may be decremented elsewhere in the loop
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
          // special commands
          if (this.#PreviousTokenEquals(TOKENS.backslash)) {
            t.pop();
            this.#MergeSameOrAddToken(TOKENS.text, i);
          } else {
            this.#AddToken(TOKENS.special_start, i);
          }
          continue;
        case 40: // (
          if (this.#PreviousTokenEquals(TOKENS.backslash)) {
            t.pop();
            this.#MergeSameOrAddToken(TOKENS.text, i);
          } else {
            this.#AddToken(TOKENS.special_args_start, i);
          }
          continue;
        case 41: // )
          if (this.#PreviousTokenEquals(TOKENS.backslash)) {
            t.pop();
            this.#MergeSameOrAddToken(TOKENS.text, i);
          } else {
            this.#AddToken(TOKENS.special_args_end, i);
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
        case 62: // >
          if (this.#PreviousTokenEquals(TOKENS.newline)) {
            this.#AddToken(TOKENS.blockquote, i);
          } else {
            this.#MergeSameOrAddToken(TOKENS.text, i);
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

  }

  GetHtmlString() {
    this.#TokenizeSource();

    // we have raw tokens, they can be finalized now
    this.tokens = this.raw_tokens.map(raw_token_instance => raw_token_instance.GetFinalizedInstance(this));

    this.#DebugPrintTokens();

    return "not yet";
  }
}

export { SpudTextContext };