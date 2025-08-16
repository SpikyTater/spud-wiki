class SpudText {

  directives_arr = [];
  directives_map = new Map();

  notes_map = new Map();

  contributors_set = new Set();

  AddDirective(token) {
    // unsafe function
    this.directives_arr.push(token);

    const arr = this.directives_map.get(token.name);
    if (arr) {
      arr.push(token);
    } else {
      this.directives_map.set(token.name, [token]);
    }
  }
}

const TOKENS = {};

const DIRECTIVES = [
  "title", // done
  "contributor", // done
  "redirect",
  "nosearchindex",
  "category",
  "tag",
  "section", // removed, we have headings now
  "note", // done
];

function CreateHtmlElement(tag_name, content, attrs) {
  let s = `<${tag_name}`;
  content ||= "";
  attrs ||= {};

  for (const k in attrs) {
    s += ` ${k}="${attrs[k]}"`;
  }

  return `${s}>${content}</${tag_name}>`;
}

// don't give a negative number to this function, for larry's sake
function IndexNumberToIndexLetter(num) {
  let res = "";
  do {
    res = String.fromCharCode(97 + num % 26);
  } while (num = (num / 26 | 0));
  return res;
}

class Token {
  /**
   * @type {string}
   */
  name;

  /**
   * @type {boolean}
   */
  must_be_coupled;

  /**
   * @type {number}
   */
  length;

  /**
   * @param {string} name 
   * @param {{}} options 
   */
  constructor(name, options) {
    this.name = name;
    this.must_be_coupled = !!options.must_be_coupled;
    this.length = options.length || 1;
  }

  static Create(name, options) {
    if (Object.hasOwn(TOKENS, name)) {
      throw `Not on my watch. '${name}' is already the name of a token.`;
    }
    const token = new Token(name, options || {
      must_be_coupled: false,
      length: 1,
    });
    TOKENS[name] = token;
  }

  CreateInstance(i_start, i_end) {
    return {
      token: this,
      start: i_start,
      end: i_end
    }
  }
}

Token.Create("newline");
Token.Create("text");
Token.Create("backslash");



Token.Create("em", { must_be_coupled: true });
Token.Create("bold", { must_be_coupled: true, length: 2 });
Token.Create("embold", { must_be_coupled: true, length: 3 });
Token.Create("blockquote");
Token.Create("directive_start");
Token.Create("directive");

/*for (const directive of DIRECTIVES) {
  Token.Create(`directive_${directive}`);
}*/

Token.Create("special");
Token.Create("special_start");
Token.Create("special_end");
Token.Create("note_ref");
Token.Create("note_ref_start");
Token.Create("note_ref_end");
Token.Create("html_ready");
Token.Create("html_cont");


class SpudTextParser {
  /**
   * 
   * @param {string} s 
   * @param {{} | undefined} options 
   * @returns {SpudText | undefined}
   */
  static ParseFromString(s, options) {
    options ||= {};

    if (typeof options !== "object") {
      console.error("Invalid 'options'.");
      return;
    }

    if (typeof s !== "string" && !(s instanceof String)) {
      console.error("Invalid 's'.");
      return;
    }

    const parser = new SpudTextParser(s, options);

    if (parser.#Tokenize()) {
      return;
    }

    parser.#ParseDirectives();

    if (parser.#ParseNotes()) {
      // ABORK
    }

    if (parser.#ParseContributors()) {
      // ABORK
    }

    parser.#DebugPrintTokens();

    console.log(parser.result);

    return parser.result;
  }

  constructor(s, options) {
    this.orig_string = s;
    this.options = options || {};
    this.result = new SpudText();
  }

  /**
   * @type {string}
   */
  orig_string;

  /**
   * @type {{}}
   */
  options;

  /**
   * @type {SpudText}
   */
  result;

  // token instances
  tokens = [];

  #AddToken(token, i) {
    this.tokens.push(token.CreateInstance(i, i + token.length));
  }

  #PreviousTokenEquals(token) {
    const t = this.tokens, l = t.length;
    if (l === 0) return false;
    return t[l - 1].token.name === token.name;
  }

  #MergeSameOrAddToken(token, i) {
    const t = this.tokens, l = t.length;
    if (0 === l) {
      this.#AddToken(token, i);
      return;
    }
    const lt = t[l - 1];
    if (lt.token.name !== token.name) {
      this.#AddToken(token, i);
    } else {
      lt.end += token.length;
    }
  }

  #Tokenize() {
    const t = this.tokens, s = this.orig_string, l = s.length;
    let i = 0, c;

    for (i = 0; i < l; i++) {
      // the only place where i is incremented
      c = s.charCodeAt(i);

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
            this.#AddToken(TOKENS.directive_start, i);
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
            this.#AddToken(TOKENS.special, i);
          }
          continue;
        case 40: // (
          if (this.#PreviousTokenEquals(TOKENS.backslash)) {
            t.pop();
            this.#MergeSameOrAddToken(TOKENS.text, i);
          } else {
            this.#AddToken(TOKENS.special_start, i);
          }
          continue;
        case 41: // )
          if (this.#PreviousTokenEquals(TOKENS.backslash)) {
            t.pop();
            this.#MergeSameOrAddToken(TOKENS.text, i);
          } else {
            this.#AddToken(TOKENS.special_end, i);
          }
          continue;
        case 42: // *
          // em, bold or embold
          if (this.#PreviousTokenEquals(TOKENS.backslash)) {
            t.pop();
            this.#MergeSameOrAddToken(TOKENS.text, i);
            continue;
          }
          if (i + 1 < l && 42 === s.charCodeAt(i + 1)) {
            // bold or embold
            if (i + 2 < l && 42 === s.charCodeAt(i + 2)) {
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
    } // big while end

    // directives end with new lines, this is to help when the last
    // line of a file is a directive
    this.orig_string += "\n";
    this.#AddToken(TOKENS.newline, i);

    return false;
  }

  #StringifyTokens(tokens, indent) {
    indent ||= 0;
    tokens ||= this.tokens;

    const indent_str = " ".repeat(indent);

    let s = "";
    for (const token of tokens) {
      s += `${indent_str}${token.token.name} - ${token.start}, ${token.end}`

      switch (token.token.name) {
        case "directive":
          switch (token.name) {
            case "section":
              s += ` - section -> '${token.arg}'`;
              break;
            case "title":
              s += ` - title -> '${token.arg}'`
              break;
            case "contributor":
              s += ` - contributor -> '${token.arg}'`
              break;
          }
          break;
        case "note_ref":
          console.log("GUGU", token)
          break;
      }

      s += "\n";
      if (Array.isArray(token.children)) {
        s += this.#StringifyTokens(token.children, indent + 2);
      }
    }

    return s;
  }

  #DebugPrintTokens(tokens) {
    console.log(this.#StringifyTokens(tokens));
  }

  #ParseDirectives() {
    const t = this.tokens, l = t.length, s = this.orig_string;

    const new_t = [];

    const directives = [];

    let is_outside_directive = true;

    for (let i = 0; i < l; i++) {
      const { token } = t[i];

      if (is_outside_directive) {
        // not inside a directive, state can only be changed by directive_start
        if ("directive_start" === token.name) {
          directives.push([]);
          is_outside_directive = false;
        } else {
          // not directive_start, still needs to be parsed later
          new_t.push(t[i]);
        }
      } else {
        // inside a directive
        if ("newline" === token.name) {
          const curr_directive = directives[directives.length - 1];
          if (0 === curr_directive.length) {
            // empty directive... warn
            // TODO: warn
            new_t.push(t[i]);
          } else {
            const o = {
              token: TOKENS.directive,
              start: curr_directive[0].start,
              end: curr_directive[curr_directive.length - 1].end,
              old_tokens: curr_directive
            };
            new_t.push(o);
            directives[directives.length - 1] = o;
          }
          is_outside_directive = true;
        } else {
          // directive keeps going
          directives[directives.length - 1].push(t[i]);
        }
      }
    } // for loop end

    this.tokens = new_t; // tokens that still need to be parsed

    const { result } = this, { directives_arr, directives_map } = result;

    for (const d of directives) {
      // d is a directive token instance

      const dir_string = s.substring(d.start, d.end), dl = dir_string.length;
      let i = 0;
      for (; i < dl; i++) {
        const c = dir_string.charCodeAt(i)
        if (c <= 32 || 61 === c) {
          // 61 -> =
          break;
        }
      }
      let directive_name = dir_string.substring(0, i);

      if (directive_name.startsWith("note")) {
        d.subname = directive_name.substring(4);
        directive_name = "note";
      }

      for (; i < dl; i++) {
        const c = dir_string.charCodeAt(i)
        if (c > 32 && 61 !== c) {
          // 61 -> =
          break;
        }
      }
      const directive_arg = dir_string.substring(i);

      d.name = directive_name;
      d.arg = directive_arg;

      // add directives to result



      directives_arr.push(d);

      if (directives_map.has(directive_name)) {
        directives_map.get(directive_name).push(d);
      } else {
        directives_map.set(directive_name, [d]);
      }

      //console.log("DIRSTR: " + directive_name, directive_arg);
    }
  }

  #ParseNotes() {
    const t = this.tokens, l = t.length, s = this.orig_string;

    const note_refs = [];

    // i < (l - 2) because notes are made up of 3 tokens
    for (let i = 0; i < l - 2; i++) {
      if ("note_ref_start" === t[i].token.name) {
        if ("text" === t[i + 1].token.name && "note_ref_end" === t[i + 2].token.name) {
          // good note
          const token = t[i + 1];
          const str = s.substring(token.start, token.end).trim();

          const o = {
            token: TOKENS.note_ref,
            start: t[i].start,
            end: t[i + 2].end,
            name: str
          };
          note_refs.push({
            index: i,
            token: o
          });

          // skip text and note_ref_end
          i += 2;
        } else {
          // bad syntax, abork parsing
          // TODO: warn better
          console.warn("Bad syntax", i);
          return true;
        }
      }
    } // for loop end

    const nl = note_refs.length;
    const { notes_map, directives_map, directives_arr } = this.result;
    for (let i = nl - 1; i >= 0; i--) {
      const note = note_refs[i], { index, token } = note;
      t.splice(index, 3, token);

      const o = notes_map.get(token.name);
      if (o) {
        // already present
        o.refs.push(token);
      } else {
        // to add
        notes_map.set(token.name, {
          refs: [token],
          actual_note: undefined
        });
      }
    }

    // parsing note directives
    const note_directives = directives_map.get("note") || [];
    for (const note_directive of note_directives) {
      const { subname } = note_directive;

      const single_note = notes_map.get(subname);
      if (!single_note) {
        console.warn("Note directive was not used.");
        continue;
      }
      if (single_note.actual_note) {
        console.warn("Duplicate note directive.");
        continue;
      }
      single_note.actual_note = note_directive;
    }

    // remove note directives from directives_map and directives_arr
    directives_map.delete("note");

    for (let i = directives_arr.length - 1; i >= 0; i--) {
      if ("note" === directives_arr[i].name) {
        directives_arr.splice(i, 1);
      }
    }

    const notes_to_add = [];

    for (const [key, note] of notes_map) {
      const { actual_note, refs } = note;
      if (actual_note) {
        // note is safe
        // convert refs to html_ready tokens -> <sup></sup>
        const nrefs = refs.length;
        for (let i = 0; i < nrefs; i++) {
          const ref_token = refs[i];
          ref_token.html = this.#CreateHtmlReadyNoteRefFromName(ref_token.name, IndexNumberToIndexLetter(i));
          ref_token.token = TOKENS.html_ready;
        }


        // remove note's directive token
        t.splice(t.indexOf(actual_note), 1);

        notes_to_add.push([key, note]);
      } else {
        console.warn("No note available for 1 or more refs.");

        // remove refs from tokens
        for (const ref_token of refs) {
          t.splice(t.indexOf(ref_token), 1);
        }
      }
    }

    if (notes_to_add.length) {
      // convert note directives to one !section + list of raw_text

      // add !section directive at the end of the list of tokens
      const new_section = {
        token: TOKENS.directive,
        name: "section",
        arg: "Notes",
      };

      // TODO:

      const cont_token = {
        token: TOKENS.html_cont,
        children: [],
        tag_name: "div",
      };

      // need to add these in reverse order
      for (let i = notes_to_add.length - 1; i >= 0; i--) {
        const [note_name, note_obj] = notes_to_add[i];
        const { refs, actual_note } = note_obj;
        console.log("AAAAAAAAAAAAAAAA", { note_name, refs, actual_note })

        const single_note_outer_token = {
          token: TOKENS.html_cont,
          children: [],
          tag_name: "div",
          id: `bottom-ref-${note_name}`,
        };

        const note_name_token = {
          token: TOKENS.html_ready,
          html: CreateHtmlElement("div", `${note_name}:`)
        };
        const note_content_cont_token = {
          token: TOKENS.html_cont,
          children: [],
          tag_name: "div",
        }

        const nrefs = refs.length;
        for (let i = 0; i < nrefs; i++) {
          const letter_idx = IndexNumberToIndexLetter(i);
          const token = {
            token: TOKENS.html_ready,
            html: CreateHtmlElement("a", letter_idx, { href: `ref-${note_name}-${letter_idx}` }),
          };

          note_content_cont_token.children.push(token);
        }

        note_content_cont_token.children.push(...actual_note.old_tokens);

        single_note_outer_token.children.push(note_name_token, note_content_cont_token);
        console.log("AUG", single_note_outer_token)
        cont_token.children.push(single_note_outer_token);
      }

      this.result.AddDirective(new_section);
      t.push(new_section, cont_token);
    }

    return false;
  }

  #CreateHtmlReadyNoteRefFromName(name, letter_idx) {
    const a = CreateHtmlElement("a", name, { href: `#bottom-ref-${name}` });
    return CreateHtmlElement("sup", a, { id: `ref-${name}-${letter_idx}`, class: "article-ref" });
  }

  #ParseContributors() {

  }



}

export { SpudTextParser };