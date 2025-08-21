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

import COMMIT_HASH from "../../build/commit_data.js";
import { SpudTextContext } from "../spudtext.js";

import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine } from "@codemirror/view"
import { defaultKeymap, historyKeymap, history } from "@codemirror/commands"
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete"
import { bracketMatching } from "@codemirror/language"
import { Text } from "@codemirror/state"

function AfterDomLoaded(initial_data) {
  // initializing the UI
  const content_container = document.getElementById("content");

  const editor_container = document.createElement("div");
  editor_container.id = "editor-container";

  const display_content_container = document.createElement("div");
  display_content_container.id = "editor-content";
  display_content_container.className = "content";

  const errors_container = document.createElement("div");
  errors_container.id = "editor-parserconsole";

  const button_container = document.createElement("div");
  button_container.id = "editor-btncontainer";

  const button = document.createElement("button");
  button.textContent = "Htmlify";
  button.className = "editor-btn";

  const export_button = document.createElement("button");
  export_button.textContent = "Export";
  export_button.title = "Export the current contents of the editor.";
  export_button.className = "editor-btn";

  const import_label = document.createElement("label");
  import_label.className = "editor-btn";
  import_label.textContent = "Import";
  import_label.title = "Import a file into the editor.";

  const import_input = document.createElement("input");
  import_input.type = "file";
  import_input.accept = 'text/*';

  button_container.append(button, export_button, import_label);
  import_label.append(import_input);
  content_container.append(editor_container, button_container, errors_container, display_content_container);




  const custom_keymap = [
    // TODO: { key: "Ctrl-s", preventDefault: true, run: save }
  ];

  /**
       * @type {import("@codemirror/view").EditorViewConfig}
       */
  const config = {
    parent: editor_container,
    extensions: [
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...closeBracketsKeymap, // not necessary
        ...custom_keymap
      ]),
      history(),
      lineNumbers({
        formatNumber: line => 69 === line ? "nice" : String(line)
      }),
      //   drawSelection(), // not necessary
      highlightActiveLineGutter(), // not necessary
      highlightActiveLine(), // not necessary
      closeBrackets(), // not necessary
      bracketMatching(), // not necessary
      EditorView.lineWrapping,
      EditorView.updateListener.of(v => {
        if (v.docChanged) {
          // TODO: save
        }
      })
    ]
  };


  if (initial_data && Array.isArray(initial_data) && initial_data.every(datum => typeof datum === "string" || datum instanceof String)) {
    config.doc = Text.of(initial_data); //Text.of(data.split(/\r?\n/));
  }

  // config.doc = Text.of(arr) -> arr is an array of lines, I believe

  const editor_view = new EditorView(config);

  const file_reader = new FileReader();
  file_reader.onload = function () {
    const data = this.result;
    if (typeof data !== "string" || 0 === data.length) return;

    const text = Text.of(data.split(/\r?\n/));

    editor_view.dispatch({
      changes: {
        from: 0,
        to: editor_view.state.doc.length,
        insert: text
      }
    });
  }

  // TODO: one click listener on window is enough...

  button.onclick = () => {
    let errors_html = "";
    try {
      const spud_text = new SpudTextContext(editor_view?.state?.doc?.toString(), {
        warn_callbacks: [
          function (data) {
            errors_html += `<p class="editor-warn">${data}<p>`;
          }
        ],
        error_callbacks: [
          function (data) {
            errors_html += `<p class="editor-error">${data}<p>`;
          }
        ],
      }).GetSpudText();
      if (spud_text) {
        display_content_container.innerHTML = spud_text.GetTitleHtmlString() + spud_text.GetHtmlString();
      }
    } catch (e) {


      console.error(e);
      errors_html += `<p class="editor-critical">${e?.message || e?.name}. Check console.for more info.</p>`;
    }
    errors_container.innerHTML = errors_html;
  };

  export_button.addEventListener("click", () => {
    const str = editor_view?.state?.doc?.toString();

    // const file = new File([str], "file.txt", { type: 'application/octet-stream' });

    const blob = new Blob([str], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;

    // name it SpudText_2025_08_18_20_38.txt or, in case there's a title (check if changes after last spudtext parsing and save spudtext result), TITLE_2025_....txt
    const now = new Date();
    a.download = `SpudText_${now.getUTCFullYear()}_${(now.getUTCMonth() + 1).toString().padStart(2, " ")}_${(now.getUTCDay() + 1).toString().padStart(2, " ")}_${now.getUTCHours().toString().padStart(2, " ")}_${now.getUTCMinutes().toString().padStart(2, " ")}_${now.getUTCSeconds().toString().padStart(2, " ")}_${now.getUTCMilliseconds().toString().padStart(3, " ")}.txt`;

    a.click();

    URL.revokeObjectURL(url);



  }, { passive: true });


  function on_import_input_change(e) {
    if (!e?.target) return;
    e.stopPropagation();
    e.target.value = null;
    const files = e.target.files;
    if (!files || 1 !== files.length) return;

    const file = files[0];
    if (!file || !file.type.startsWith("text")) return;

    file_reader.readAsText(file);
  }

  import_input.addEventListener("change", on_import_input_change, { passive: true });


}

function start_page(initial_data) {
  if ("loading" === document.readyState) {
    window.addEventListener("DOMContentLoaded", initial_data ? AfterDomLoaded.bind(window, initial_data) : AfterDomLoaded, { once: true, passive: true });
  }
  else AfterDomLoaded(initial_data);
}

const query_string = new URLSearchParams(window.location.search);
const src_string = query_string.get("src");
if (src_string) {
  const src_url = `https://raw.githubusercontent.com/SpikyTater/spud-wiki/${COMMIT_HASH}/${src_string}`;
  (async () => {
    try {
      const response = await fetch(src_url);
      if (!response.ok) {
        console.error("what now", response);
        start_page();
        return;
      }
      const text = await response.text();
      start_page(text.split(/\r?\n/));
    } catch (e) {
      console.error("why...", e);
      start_page();
    }
  })()
} else {
  start_page();
}
