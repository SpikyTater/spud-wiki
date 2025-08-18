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
}

if ("loading" === document.readyState)
  window.addEventListener("DOMContentLoaded", AfterDomLoaded, { once: true, passive: true });
else AfterDomLoaded();
