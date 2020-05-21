

// const createTildifyConfig = dir => ({
//   "@coglite": `./${dir}/@coglite`,
// })
var jetpack = require('fs-jetpack')
const TS_CONFIG = jetpack.read("./tsconfig.json", "json")
const BASE_URL = TS_CONFIG.compilerOptions.baseUrl || "src"

module.exports = {
  plugins: [
    ["babel-plugin-transform-react-pug"],
    ["babel-plugin-polished"],
    ["babel-plugin-macros"],
    ["babel-plugin-module-resolver", {
      root: [BASE_URL],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'],
      //alias: createTildifyConfig('src')
    }],
  ]
}
