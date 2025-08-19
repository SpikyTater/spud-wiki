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
// This is the only javascript file that is deployed to ALL PAGES OF THE WIKI inside their <head> element
// This script also undergoes a building process:
//   - some constants will be added on top (e.g. THEMES)
//   - all code in this will be included inside an IIFE, so don't worry
//     about polluting the global object

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

  window.addEventListener("change", function ({ target }) {
    switch (target instanceof HTMLSelectElement && target?.id) {
      case "theme-select":
        // theme has changed, save it
        localStorage.setItem("spud-wiki-theme", target.value);
        break;
    }
  }, { passive: true });

  function SearchString(str) {
    // const num_resulting_elements = 10;
    const highest_scoring = [];



    function add_to_result_arr(curr_score, data) {

      let i = 0;

      while (i < highest_scoring.length && highest_scoring[i] > curr_score) {
        i += 2;
      }
      if (curr_score > 0)
        highest_scoring.splice(i, 0, curr_score, data);


      /*for (let i = 0; i < highest_scoring.length; i += 2) {
        const score = highest_scoring[i];

        if (curr_score > score) {
          if (2===highest_scoring.length && 0 ===highest_scoring[1]) {
highest_scoring[0]= curr_score;
highest_scoring[1]=data;
          }else {
            highest_scoring.splice(i, 0, curr_score, data);
            if (highest_scoring.lastIndexOf > num_resulting_elements * 2) {
              highest_scoring.length = num_resulting_elements * 2;
              
            }
          }
          break;
        }
      }*/

    }

    function score_strings(a, b) {
      if (b.startsWith(a)) return 5;
      if (b.includes(a)) return 1;
      return 0;
    }

    for (const k in SEARCH_DATA) {
      const v = SEARCH_DATA[k], score = score_strings(str, v.lc_str);
      add_to_result_arr(score, v);
    }

    return highest_scoring;
    //console.log(highest_scoring);
  }

  let old_el;

  document.getElementById("search-input").addEventListener("input", e => {
    const s = e?.target?.value;

    if (typeof s !== "string" || s.length < 1) return;
    //console.log(s)

    const scoring = SearchString(s);
    let i = 1;

    let el_to_stahp_at;
    for (; i < scoring.length && i < 20; i += 2) {
      el_to_stahp_at = document.getElementById("search-cont-inner").children[i / 2 | 0];
      
      el_to_stahp_at.textContent = scoring[i].str;
    }

    // if (i > 1 && i < 20) {
    //const el = document.getElementById("search-cont-inner").children[i / 2 | 0];

    //  if (old_el !== el_to_stahp_at) {
    if (el_to_stahp_at) {
      el_to_stahp_at.nextElementSibling?.classList.add("stahp");
    }
    if (old_el) {
      old_el.classList.remove("stahp");
    }
    old_el = el_to_stahp_at.nextElementSibling;
    //   }
    //  }

  }, { passive: true });


}

if ("loading" === document.readyState)
  window.addEventListener("DOMContentLoaded", AfterDomLoaded, { once: true, passive: true });
else AfterDomLoaded();
