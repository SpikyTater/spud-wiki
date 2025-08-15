/*
Spud Wiki Engine
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
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync, cpSync, copyFileSync, rm, statSync } from "fs";
import path from "path";
import process from "process";
//import { Parser, Builder } from "xml2js";

// A big thanks to every single one of you. <3
const CONTRIBUTORS = {};
const COPYRIGHT_COMMENT = `<!--Spud Wiki Engine\nCopyright (C) ${(new Date()).getFullYear()}  SpikyTater\n\nThis program is free software; you can redistribute it and/or modify\nit under the terms of the GNU General Public License as published by\nthe Free Software Foundation; either version 2 of the License, or\n(at your option) any later version.\n\nThis program is distributed in the hope that it will be useful,\nbut WITHOUT ANY WARRANTY; without even the implied warranty of\nMERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\nGNU General Public License for more details.\n\nYou should have received a copy of the GNU General Public License along\nwith this program; if not, write to the Free Software Foundation, Inc.,\n51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.-->\n`;
//const HTML_TEMPLATES = {};
const ALL_ARTICLES = (function () {

  let files = readdirSync("./docs", { recursive: true }).map(s => s.replaceAll("\\", "/"));                             // reads every file in /docs and puts them into files

  const special_files = [                                                                                               
    "main.txt",
    "credits.txt",
    "test.txt",
  ];

  for (const f of special_files) {                                                                                      // removes special_files elements from files
    const idx = files.indexOf(f);
    if (-1 === idx) continue;

    files.splice(idx, 1);
  }
  return files.map(function (s) {                                                                                       // files elements consist now of {name: path name or .txt file, fpath: path to .txt file, name_no_ext: path name or .txt file without extension, dpath: path of resulting .html file}
    return {
      name: s,
      fpath: `./docs/${s}`,
      name_no_ext: s.substring(0, s.lastIndexOf(".")),
      dpath: `./build/${s.substring(0, s.lastIndexOf("."))}.html`
    }
  });
})();

const additional_args = (function ParseAdditionalArgs(argv) {
  const o = {}, l = argv.length;

  function TrimKey(s) {
    s = s.trim();
    let i = 0;
    while ("-" === s[i]) i++;
    return s.substring(i);
  }

  function AddArg(key, ...values) {
    key = TrimKey(key);

    if (values?.length) {
      o[key] = values.map(v => v.trim());
    } else {
      o[key] = true;
    }
  }

  for (let i = 3; i < l; i++) {
    const arg = argv[i].trim(), idx = arg.indexOf("=");
    if (-1 === idx) {
      AddArg(arg);
      continue;
    }

    const key = arg.substring(0, idx), values = arg.substring(idx + 1);

    if (values?.length) {
      AddArg(key, ...values.split(","));
    } else {
      AddArg(key);
    }
  }

  return o;
})(process.argv);

const linkInitiator ="§a"                                                                                       // defines the two characters who begin the link - Spammer92
const linkCloser = "§c"                                                                                         // defines the two characters end begin the link - Spammer92

function ReadFileAsText(fpath) {
  try {
    return readFileSync(fpath.trim(), { encoding: "utf8", flag: "r" }).trim();
  } catch (e) {
    console.error(e);
    return;
  }
}

class WikiPage {
  static ALL_WIKI_PAGES = [];
  static ALL_WIKI_PAGES_MAP = {};

  title = "";
  content = "";

  notes_arr = [];

  notes_html = "";

  contributors = [];

  special_page_handler;

  center_title = false;

  /**
   * 
   * @param {string} s 
   * @returns {string}
   */
  static HtmlifyString(s) {
    // TODO: this function looks terrible, there are many bugs, but it's all for later
    let res = "";
    const l = s.length;
    for (let i = 0; i < l; i++) {
      const c = s[i];
      if (c === "{" && (i === 0 || (i > 0 && s[i - 1] !== "\\"))) {
        // note start
        const idx = s.indexOf("}", i + 1);
        if (-1 === idx) {
          console.warn("Note does not end.");
          continue;
        }
        const refn = s.substring(i + 1, idx);

        res += `<sup id="ref-${refn}" class="article-ref"><a href="#bottom-ref-${refn}">[${refn}]</a></sup>`

        i = idx;
      } else if (c === "\\") {
        continue;
      }
      else if (c === "*" && (i === 0 || (i > 0 && s[i - 1] !== "\\"))) {
        if (i + 1 < l && s[i + 1] === "*") {
          // bold or (bold and italic)

          if (i + 2 < l && s[i + 2] === "*") {
            // bold and italic
            const idx = s.indexOf("***", i + 4);

            if (-1 === idx) {
              console.warn("Bold does not end.");
              continue;
            }

            res += `<span class="bold italic">${s.substring(i + 3, idx)}</span>`;
            i = idx + 2;

          } else {
            // bold
            const idx = s.indexOf("**", i + 3);

            if (-1 === idx) {
              console.warn("Bold does not end.");
              continue;
            }

            res += `<span class="bold">${s.substring(i + 2, idx)}</span>`;
            i = idx + 1;
          }
        } else {
          // italic
          const idx = s.indexOf("*", i + 2);

          if (-1 === idx) {
            console.warn("Italic does not end.");
            continue;
          }

          res += `<span class="italic">${s.substring(i + 1, idx)}</span>`;
          i = idx;
        }
      }
      else if (c === linkInitiator[0] && (i === 0 || (i > 0 && s[i - 1] !== "\\"))) {                           // evil words of Spammer92                          example link syntax §a=+altf4+TEXT§c
        if (i + 6 < l && s[i + 1] === linkInitiator[1]) {
          if (s.substring(i + 2, i + 4) === "=+") {

                const idx = s.indexOf(linkCloser, i + 5);
                if (-1 === idx) {
                    console.warn("Link does not end.");
                    continue;
                }

                let searchTerm = s.substring(i + 4, s.substring(i + 4).indexOf("+") + 4 + i);
                const searchTermSectionMarker = searchTerm.indexOf("#");
                let searchTermSection = "";

                if (searchTermSectionMarker !== -1) {
                    searchTermSection = searchTerm.substring(searchTermSectionMarker);
                    searchTerm = searchTerm.substring(0, searchTermSectionMarker);
                }

                let link;

                for (const element of ALL_ARTICLES) {
                    if (element.name_no_ext.substring(element.name_no_ext.lastIndexOf("/") + 1) === searchTerm) {
                        link = element.dpath.substring(7);
                        break;
                    }
                }

                const linkText = s.substring(s.substring(i + 4).indexOf("+") + 5 + i, idx);

                res += `<a href="/spud-wiki${link}${searchTermSection}">${linkText}</a>`;

                i = idx + 1;                                                                                                                                       // + 1 , because linkCloser is 2 char long
            }
            else {
                console.warn("Link is not forMATTYed correctly.");
                continue;
            }
        }
        else {
            console.warn("Link is not initialized.");
            continue;
        }

      }                                                                                                         //end of the evil script
      else {
        res += c;
      }

    }
    return res.trim().split(/[\s]+/gi).join(" ");
  }

  static ParseFromFile(fpath, special_page_handler) {
    const wp = new WikiPage();
    wp.special_page_handler = special_page_handler;

    let is_inside_blockquote = false;

    const str = ReadFileAsText(fpath);
    if (!str) return;

    const arr = str.split("\n"), al = arr.length;

    for (let i = 0; i < al; i++) {
      const s = arr[i].trim(), l = s.length;
      if (0 === l) {
        if (is_inside_blockquote) {
          is_inside_blockquote = false;
          wp.content += "</blockquote>";
        }
        continue;
      }

      if ("!" === s[0]) {
        // it's command
        const idx = s.indexOf("=");
        let cmd, arg;

        if (is_inside_blockquote) {
          is_inside_blockquote = false;
          wp.content += "</blockquote>";
        }

        if (-1 === idx) {
          cmd = s.substring(1).trim();
          arg = "";
        } else {
          cmd = s.substring(1, idx).trim();
          arg = s.substring(idx + 1).trim();
        }

        switch (cmd) {
          case "title":
            wp.title = arg;
            if (!arg.length) {
              console.warn(`Empty title for file '${fpath}'.`);
            }
            continue;
          case "contributor":
            if (wp.contributors.includes(arg)) {
              console.warn("Duplicate contributor.");
              continue;
            }
            if (!Object.hasOwn(CONTRIBUTORS, arg)) {
              console.error(`UNKNOWN CONTRIBUTOR '${arg}'.`);
              continue;
            }
            wp.contributors.push(arg);
            continue;
          case "br":
            wp.content += "<br/>"
            continue;
          case "center_title":
            wp.center_title = true;
            continue;
          case "section":
            wp.content += `<div class="article-secttitle">${arg}</div>`;
            continue;
          default: break;
        }

        if (cmd.startsWith("note")) {
          const ref = cmd.substring(4);

          wp.notes_arr.push({
            name: ref,
            value: arg
          });
          continue;
        }

        console.warn(`Unknown command '${cmd}' with arg '${arg}'.`);
      } else if (">" === s[0]) {
        if (!is_inside_blockquote) {
          is_inside_blockquote = true;
          wp.content += "<blockquote>";
        }

        wp.content += "<p>" + this.HtmlifyString(s.substring(1).trim()) + "</p>";

      } else {
        // it's not a command

        if (is_inside_blockquote) {
          is_inside_blockquote = false;
          wp.content += "</blockquote>";
        }

        wp.content += "<p>" + this.HtmlifyString(s) + "</p>";
      }
    }

    // make notes html, if there are any
    if (wp.notes_arr.length) {
      wp.notes_html = '<div id="bottom-refs">';

      for (let i = 0; i < wp.notes_arr.length; i++) {
        const n = wp.notes_arr[i];

        wp.notes_html += `<div class="bottom-ref" id="bottom-ref-${n.name}"><a href="#ref-${n.name}">${n.name}</a>: ${n.value}</div>`;
      }
      wp.notes_html += '</div>';
    }


    WikiPage.ALL_WIKI_PAGES.push(wp);
    return wp;
  }
}

/*async function ReadXmlFile(fpath) {
  const txt = ReadFileAsText(fpath);
  if (!txt) return;

  const parser = new Parser({ trim: true, normalizeTags: true, normalize: true, explicitRoot: true, explicitArray: true })


  return parser.parseStringPromise(txt);
}

function XmlToHtmlString(xml) {
  const builder = new Builder({
    headless: true,
    renderOpts: { pretty: false }
  });

  return builder.buildObject(xml);
}*/

/*async function LoadAllHtmlTemplates() {
  const FILES = [
    "header",
  ];



  return Promise.all(FILES.map(s => `./src/html_templates/${s}.xml`).map(ReadXmlFile)).then(function (res) {
    const l = res.length;
    for (let i = 0; i < l; i++) {
      HTML_TEMPLATES[FILES[i]] = XmlToHtmlString(res[i]);
    }
  });
}*/

function ReadJsonFile(fpath) {
  const txt = ReadFileAsText(fpath);
  if (!txt) return;
  try {
    return JSON.parse(txt, function (_key, value) {
      return (typeof value === "string" || value instanceof String) ? value.trim() : value;
    });
  } catch (e) {
    console.error(e);
    return;
  }
}

function GetContributorHtml(name) {
  if (!Object.hasOwn(CONTRIBUTORS, name)) {
    console.error("Unknown contributor.");
    return "";
  }
  const c = CONTRIBUTORS[name];
  return `<a target="_blank" rel="noopener noreferrer" class="tw-name" href="https://www.twitch.tv/${c.twitch_username}" style="color:#${c.color}">${name}</a>`;
}

let NAVIGATOR_SIDEBAR = "";

function CreateHtmlFileString(page) {
  let s = "<!DOCTYPE html>\n" + COPYRIGHT_COMMENT + "<html dir=\"ltr\" lang=\"en\"><head>";
  const title = page.title ? page.title : "EMPTY_TITLE";

  // head start
  s += '<meta charset="utf-8">';
  s += `<title>${title}</title>`;
  s += '<link rel="stylesheet" href="/spud-wiki/style.css">';
  s += '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">';
  s += '<meta name="application-name" content="Spud Wiki">';
  s += `<meta name="title" content="${title}">`;
  s += '<link rel="icon" href="/spud-wiki/assets/logo.png">';

  // head end
  s += "</head><body>";

  // body start
  s+='<div id="header"><div id="logo-cont"><a id="logo-link" href="/spud-wiki/" title="Go to Main Page"><img id="logo" src="/spud-wiki/assets/logo.png"/><div id="logo-title-cont"><span id="logo-title">Spud</span><span id="logo-title">Wiki</span></div></a></div><div id="search-cont">Search not yet implemented :]</div></div>';
  //s += HTML_TEMPLATES.header;

  s += '<div id="section-middle">';
  s += NAVIGATOR_SIDEBAR;

  s += '<div class="content">';
  if (page.center_title) {
    s += `<div class="article-title-centered" id="article-title">${page.title}</div>`;
  } else {
    s += `<div id="article-title">${page.title}</div>`;
  }
  s += `<div id="article-content">${page.content}`;

  if (page.special_page_handler) {
    s += page.special_page_handler(page);
  }

  s += "</div>"

  if (page.notes_html?.length) {
    s += '<div class="article-secttitle">Notes:</div>' + page.notes_html;
  }
  s += '</div>';

  s+='<div id="right-sidebar"></div>'

  s += '</div><div id="footer">';

  // FOOTER

  s += '<div id="footer-info">Content on this website is licensed under <a target="_blank" rel="noopener noreferrer" href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a> unless otherwise noted.<br>This website is not associated with PearlescentMoon, Hermitcraft or Twitch.</div>';

  // contributors

  if (page.contributors.length) {
    s += '<div id="footer-contributors">The content of this page is licensed under <a target="_blank" rel="noopener noreferrer" href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a> and it was written by ';

    const c = page.contributors, l = c.length;
    for (let i = 0; i < l; i++) {
      if (l - i >= 3) {
        s += GetContributorHtml(c[i]) + ", ";
      } else if (l - i === 2) {
        s += GetContributorHtml(c[i]) + " and ";
      } else {
        s += GetContributorHtml(c[i]) + ".";
      }
    }


    s += '</div>';
  }

  // footer, body, html end
  return s + "</div></body></html>";
}


function CreateNavigatorSidebar(is_dev) {
  let s = '<div id="side-nav">';
  
if (is_dev) {
  a+='<a href="/spud-wiki/test.html">TEST</a>';
}

  a+='<a href="/spud-wiki/">Main Page</a><a href="/spud-wiki/credits.html">Credits</a><div class="div-sep"></div>';
  const l = ALL_ARTICLES.length;
  for (let i = 0; i < l; i++) {
    const article = ALL_ARTICLES[i];

    s += `<a href="/spud-wiki/${article.name_no_ext}.html">${article.page.title}</a>`;


  }

  return s + "</div>";
}

async function Build(is_dev) {
  Object.assign(CONTRIBUTORS, ReadJsonFile("./src/contributors.json"));

  //await LoadAllHtmlTemplates();

  if (!existsSync("./build")) {
    mkdirSync("./build");
  }

  cpSync("./assets", "./build/assets", { recursive: true });
  copyFileSync("./src/style.css", "./build/style.css");



  {
    const l = ALL_ARTICLES.length;
    for (let i = 0; i < l; i++) {
      const article = ALL_ARTICLES[i];
        console.log(article.fpath) // -----------------
      article.page = WikiPage.ParseFromFile(article.fpath);
    }

    NAVIGATOR_SIDEBAR = CreateNavigatorSidebar(is_dev);

    for (let i = 0; i < l; i++) {
      const article = ALL_ARTICLES[i];
      writeFileSync(article.dpath, CreateHtmlFileString(article.page), { encoding: "utf8", flush: true });
    }

  }




  writeFileSync("./build/index.html", CreateHtmlFileString(WikiPage.ParseFromFile("./docs/main.txt")), { encoding: "utf8", flush: true });
  writeFileSync("./build/credits.html", CreateHtmlFileString(WikiPage.ParseFromFile("./docs/credits.txt", function (page) {
    let s = "";

    for (const c in CONTRIBUTORS) {
      s += `<p style="text-align:center;">${GetContributorHtml(c)}</p>`;
    }

    return s;
  })), { encoding: "utf8", flush: true });

  if (is_dev) {
  writeFileSync("./build/test.html", CreateHtmlFileString(WikiPage.ParseFromFile("./docs/test.txt")), { encoding: "utf8", flush: true });

  }
}



switch (process.argv[2]) {
  case "build": Build(false); break;
  case "build:dev": Build(true); break;
  case "clean": {
    if (existsSync("./build")) {
      rm("./build", { recursive: true }, function () { });
    }
    break;
  }
  default:
    console.error("Unknown command.");
    break;
}
