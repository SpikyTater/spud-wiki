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
    const num_resulting_elements = 10;
    const highest_scoring = new Array(num_resulting_elements*2);

    highest_scoring.fill(0);

    function score_finding(s, data) {












function _min(d0, d1, d2, bx, ay)
  {
    return d0 < d1 || d2 < d1
        ? d0 > d2
            ? d2 + 1
            : d0 + 1
        : bx === ay
            ? d1
            : d1 + 1;
  }

   function xxx(a, b)
  {
    if (a === b) {
      return 0;
    }

    if (a.length > b.length) {
      var tmp = a;
      a = b;
      b = tmp;
    }

    var la = a.length;
    var lb = b.length;

    while (la > 0 && (a.charCodeAt(la - 1) === b.charCodeAt(lb - 1))) {
      la--;
      lb--;
    }

    var offset = 0;

    while (offset < la && (a.charCodeAt(offset) === b.charCodeAt(offset))) {
      offset++;
    }

    la -= offset;
    lb -= offset;

    if (la === 0 || lb < 3) {
      return lb;
    }

    var x = 0;
    var y;
    var d0;
    var d1;
    var d2;
    var d3;
    var dd;
    var dy;
    var ay;
    var bx0;
    var bx1;
    var bx2;
    var bx3;

    var vector = [];

    for (y = 0; y < la; y++) {
      vector.push(y + 1);
      vector.push(a.charCodeAt(offset + y));
    }

    var len = vector.length - 1;

    for (; x < lb - 3;) {
      bx0 = b.charCodeAt(offset + (d0 = x));
      bx1 = b.charCodeAt(offset + (d1 = x + 1));
      bx2 = b.charCodeAt(offset + (d2 = x + 2));
      bx3 = b.charCodeAt(offset + (d3 = x + 3));
      dd = (x += 4);
      for (y = 0; y < len; y += 2) {
        dy = vector[y];
        ay = vector[y + 1];
        d0 = _min(dy, d0, d1, bx0, ay);
        d1 = _min(d0, d1, d2, bx1, ay);
        d2 = _min(d1, d2, d3, bx2, ay);
        dd = _min(d2, d3, dd, bx3, ay);
        vector[y] = dd;
        d3 = d2;
        d2 = d1;
        d1 = d0;
        d0 = dy;
      }
    }

    for (; x < lb;) {
      bx0 = b.charCodeAt(offset + (d0 = x));
      dd = ++x;
      for (y = 0; y < len; y += 2) {
        dy = vector[y];
        vector[y] = dd = _min(dy, d0, dd, bx0, vector[y + 1]);
        d0 = dy;
      }
    }

    return dd;
  };







return xxx(s, data);








    }
    function add_to_result_arr(score, data) {
for (let i=0;i<num_resulting_elements * 2;i+=2) {

}
    }

    for (const k in SEARCH_DATA) {
      const v = SEARCH_DATA[k], score = score_finding(str, v.str);
      add_to_result_arr(score, v);
    }

    console.log(highest_scoring);
  }
}

if ("loading" === document.readyState)
  window.addEventListener("DOMContentLoaded", AfterDomLoaded, { once: true, passive: true });
else AfterDomLoaded();
