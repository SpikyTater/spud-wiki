import { readFile } from "fs/promises";

export default class SpudWiki {
  /**
   * @type {Promise<any>[]}
   */
  static #PAGE_PROMISES=[]
  /**
   * @param {string} file_path 
   */
  AddWikiPage(file_path) {
    readFile(file_path,)
  }

  AddSpecialPage(file_path) {

  }
}