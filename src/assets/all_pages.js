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
// This is the ONLY javascript file that is deployed to ALL PAGES OF THE WIKI
// inside their <head> element.

import COMMAND_DATA from "../../build/command_data.js";
import SEARCH_DATA from "../../build/search_data.js";
import { THEMES } from "../global_constants.js";

const LC_THEMES = THEMES.map(theme => theme.toLowerCase());

let theme = localStorage.getItem("spud-wiki-theme");
if (!theme || !LC_THEMES.includes(theme)) {
  theme = LC_THEMES[0];
}

function AfterDomLoaded() {
  // first set anything loaded via localStorage, then add a listener for changes
  const theme_select = document.getElementById("theme-select");
  if (theme_select) {
    theme_select.value = theme.toLowerCase();
  } else {
    console.error("why is there no theme-select...");
  }

  const query_string = new URLSearchParams(window.location.search);
  const redirect_string = query_string.get("redirect");
  const red_el = document.getElementById("redirect-lbl");
  if (redirect_string) {
    red_el.innerHTML = `(redirected from <i><b>${decodeURIComponent(redirect_string)}</b></i>)`;
  } else {
    red_el.remove();
  }

  window.addEventListener("change", function ({ target }) {
    switch (target instanceof HTMLSelectElement && target?.id) {
      case "theme-select":
        // theme has changed, save it
        localStorage.setItem("spud-wiki-theme", target.value);
        break;
    }
  }, { passive: true });

  function SearchString(str) {
    const max_search_results = 10, arr = [];

    function add_to_result_arr(curr_score, data) {
      const l = arr.length;
      let i = 0;
      for (; i < max_search_results && i < arr.length; i++) {
        if (curr_score && curr_score > arr[i].score) {
          arr.splice(i, 0, { score: curr_score, data });
          if (max_search_results === l) {
            arr.length = max_search_results;
          }
          return;
        }
      }
      if (curr_score && i < max_search_results) {
        arr.push({ score: curr_score, data });
      }
    }

    // TODO: ew
    function score_strings(a, b) {
      if (b.startsWith(a)) return 2;
      if (b.includes(a)) return 1;
      return 0;
    }

    for (const k in SEARCH_DATA) {
      const v = SEARCH_DATA[k];
      if (v.can_search) {
        const score = score_strings(str, v.lc_str);
        add_to_result_arr(score, v);
      }
    }

    return arr;
  }

  let old_el;

  const search_cont_inner = document.getElementById("search-cont-inner");
  document.getElementById("search-input").addEventListener("input", e => {
    let s = e?.target?.value;

    if (typeof s !== "string" || s.length < 1) {
      search_cont_inner.classList.remove("search-show");
      if (old_el) {
        old_el.classList.remove("stahp");
        old_el = undefined;
      }
      return;
    }
    //    console.log("HHH", s)
    //console.log(s)
    search_cont_inner.classList.add("search-show");

    s = s.toLowerCase().trim();
    const search_results = SearchString(s);

    // window.requestAnimationFrame(() => {
    let i = 0;
    for (; i < search_results.length && i < 10; i++) {
      const el = search_cont_inner.children[i], d = search_results[i].data;
      el.textContent = d.title; //search_results[i].data.str;
      if (d.is_title) {
        el.href = d.link;
      } else {
        el.href = `${d.link}?redirect=${encodeURIComponent(d.str)}`;
        el.setAttribute("data-redirect", `(redirect from '${d.str}')`);
      }
    }
    if (i < 10) {
      const el = search_cont_inner.children[i];
      if (el !== old_el) {
        el.classList.add("stahp");

        if (old_el) {
          old_el.classList.remove("stahp");
        }
        old_el = el;
      }

    } else {
      if (old_el) {
        old_el.classList.remove("stahp");
        old_el = undefined;
      }
    }
  }, { passive: true });

  document.getElementById("search-input").addEventListener("change", e => {
    const s = e?.target?.value;
    if (!s || s.length <= 1) return;
    if (!s.codePointAt(0) === 33) return;
    const cmd = s.substring(1).toLowerCase().trim();
    if (Object.hasOwn(COMMAND_DATA, cmd)) {
      window.location.href = COMMAND_DATA[cmd].link;
    }
    //console.log(s);
  })

  /*document.getElementById("search-input").addEventListener("focusout", e => {
    search_cont_inner.classList.remove("search-show");
  });

  document.getElementById("search-input").addEventListener("focusin", e => {
    if (old_el) {
      search_cont_inner.classList.add("search-show");
    }
  });*/

}

if ("loading" === document.readyState)
  window.addEventListener("DOMContentLoaded", AfterDomLoaded, { once: true, passive: true });
else AfterDomLoaded();
