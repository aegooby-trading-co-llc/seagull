import { $, chalk } from "zx";
import { inspect } from "node:util";

/** 
 * @typedef State @type {(() => State) | undefined}
 */

 const reservedWords = [
    "if",
    "then",
    "else",
    "elif",
    "fi",
    "case",
    "esac",
    "for",
    "select",
    "while",
    "until",
    "do",
    "done",
    "in",
];  

/**
 * 
 * @param {string | undefined} cmd 
 * @returns {string}
 */
function formatCmd(cmd) {
    if (cmd == undefined) return chalk.grey("undefined")
    const chars = [...cmd]
    let out = "$ "
    let buf = ""
    /** @type {string} */
    let ch
    /** @type {State} */
    let state = root
    let wordCount = 0
    while (state) {
      ch = chars.shift() || "EOF"
      if (ch == "\n") {
        out += style(state, buf) + "\n> "
        buf = ""
        continue
      }

      /** @type {State} */
      const next = ch == "EOF" ? undefined : state()
      if (next != state) {
        out += style(state, buf)
        buf = ""
      }
      state = next == root ? next() : next
      buf += ch
    }
    /**
     * 
     * @param {State} state 
     * @param {string} s 
     * @returns {string}
     */
    function style(state, s) {
      if (s == "") return ""
      if (reservedWords.includes(s)) {
        return chalk.cyanBright(s)
      }
      if (state == word && wordCount == 0) {
        wordCount++
        return chalk.greenBright(s)
      }
      if (state == syntax) {
        wordCount = 0
        return chalk.cyanBright(s)
      }
      if (state == dollar) return chalk.yellowBright(s)
      if (state?.name.startsWith("str")) return chalk.yellowBright(s)
      return s
    }
    /**
     * 
     * @param {string} ch 
     * @returns 
     */
    function isSyntax(ch) {
      return "()[]{}<>;:+|&=".includes(ch)
    }
    function root() {
      if (/\s/.test(ch)) return space
      if (isSyntax(ch)) return syntax
      if (/[$]/.test(ch)) return dollar
      if (/["]/.test(ch)) return strDouble
      if (/["]/.test(ch)) return strSingle
      return word
    }
    function space() {
      if (/\s/.test(ch)) return space
      return root
    }
    function word() {
      if (/[0-9a-z/_.]/i.test(ch)) return word
      return root
    }
    function syntax() {
      if (isSyntax(ch)) return syntax
      return root
    }
    function dollar() {
      if (/["]/.test(ch)) return str
      return root
    }
    function str() {
      if (/["]/.test(ch)) return strEnd
      if (/[\\]/.test(ch)) return strBackslash
      return str
    }
    function strBackslash() {
      return strEscape
    }
    function strEscape() {
      return str
    }
    function strDouble() {
      if (/["]/.test(ch)) return strEnd
      return strDouble
    }
    function strSingle() {
      if (/["]/.test(ch)) return strEnd
      return strSingle
    }
    function strEnd() {
      return root
    }
    return out + "\n"
  }
  

/**
 * 
 * @param {*} entry 
 * @returns 
 */
export function log(entry) {
    switch (entry.kind) {
        case "cmd":
            if (!entry.verbose) {
                return;
            }
            process.stdout.write(chalk.dim(formatCmd(entry.cmd)));
            break;
        case "stdout":
            if (!entry.verbose) {
                return;
            }
            process.stdout.write(chalk.reset(entry.data));
            break;
        case "stderr":
            if (!entry.verbose) {
                return;
            }
            process.stderr.write(chalk.reset(entry.data));
            break;
        case "cd":
            if (!$.verbose) {
                return;
            }
            process.stdout.write(
                chalk.dim("$ " + chalk.greenBright("cd") + ` ${entry.dir}\n`)
            );
            break;
        case "fetch":
            if (!$.verbose) {
                return;
            }
            const init = entry.init ? " " + inspect(entry.init) : "";
            process.stdout.write(
                chalk.dim("$ " + chalk.greenBright("fetch") + ` ${entry.url}${init}\n`)
            );
            break;
        case "retry":
            if (!$.verbose) {
                return;
            }
            process.stderr.write(chalk.dim(entry.error + "\n"));
    }
}