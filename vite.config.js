var path = require('path')

const createTildifyConfig = dir => ({
  //"office-ui-fabric-react":`./${dir}/office-ui-fabric-react`,
  //"@uifabric":`./${dir}/@uifabric`,
  "@coglite": `./${dir}/@coglite`,
  // "@coglite-ui": `./${dir}/ui`,
  // "@gears-ui":`./${dir}/app/vendors/mui`,
  // "@teams-ui":`./${dir}/app/vendors/teams`,
  // "coglite": `./${dir}/coglite`,
  // "common": `./${dir}/common`,
  // "vendors": `./${dir}/vendors`,
})

module.exports = {
  jsx: 'react',
  plugins: [require('vite-plugin-react')],
  //alias: createTildifyConfig('app')
  // alias: {
  //   "@coglite/": '@coglite/'
  // },

  // alias: {
  //   "@coglite/": path.join(__dirname, "app", '@coglite/')
  // }

}
