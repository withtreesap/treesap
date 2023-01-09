/**
 * 
 * @param cssString
 * @returns css string with all whitespace removed and all comments removed
 * 
 * This is just a little helper I'm working on to use css`` template literals
 * for styling. You'll get syntax highlighting on on your css if you use a vscode extension
 * and it makes it easy to inline your css.
 * 
 */
export function css(cssString: TemplateStringsArray) {
  return cssString
  .join('') // join the strings together
  .replace(/"/g, "'") // convert double quotes to single quotes
  .replace(/\s+/g, ' ') // replace all whitespace with a single space
  .replace(/\/\*.*?\*\//g, '') // remove all comments
}