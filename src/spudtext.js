
class SpudText {

}

class SpudTextParser {
  /**
   * 
   * @param {string} s 
   * @param {{} | undefined} options 
   * @returns {SpudText | undefined}
   */
  static ParseFromString(s, options) {
    options ||= {};

    if (typeof options !== "object") {
      console.error("Invalid 'options'.");
      return;
    }

    if (typeof s !== "string" && !(s instanceof String)) {
      console.error("Invalid 's'.");
      return;
    }

    const parser = new SpudTextParser();

    if (parser.#Tokenize(s, options)) {
      return;
    }



    return parser.result;
  }

  /**
   * @type {SpudText | undefined}
   */
  result;

  tokens = [];

  /**
   * 
   * @param {string} s 
   * @param {{}} options 
   */
  #Tokenize(s, options) {
    const { tokens } = this, l = s.length;
    let i = 0, c;

    while (1) {
      // ignore whitespaces
      do {
        if (i >= l) {
          return tokens;
        }
        c = s.charCodeAt(i++);
      } while (c <= 32);

      if (i >= l) {
        break;
      }
    }


    return false;
  }

}



export {
  SpudText,
  SpudTextParser,
};