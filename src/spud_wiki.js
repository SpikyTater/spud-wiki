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
import { existsSync, mkdirSync, readdirSync } from "fs";
import { readFile, stat, writeFile } from "fs/promises";
import path from "path";
import { SpudTextContext, SpudText } from "./spudtext.js";
import { THEMES } from "./global_constants.js";
import { MEDIA_ASSETS } from "./media_assets.js";

const COPYRIGHT_COMMENT = `<!--Spud Wiki Engine\nCopyright (C) ${(new Date()).getFullYear()}  SpikyTater\n\nThis program is free software; you can redistribute it and/or modify\nit under the terms of the GNU General Public License as published by\nthe Free Software Foundation; either version 2 of the License, or\n(at your option) any later version.\n\nThis program is distributed in the hope that it will be useful,\nbut WITHOUT ANY WARRANTY; without even the implied warranty of\nMERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\nGNU General Public License for more details.\n\nYou should have received a copy of the GNU General Public License along\nwith this program; if not, write to the Free Software Foundation, Inc.,\n51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.-->\n`;

class SpudWikiAsset {
  static PAGE = Symbol("asset_page");
  static SPECIAL_PAGE = Symbol("asset_special_page");
  static MEDIA = Symbol("asset_media");

  /**
   * @type {Symbol}
   */
  asset_type;

  /**
   * @type {string}
   */
  src_file_path;

  /**
   * @type {bigint}
   */
  last_modified_ns;

  /**
   * @type {string | Buffer | SpudText}
   */
  data;

  /**
   * @type {any}
   */
  options;

  /**
   * @type {string}
   */
  dst_path;

  /**
   * @type {string}
   */
  link;

  /**
   * 
   * @param {SpudWiki} spud_wiki
   * @param {symbol} asset_type 
   * @param {string} src_file_path 
   * @param {any} data 
   */
  constructor(spud_wiki, asset_type, src_file_path, options) {
    if (typeof asset_type !== "symbol") {
      console.error("Not a Symbol.");
      throw 0;
    }

    let not_found = true;
    for (const key in SpudWikiAsset) {
      if (asset_type === SpudWikiAsset[key]) {
        not_found = false;
        break;
      }
    }

    if (not_found) {
      console.error(`Asset type ${asset_type.toString()} not found.`);
      throw 0;
    }

    this.asset_type = asset_type;

    if (src_file_path) {
      this.src_file_path = src_file_path;
    } else {
      this.SetDataAndPostProcess(spud_wiki, options.data);
    }

    if (options.dst_path) {
      this.dst_path = options.dst_path;
    }

    this.options = options;
  }

  /**
   * @param {bigint} n 
   */
  SetLastModifiedNs(n) {
    this.last_modified_ns = n;
  }

  /**
   * @param {SpudWiki} spud_wiki
   * @param {string | Buffer} data
   * 
   * 
   */
  SetDataAndPostProcess(spud_wiki, data) {
    switch (this.asset_type) {
      case SpudWikiAsset.SPECIAL_PAGE:
      case SpudWikiAsset.PAGE: {
        const { src_file_path } = this;
        this.data = new SpudTextContext(data, {
          warn_callbacks: [
            function (data) {
              console.warn(`SpudTextContext: ${src_file_path}: ${data}`);
            }
          ],
          error_callbacks: [
            function (data) {
              console.error(`SpudTextContext: ${src_file_path}: ${data}`);
            }
          ],
        }).GetSpudText();
        if (!this.data) {
          throw 0;
        }

        return this;
      }
      case SpudWikiAsset.MEDIA: {
        this.data = data;
        return this;
      }
    }
    return this;
  }

  /**
   * 
   * @param {SpudWiki} spud_wiki 
   * @returns {string | Buffer}
   */
  GetDstFileData(spud_wiki) {
    switch (this.asset_type) {
      case SpudWikiAsset.MEDIA:
        return this.data;
      case SpudWikiAsset.SPECIAL_PAGE:
      case SpudWikiAsset.PAGE: {
        const { data } = this;
        let s = '<!DOCTYPE html>\n' + COPYRIGHT_COMMENT + '<html dir="ltr" lang="en"><head>';

        // head stuff
        s += '<meta charset="utf-8">';
        s += `<title>${data.title}</title>`;

        s += '<link rel="stylesheet" href="/spud-wiki/assets/style.css">';

        s += '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">';
        s += '<meta name="application-name" content="Spud Wiki">';
        s += `<meta name="title" content="${data.title}">`;
        s += '<link rel="icon" href="/spud-wiki/media/logo.png">';


        s += '<script src="/spud-wiki/assets/main.js"></script>';
        if (this.options.additional_script) {
          s += `<script src="${this.options.additional_script}"></script>`;
        }

        // close head, start body
        s += "</head><body>";

        // body header
        s += '<a id="logo-link" href="/spud-wiki/" title="Go to Main Page"><img id="logo" src="/spud-wiki/media/logo.png"/><span>Spud</span><span>Wiki</span></a><div id="search-cont"><input type="search" spellcheck="false" id="search-input" placeholder="Search..."/><div id="search-cont-outer"><div id="search-cont-inner"><a class="search-result"></a><a class="search-result"></a><a class="search-result"></a><a class="search-result"></a><a class="search-result"></a><a class="search-result"></a><a class="search-result"></a><a class="search-result"></a><a class="search-result"></a><a class="search-result"></a></div></div></div>';









        // body middle section start
        //  s += '<div id="section-middle">';

        s += spud_wiki.site_map_html_string;

        // start content section
        // TODO: do_center_title should go inside spudtext
        //  s += `<div id="content" class="content${data.do_center_title ? ' do_center_title' : ""}">`;
        s += data.GetTitleHtmlString();

        s += `<div id="content" class="content">`;
        s += data.GetHtmlString();

        if (this.options.append_to_content) {
          s += this.options.append_to_content;
        }

        // end content section
        s += '</div>';

        // TODO: article map
        s += '<div id="right-sidebar"></div>'

        // body middle section end, footer start
        //  s += '</div>';

        // footer

        s += '<div id="footer-info">Content on this website is licensed under <a target="_blank" rel="noopener noreferrer" href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a> unless otherwise noted.<br>This website is not associated with PearlescentMoon, Hermitcraft or Twitch.</div>';

        // contributors

        if (data.contributors.length) {
          s += '<div id="footer-contributors">The content of this page is licensed under <a target="_blank" rel="noopener noreferrer" href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a> and it was written by ';

          const c = data.contributors, l = c.length;
          for (let i = 0; i < l; i++) {
            const contributor = c[i];
            let forced_color;

            if (contributor.username === "BlueStrategosJ" && data.make_blue_red) {
              forced_color = "f77";
            }

            const contributor_html_string = c[i].GetHtmlString(forced_color);

            if (l - i >= 3) {
              s += contributor_html_string + ", ";
            } else if (l - i === 2) {
              s += contributor_html_string + " and ";
            } else {
              s += contributor_html_string + ".";
            }
          }


          s += '</div>';
        }

        // theme
        {
          // TODO: themes

          s += '<div id="theme-cont">Theme: <select id="theme-select">'



          for (const theme of THEMES) {
            s += `<option value="${theme.toLowerCase()}">${theme}</option>`
          }


          s += '</select></div>'
        }


        // close footer, body and html
        return s + "</body></html>";
      }
    }
  }


}

export default class SpudWiki {
  /**
   * @type {Promise<SpudWikiAsset>[]}
   */
  #ASSET_PROMISES = []

  /**
   * @type {Map<symbol, SpudWikiAsset[]>}
   */
  ASSET_MAP = new Map();

  /**
   * @type {Map<string,SpudWikiAsset>}
   */
  MAP_PATH_TO_ASSET = new Map();

  /**
   * Whether the wiki should be built faster and for local use or for deployment
   * @type {boolean}
   */
  is_dev_build;

  /**
   * @type {string}
   */
  site_map_html_string = "";

  /**
   * @param {boolean} is_dev_build 
   */
  constructor(is_dev_build) {
    this.is_dev_build = !!is_dev_build;

    [
      SpudWikiAsset.PAGE,
      SpudWikiAsset.SPECIAL_PAGE,
      SpudWikiAsset.MEDIA,
    ].forEach(function (asset_type) {
      this.ASSET_MAP.set(asset_type, []);
    }, this);
  }

  /**
   * 
   * @param {symbol} asset_type 
   * @param {string} src_file_path 
   * @param {any} options 
   */
  #AddAssetFile(asset_type, src_file_path, options) {
    if (typeof src_file_path !== "string" && !(src_file_path instanceof String)) {
      console.error("'src_file_path' is not a string", src_file_path);
      throw 0;
    }

    if (!existsSync(src_file_path)) {
      console.error(`File '${src_file_path}' does not exist.`);
      return true;
    }

    const asset = new SpudWikiAsset(this, asset_type, src_file_path, options || {});

    // using bigint so it won't break in 2038, of course
    const promise = stat(src_file_path, { bigint: true }).then(stats => {
      if (!stats.isFile()) {
        throw `Path '${src_file_path}' does not represent a file.`;
      }

      asset.SetLastModifiedNs(stats.mtimeNs);

      if (asset_type === SpudWikiAsset.MEDIA) {
        return readFile(src_file_path);
      }
      return readFile(src_file_path, { encoding: "utf8" });
    }).then(asset.SetDataAndPostProcess.bind(asset, this));

    this.#ASSET_PROMISES.push(promise);

    return false;
  }

  /**
   * @param {string} src_file_path 
   */
  AddWikiPage(src_file_path) {
    return this.#AddAssetFile(SpudWikiAsset.PAGE, src_file_path);
  }

  AddSpecialPage(src_file_path, options) {
    return this.#AddAssetFile(SpudWikiAsset.SPECIAL_PAGE, src_file_path, options);
  }

  AddMediaFile(src_file_path, options) {
    return this.#AddAssetFile(SpudWikiAsset.MEDIA, src_file_path, options);
  }

  AddAllMediaAssets() {
    for (const media_asset_name in MEDIA_ASSETS) {
      const media_asset = MEDIA_ASSETS[media_asset_name];
      this.#AddAssetFile(SpudWikiAsset.MEDIA, media_asset.src_path, {
        dst_path: media_asset.GetBuildPath()
      });
    }
  }

  async WaitForReadingCompletion() {
    return Promise.allSettled(this.#ASSET_PROMISES).then(results => {
      for (const result of results) {
        if (result.status === "fulfilled") {
          const asset = result.value;

          this.ASSET_MAP.get(asset.asset_type).push(asset);
        } else {
          console.log("FAILED", result.reason);
        }
      }
    });
  }

  AddAllPagesInsideDocs() {
    const files_in_docs = readdirSync(path.join(".", "docs"), { recursive: true });
    for (const file_path of files_in_docs) {
      this.AddWikiPage(path.join(".", "docs", file_path));
    }
  }

  /**
   * 
   * @param {string} s 
   * @returns {string}
   */
  SanitizeString(s) {
    let r = "";

    const l = s.length;
    for (let i = 0; i < l; i++) {
      const c = s.codePointAt(i);
      if (c < 48) { // 0
        r += "_";
      } else if (c <= 57) { // 9
        r += String.fromCodePoint(c);
      } else if (c < 65) { // A
        r += "_";
      } else if (c <= 90) { // Z
        r += String.fromCodePoint(c + 32);
      } else if (c < 97) { // a
        r += "_";
      } else if (c <= 122) {// z
        r += String.fromCodePoint(c);
      } else {
        r += "_";
      }
    }

    return r;
  }

  ParseWikiPages() {
    const pages = this.ASSET_MAP.get(SpudWikiAsset.PAGE);
    /**
     * @type {Map<string,SpudWikiAsset>}
     */
    const page_map = new Map();

    for (const page of pages) {
      /**
       * @type {SpudText}
       */
      const spud_text = page.data, { title } = spud_text;
      if (page_map.has(title)) {
        console.error(`There is more than one page named '${title}'.`);
        continue;
      }
      page_map.set(title, page);
    }

    for (const [title, page] of page_map) {
      const sanitized_title = this.SanitizeString(title);
      let dst_path, i = 0;

      do {
        if (i) {
          dst_path = `./build/dist/${sanitized_title}_${i}.html`
        } else {
          dst_path = `./build/dist/${sanitized_title}.html`
        }
        i++;
      } while (this.MAP_PATH_TO_ASSET.has(dst_path));

      page.dst_path = dst_path;
      page.link = path.posix.join("/spud-wiki", path.posix.relative("./build/dist", dst_path));

      this.MAP_PATH_TO_ASSET.set(dst_path, page);

    }
  }

  #CreateSiteMapHtmlString() {
    // site_map_html_string
    // TODO:
    let s = '<nav id="side-nav">';

    s += '<a href="/spud-wiki/">Main Page</a><a href="/spud-wiki/credits.html">Credits</a><a href="/spud-wiki/editor.html">SpudText Editor</a><div class="div-sep"></div>';
    const all_articles = this.ASSET_MAP.get(SpudWikiAsset.PAGE), l = all_articles.length;
    for (let i = 0; i < l; i++) {
      const article = all_articles[i];

      s += `<a href="${article.link}">${article.data.title}</a>`;
    }
    s += "</nav>"

    this.site_map_html_string = s;
  }

  PrepareForBuild() {
    // prepare media files
    const all_media_files = this.ASSET_MAP.get(SpudWikiAsset.MEDIA);
    for (const media of all_media_files) {
      if (!media.dst_path) {
        media.dst_path = `./build/dist/media/${path.basename(media.src_file_path)}`;
      }

      media.link = path.posix.join("/spud-wiki", path.posix.relative("./build/dist", media.dst_path));

      this.MAP_PATH_TO_ASSET.set(media.dst_path, media);
    }

    this.#CreateSiteMapHtmlString();

    // TODO: article navigator ?? what is this. I can't remember what I meant and I'm too scared to delete this todo




  }

  BuildTest() {
    for (const [asset_type, assets] of this.ASSET_MAP) {
      for (const asset of assets) {
        console.log(asset.dst_path, asset.src_file_path);
      }
    }
  }

  async Build() {
    if (!existsSync("./build")) {
      mkdirSync("./build");
    }
    if (!existsSync("./build/dist")) {
      mkdirSync("./build/dist");
    }
    if (!existsSync("./build/dist/media")) {
      mkdirSync("./build/dist/media");
    }

    const search_map = {};

    const command_map = {};

    function add_search_map_string(str, is_title, link) {
      if (Object.hasOwn(search_map, str)) {
        console.error(`Duplicate search_string '${str}'.`);
      } else {
        search_map[str] = {
          str, is_title, link, lc_str: str.toLowerCase()
        };
      }
    }

    function add_command(cmd_string, link) {
      if (Object.hasOwn(command_map, cmd_string)) {
        console.error(`Duplicate command '${cmd_string}'.`);
      } else {
        command_map[cmd_string] = {
          cmd: cmd_string, link
        };
      }
    }

    const promises = []
    for (const [asset_type, assets] of this.ASSET_MAP) {
      for (const asset of assets) {
        const data = asset.GetDstFileData(this);
        console.log(asset.dst_path.padEnd(60, " "), asset.src_file_path.padEnd(60, " "), data?.length);

        promises.push(writeFile(asset.dst_path, data));

        if (SpudWikiAsset.PAGE === asset_type) {
          // create search list
          const spud_text = asset.data;

          if (!spud_text.no_search_index) {
            add_search_map_string(spud_text.title, true, asset.link);
          }
          // TODO: add for each redirect

          if (spud_text.commands.length) {
            for (const cmd_string of spud_text.commands) {
              add_command(cmd_string, asset.link);
            }
            // console.log(spud_text.commands)
          }
        }

      }
    }


    const intermediate_search_helper_file_data = `/*This file was automatically generated. DO NOT EDIT.*/"use strict";const SEARCH_DATA=${JSON.stringify(search_map, null, this.is_dev_build ? 2 : 0)};export default SEARCH_DATA;`;
    promises.push(writeFile("./build/search_data.js", intermediate_search_helper_file_data));

    const intermediate_command_helper_file_data = `/*This file was automatically generated. DO NOT EDIT.*/"use strict";const COMMAND_DATA=${JSON.stringify(command_map, null, this.is_dev_build ? 2 : 0)};export default COMMAND_DATA;`;
    promises.push(writeFile("./build/command_data.js", intermediate_command_helper_file_data));


    return Promise.allSettled(promises);
  }

}