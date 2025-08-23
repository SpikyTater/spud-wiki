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

import { existsSync, readFileSync, rmSync } from "fs";
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
  wiki.AddSpecialPage("./src/special_pages/about.txt", { dst_path: "./build/dist/about.html" });
  wiki.AddSpecialPage("./src/special_pages/changelog.txt", { dst_path: "./build/dist/changelog.html" });

  wiki.AddSpecialPageFromString(`!title Bulletin Board
!nosearchindex
!noedit
!nolastmodified

Oh my [Larry], thank you so much for coming here!
If you wish to help with the making of the wiki there are currently many tasks for you to do.
Even if you don't find anything you feel you could help with, you can always browse the wiki for typos, weirdly constructed sentences, and just anything else.

== Developer Area ==

This website is powered by the Spud Engine, which you can find in the 'src' directory of the [[https://github.com/SpikyTater/spud-wiki repository]].
It is fully written in Javascript and it compiles all the SpudText pages into HTML files which are then uploaded to GitHub Pages.
SpudText is a file format which takes (a lot of) inspiration from Markdown and WikiText file formats.
Here is the current developer to-do list:
${readFileSync("./dev_todo.txt")}

== Articles Area ==

While there is already an impressive number of articles on this wiki, there are still many more than need doing!
In this list you will find all articles that are either being worked on by somebody or currently waiting for **YOU** to work on them.
If you want to do so, please whisper [[https://www.twitch.tv/matty5957 Matty5957]] on Twitch or report it as an issue in the GitHub repository.
When you do finish working on your articles, either whisper it to Matty, contact Matty on Pearlcord, use a GitHub issue or a Pull Request to have it added to the wiki.
Remember, you have to explicitly say you agree with licensing your article under [[https://creativecommons.org/licenses/by-nc-sa/4.0/ CC BY-NC-SA 4.0]] or a less restrictive license.
Also, if for any reason you don't want your name added to the list of contributors, feel free say it!
Here are the articles we're still missing:
${readFileSync("./article_ideas.txt")}

== Artist Area ==

**PLEASE STAY HERE, OH ARTIST!**
The only "art", if we want to call it as such, is the logo of the wiki, hand-drawn by Matty on MS Paint.
It is not great. If you want to give us some art for some articles, art for the currently barren background of all pages, art for anything really, feel free to reach out!
As you can see by the artistry of the logo, you don't need to be god at drawing to have your art added to the wiki.
Same as with articles, you have to explicitly agree to license your art under [[https://creativecommons.org/licenses/by-nc-sa/4.0/ CC BY-NC-SA 4.0]] or a less restrictive license and, again, if you don't want your name added to the list of contributors, you can say so.

== Design Area ==

Psst, artist, are you still here?
Yes, we still need you. We always need you. Yes, you, I'm talking exactly to **YOU** \**points finger*\*.
Can you see how beautifully and carefully designed is the wiki?
**BECAUSE IT'S NOT!!!!!**
We need all your help... Please feel free to reach out with any ideas you have.

== Anything else ==

Do you have any other ideas? Please reach out to us!
`,"./build/dist/bulletin_board.html");

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
  wiki.AddAllPagesInsideDirectory("docs");

  if (is_dev_build) {
    wiki.AddAllPagesInsideDirectory("test_docs");
  }
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
