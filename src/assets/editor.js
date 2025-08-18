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

import { SpudTextContext } from "../spudtext.js";

import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine } from "@codemirror/view"
import { defaultKeymap, historyKeymap, history } from "@codemirror/commands"
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete"
import { bracketMatching } from "@codemirror/language"
import { Text } from "@codemirror/state"

function AfterDomLoaded() {
  // initializing the UI
  const content_container = document.getElementById("content");

  const editor_container = document.createElement("div");
  editor_container.id = "editor-container";

  const display_content_container = document.createElement("div");
  display_content_container.id = "editor-content";
  display_content_container.className = "content";

  const errors_container = document.createElement("div");
  errors_container.id = "editor-parserconsole";

  const button = document.createElement("button");
  button.textContent = "pls work";



  content_container.append(editor_container, button, errors_container, display_content_container);

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

  // config.doc = Text.of(arr) -> arr is an array of lines, I believe

  const editor_view = new EditorView(config);


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
        display_content_container.innerHTML = spud_text.GetHtmlString();
      }
    } catch (e) {

      
      console.error(e);
      errors_html += `<p class="editor-critical">${e?.message || e?.name}. Check console.for more info.</p>`;
    }
    errors_container.innerHTML = errors_html;
  };
}
if ("loading" === document.readyState)
  window.addEventListener("DOMContentLoaded", AfterDomLoaded, { once: true, passive: true });
else AfterDomLoaded();

/*

!title Lol
!contributor Matty5957

hello?

== Does it really work first try? ==

Omg I'#m *so* **excited** how about# you?

*/