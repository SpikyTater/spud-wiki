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

import CONTRIBUTORS from "./contributors.js";

class MediaAsset {
  /**
   * @type {string}
   */
  name;

  contributors = [];

  /**
   * @type {string}
   */
  description;

  /**
   * @type {string}
   */
  src_path;

  /**
   * @type {string}
   */
  dst_path;

  /**
   * @param {string} name 
   * @param {any | any[]} contributors 
   * @param {string} description 
   * @param {string | undefined} src_path 
   * @param {string | undefined} dst_path 
   */
  constructor(name, contributors, description, src_path, dst_path) {
    this.name = name;
    this.contributors = Array.isArray(contributors) ? contributors : [contributors];
    this.description = description;
    this.src_path = src_path || `./src/media/${name}`;
    this.dst_path = dst_path || `media/${name}`;
  }

  GetBuildPath() {
    return `./build/${this.dst_path}`;
  }

  GetLink() {
    return `/spud-wiki/${this.dst_path}`;
  }
}
const MEDIA_ASSETS = {
  "favicon.ico": new MediaAsset("favicon.ico", CONTRIBUTORS.matty5957, "Website icon.", null, "favicon.ico"),
  "logo.png": new MediaAsset("logo.png", CONTRIBUTORS.matty5957, "Website logo."),
};



function ValidateMediaAssets() {
  let errored = false
  const build_path_map = {};
  for (const media_asset_name in MEDIA_ASSETS) {
    const media_asset = MEDIA_ASSETS[media_asset_name];
    if (media_asset_name !== media_asset.name) {
      console.error(`MEDIA_ASSETS key '${media_asset_name}' does not equal the name of its asset.`);
      errored ||= true;
    }

    if (Object.hasOwn(build_path_map, media_asset.dst_path)) {
      console.error(`Media asset with key '${media_asset_name}' would be copied to the same path as another asset.`);
      errored ||= true;
    }
  }
  return errored;
}

export { MEDIA_ASSETS, ValidateMediaAssets };