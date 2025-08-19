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

import { existsSync, rmSync } from "fs";
import process from "process";
import SpudWiki from "./spud_wiki.js";
import { ValidateMediaAssets } from "./media_assets.js";
import CONTRIBUTORS, { ValidateContributors } from "./contributors.js";

async function Build(is_dev_build) {
  const wiki = new SpudWiki(is_dev_build);

  wiki.AddSpecialPage("./src/special_pages/main.txt", { dst_path: "./build/dist/index.html" });
  wiki.AddSpecialPage("./src/special_pages/editor.txt", {
    dst_path: "./build/dist/editor.html",
    additional_script: "/spud-wiki/assets/editor.js"
  });
  wiki.AddSpecialPage("./src/special_pages/404.txt", { dst_path: "./build/dist/404.html" });
  wiki.AddSpecialPage("./src/special_pages/credits.txt", {
    dst_path: "./build/dist/credits.html",
    append_to_content: (() => {
      let s = "";
      for (const lc_username in CONTRIBUTORS) {
        const contributor = CONTRIBUTORS[lc_username];
        s += `<p class="credits-contributor">${contributor.GetHtmlString()}</p>`;
      }
      return s;
    })()
  });

  // TODO: add a way to avoid having articles with the same names as special pages. maybe add articles to /spud-wiki/articles/ ?
  wiki.AddAllPagesInsideDocs();

  wiki.AddAllMediaAssets();

  await wiki.WaitForReadingCompletion();

  wiki.ParseWikiPages();
  wiki.PrepareForBuild();

  await wiki.Build();
}

switch (process.argv[2]) {
  case "build": Build(false); break;
  case "build:dev": Build(true); break;
  case "clean": {
    if (existsSync("./build")) {
      rmSync("./build", { recursive: true });
      console.log("Cleaning successful.");
    } else {
      console.log("No cleaning was needed.");
    }
    break;
  }
  case "test_something": {
    const wiki = new SpudWiki(true), docs = process.argv.slice(3);
    for (const doc of docs) {
      const fpath = `./docs/${doc}.txt`;

      wiki.AddWikiPage(fpath);

      await wiki.WaitForReadingCompletion();
    }
    break;
  }
  case "validate": {
    // don't exit immediately on error, check everything first
    if (ValidateMediaAssets()) {
      process.exitCode = 1;
    }
    if (ValidateContributors()) {
      process.exitCode = 1;
    }
    break;
  }
  default:
    console.error("Unknown command.");
    break;
}
