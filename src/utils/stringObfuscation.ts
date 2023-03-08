// mostly used to store emails in the database

/**
 * Obfuscate a plaintext string with a simple rotation algorithm similar to the rot13 cipher.
 * @param string The string to obfuscate.
 * @param  {Number} offset rotation index between 0 and n
 * @param  {Number} n   maximum char that will be affected by the algorithm
 * @return {string}     obfuscated string
 */
export const obfuscate = (string: string, offset = 7, n = 126) => {
  let result = "";
  for (let i = 0; i < string.length; i++) {
    const char = string.charCodeAt(i);
    if (char >= 32 && char <= n) {
      result += String.fromCharCode((char - 32 + offset) % (n - 31) + 32);
    } else {
      result += string[i];
    }
  }

  return result;
};

/**
 * Deobfuscate a string obfuscated with the obfuscate function.
 * @param string The string to deobfuscate.
 * @param  {Number} offset rotation index between 0 and n
 * @param  {Number} n   maximum char that will be affected by the algorithm
 * @return {string}     deobfuscated string
 */
export const deobfuscate = (string: string, offset = 7, n = 126) => {
  let result = "";
  for (let i = 0; i < string.length; i++) {
    const char = string.charCodeAt(i);
    if (char >= 32 && char <= n) {
      result += String.fromCharCode((char - 32 - offset + (n - 31)) % (n - 31) + 32);
    } else {
      result += string[i];
    }
  }

  return result;
}
