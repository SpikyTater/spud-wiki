while (1) {
      // ignore whitespaces
      do {
        if (i >= l) {
          return tokens;
        }
        c = s.charCodeAt(i++);
        if (c > 32) {
          break;
        }
      } while (c <= 32);

      if (i >= l) {
        break;
      }

      switch (c) {
        case 33:                                      // !
          if (i < l && "=" === s[i]) {
            i++;
            tokens.push(OP_NE);
          } else {
            tokens.push(OP_LOG_NOT);
          }
          continue;
        case 37: tokens.push(OP_MOD); continue;       // %
        case 38: tokens.push(OP_LOG_AND); continue;   // &
        case 40: tokens.push(OPEN_P); continue;       // (
        case 41: tokens.push(CLOSE_P); continue;      // )
        case 42:                                      // *
          if (i < l && "*" === s[i]) {
            i++;
            tokens.push(OP_POW);
          } else {
            tokens.push(OP_MUL);
          }
          continue;
        case 43: tokens.push(OP_PLUS); continue;      // +
        case 45: tokens.push(OP_MINUS); continue;     // -
        case 47: tokens.push(OP_DIV); continue;       // /
        case 58: tokens.push(OP_TER_COL); continue;   // :
        case 60:                                      // <
          if (i < l && "=" === s[i]) {
            i++;
            tokens.push(OP_LTE);
          } else {
            tokens.push(OP_LT);
          }
          continue;
        case 61:                                      // =
          if (i < l && "=" === s[i]) {
            i++;
            tokens.push(OP_E);
          } else {
            throw new Error("Invalid token.", { s, i, l, c });
          }
          continue;
        case 62:                                      // >
          if (i < l && "=" === s[i]) {
            i++;
            tokens.push(OP_GTE);
          } else {
            tokens.push(OP_GT);
          }
          continue;
        case 63: tokens.push(OP_TER_QUEST); continue; // ?
        case 124: tokens.push(OP_LOG_OR); continue;   // |
      }

      const start_token_idx = i;

      while (i < l) {
        c = s.charCodeAt(i);
        if (c < 48 || (c > 57 && c < 97 && c !== 95) || c > 122) {
          break;
        }
        i++;
      }

      const token = s.slice(start_token_idx - 1, i), num = Number(token);

      if (Number.isNaN(num)) {
        if (Object.hasOwn(MAP_FN_TO_OP, token)) {
          tokens.push(MAP_FN_TO_OP[token]);
        } else {
          tokens.push([OP_LIT, token]);
        }
      } else {
        tokens.push([OP_NUM, num]);
      }
    }