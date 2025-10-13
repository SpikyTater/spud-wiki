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
// A big thanks to every single one of you. <3

class Contributor {
  /**
   * @type {string}
   */
  username;

  /**
   * @type {string}
   */
  color;

  /**
   * @type {string}
   */
  twitch_username;

  /**
   * @type {string}
   */
  twitch_link;

  /**
   * @type {string}
   */
  title;

  /**
   * @param {string} username 
   * @param {string} color 
   * @param {string | undefined} twitch_username 
   * @param {string | undefined} title 
   */
  constructor(username, color, twitch_username, title) {
    this.username = username;
    this.color = color;
    this.twitch_username = twitch_username || username;
    this.twitch_link = `https://www.twitch.tv/${this.twitch_username.toLowerCase()}`;
    this.title = title ? ", " + title : undefined;
  }

  /**
   * @param {string} forced_color 
   * @param {boolean} for_contribs_page 
   * @returns {string}
   */
  GetHtmlString(forced_color, for_contribs_page) {
    return `<a target="_blank" rel="noopener noreferrer" class="tw-name" href="${this.twitch_link}" style="color:#${forced_color || this.color}">${this.username}${(for_contribs_page && this.title) ? this.title : ""}</a>`;
  }

}

const CONTRIBUTORS = {
  "19_meg_91": new Contributor("19_meg_91", "00e700"),
  bluestrategosj: new Contributor("BlueStrategosJ", "359bff", null, "Loremaster"),
  celticjax: new Contributor("CelticJax", "ff571a", null, "Cletgjft , Cetlic, Master of Baiting"),
  frozencascade: new Contributor("FrozenCascade", "a0ffff"),
  kat999xx: new Contributor("kat999xx", "5f9ea0"),
  kawaiitron: new Contributor("Kawaiitron", "00e700", "Kawaiitron_"),
  matty5957: new Contributor("Matty5957", "daa520", null, "resident gluon"),
  runwiththerain: new Contributor("runwiththerain", "359bff"),
  spammer92: new Contributor("Spammer92", "92ff00", "Spammer_92"),
  stormyboi06: new Contributor("stormyboi06", "ff0000"),
  thehornbill: new Contributor("theHornbill", "9acd32"),
  ven_lillu: new Contributor("Ven_lillu", "ff7f50"),
  waarisdetaart: new Contributor("waarisdetaart", "daa520", null, "Master Typist, Clipper of Clips"),
};

export default CONTRIBUTORS;

export function ValidateContributors() {
  let errored = false;
  for (const lc_username in CONTRIBUTORS) {
    const contributor = CONTRIBUTORS[lc_username];
    if (lc_username !== contributor.username.toLowerCase()) {
      console.error(`CONTRIBUTORS key '${lc_username}' does not equal their lowercase username.`)
      errored ||= true;
    }
  }
  return errored;
}

/**
 * @param {string} s 
 * @returns {Contributor | undefined}
 */
export function ContributorFromString(s) {
  s = s.toLowerCase();
  for (const lc_username in CONTRIBUTORS) {
    const contributor = CONTRIBUTORS[lc_username];
    if (s === lc_username || s === contributor.twitch_username.toLowerCase()) {
      return contributor;
    }
  }
  return;
}