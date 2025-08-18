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
import { CONTRIBUTORS_ARR, GetContributorHtmlString } from "./contributors.js";

async function Build_NEW(is_dev_build) {
  const wiki = new SpudWiki(is_dev_build);

  wiki.AddAllPagesInsideDocs();
  wiki.AddCssFile("./src/assets/style.css");

  wiki.AddSpecialPage("./src/special_pages/main.txt", { dst_path: "./build/index.html" });
  wiki.AddSpecialPage("./src/special_pages/credits.txt", {
    dst_path: "./build/credits.html",
    append_to_content: (() => {
      let s = "";
      CONTRIBUTORS_ARR.forEach(c => {
        s += `<p class="credits-contributor">${GetContributorHtmlString(c)}</p>`;
      });
      return s;
    })()
  });

  wiki.AddMediaFile("./src/media/logo.png");
  wiki.AddMediaFile("./src/media/favicon.ico", { dst_path: "./build/favicon.ico" });

  await wiki.WaitForReadingCompletion();

  wiki.ParseWikiPages();
  wiki.PrepareForBuild();

  await wiki.Build();
}

switch (process.argv[2]) {
  case "build": Build_NEW(false); break;
  case "build:dev": Build_NEW(true); break;
  case "clean": {
    if (existsSync("./build")) {
      rmSync("./build", { recursive: true });
      console.log("Cleaning successful.");
    } else {
      console.log("No cleaning was needed.");
    }
    break;
  }
  case "test_doc": {
    const wiki = new SpudWiki(true), docs = process.argv.slice(3);
    for (const doc of docs) {
      const fpath = `./docs/${doc}.txt`;

      wiki.AddWikiPage(fpath);

      await wiki.WaitForReadingCompletion();
    }
    break;
  }
  default:
    console.error("Unknown command.");
    break;
}
