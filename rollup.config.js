import terser from "@rollup/plugin-terser";
import nodeResolve from "@rollup/plugin-node-resolve";

const COPYRIGHT_COMMENT = `/*Spud Wiki Engine\nCopyright (C) ${(new Date()).getFullYear()}  SpikyTater\n\nThis program is free software; you can redistribute it and/or modify\nit under the terms of the GNU General Public License as published by\nthe Free Software Foundation; either version 2 of the License, or\n(at your option) any later version.\n\nThis program is distributed in the hope that it will be useful,\nbut WITHOUT ANY WARRANTY; without even the implied warranty of\nMERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\nGNU General Public License for more details.\n\nYou should have received a copy of the GNU General Public License along\nwith this program; if not, write to the Free Software Foundation, Inc.,\n51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.*/`;

const DEBUG_CONFIG = [
  {
    input: "./src/assets/all_pages.js",
    output: {
      file: "./build/assets/main.js",
      format: "iife",
      compact: true,
    },
    plugins: [
      nodeResolve(),
    ],
  },
  {
    input: "./src/assets/editor.js",
    output: {
      file: "./build/assets/editor.js",
      format: "iife",
      compact: true,
    },
    plugins: [
      nodeResolve(),
    ],
  },
];

const RELEASE_CONFIG = [
  {
    input: "./src/assets/all_pages.js",
    output: {
      file: "./build/assets/main.js",
      format: "iife",
      compact: true,
    },
    plugins: [
      nodeResolve(),
      terser({
        maxWorkers: 4,
        ecma: 2025,
        format: {
          ascii_only: true,
          comments: false,
          preamble: COPYRIGHT_COMMENT,
        },
        compress: {
          drop_console: ["log", "info"],
        }
      }),
    ],
    //  external: ['fs', 'path',"clean-css"]
  },
  {
    input: "./src/assets/editor.js",
    output: {
      file: "./build/assets/editor.js",
      format: "iife",
      compact: true,
    },
    plugins: [
      nodeResolve(),
      terser({
        maxWorkers: 4,
        ecma: 2025,
        format: {
          ascii_only: true,
          comments: false,
          preamble: COPYRIGHT_COMMENT,
        },
        compress: {
          drop_console: ["log", "info"],
        }
      }),
    ],
    //  external: ['fs', 'path',"clean-css"]
  },
];

export default cmd_line_args => {
  if (true === cmd_line_args.config_debug) {
    return DEBUG_CONFIG;
  }
  return RELEASE_CONFIG;
};