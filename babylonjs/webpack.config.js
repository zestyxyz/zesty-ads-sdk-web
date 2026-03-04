const path = require('path');

module.exports = {
    entry: {
        'zesty-babylonjs-sdk': './src/index.js',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        library: {
            name: 'ZestyBanner',
            type: 'umd',
            export: 'default',
        },
        globalObject: 'this',
    },
    devServer: {
        contentBase: __dirname,
        publicPath: '/dist/',
        disableHostCheck: true // required for localtunnel to work (https://github.com/webpack/webpack-dev-server/issues/882)
    }
};
