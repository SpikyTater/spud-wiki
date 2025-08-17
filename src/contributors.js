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
// A big thanks to every single one of you. <3
// Uh, except me, maybe. It's a bit awkward to thank myself.


const CONTRIBUTORS_ARR = [
  {
    username: "19_meg_91",
    color: "00e700",
    twitch_username: "19_meg_91"
  },
  {
    username: "BlueStrategosJ",
    color: "359bff",
    twitch_username: "BlueStrategosJ"
  },
  {
    username: "Kawaiitron",
    color: "00e700",
    twitch_username: "Kawaiitron_"
  },
  {
    username: "Matty5957",
    color: "daa520",
    twitch_username: "Matty5957",
    assets: "logo.png"
  },
  {
    username: "Spammer92",
    color: "92ff00",
    twitch_username: "Spammer_92"
  },
  {
    username: "waarisdetaart",
    color: "daa520",
    twitch_username: "waarisdetaart"
  }
];

const CONTRIBUTORS = new Map();

function ContributorsPostProcess() {
  CONTRIBUTORS_ARR.sort((ca, cb) => {
    return ca.username.toLowerCase() < cb.username.toLowerCase();
  });

  CONTRIBUTORS_ARR.forEach(c => {
    const lc_username = c.username.toLowerCase();
    if (CONTRIBUTORS.has(lc_username)) {
      console.error(`Not on my watch, me. Contributor '${lc_username}' is duplicated.`);
      throw 0;
    }
    CONTRIBUTORS.set(lc_username, c);
  });
}

ContributorsPostProcess();

function GetContributorHtmlString(contributor) {
  return `<a target="_blank" rel="noopener noreferrer" class="tw-name" href="https://www.twitch.tv/${contributor.twitch_username}" style="color:#${contributor.color}">${contributor.username}</a>`;

}

export { CONTRIBUTORS_ARR, CONTRIBUTORS, GetContributorHtmlString };