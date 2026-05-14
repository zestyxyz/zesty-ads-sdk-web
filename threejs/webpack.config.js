const path = require('path');

module.exports = {
    entry: {
        'borellion-threejs-sdk': './src/index.js',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'module'
    },
    devServer: {
        contentBase: __dirname,
        publicPath: '/dist/',
        disableHostCheck: true // required for localtunnel to work (https://github.com/webpack/webpack-dev-server/issues/882)
    },
    externals: {
        "three": "three"
    },
    experiments: {
        outputModule: true
    }
};
