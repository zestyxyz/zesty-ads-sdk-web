const path = require('path');
const TerserWebpackPlugin = require('terser-webpack-plugin')

module.exports = {
    entry: {
        'borellion-aframe-sdk': './src/index.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        library: {
            type: 'module'
        }
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserWebpackPlugin({
            terserOptions: {
                compress: {
                    passes: 2 // Need to do 2 passes to compensate for larger mangled size
                },
                mangle: {
                    nth_identifier: {
                        get: n => {
                            // This is needed to avoid a potential var collision
                            // in the minified zesty-aframe-sdk bundle.
                            // If n is less than 26, map identifier to two alphabetic characters,
                            // i.e. 'aa', 'ab', 'ac', etc.
                            // If greater, add another while less than 52, and so on.

                            const chars = 'abcdefghijklmnopqrstuvwxyz';
                            let result = '';

                            // Calculate how many characters we need
                            // Start with minimum of 2 characters
                            const numChars = Math.max(2, Math.floor(n / 26) + 1);
                            
                            // For each position, calculate which letter it should be
                            for (let i = 0; i < numChars; i++) {
                                if (i === numChars - 1) {
                                    // Last character uses the remainder
                                    result += chars[n % 26];
                                } else {
                                    // Earlier characters cycle through alphabet
                                    result += chars[i % 26];
                                }
                            }

                            return result;
                        }
                    }
                }
            }
        })]
    },
    devServer: {
        contentBase: __dirname,
        publicPath: '/dist/',
        disableHostCheck: true // required for localtunnel to work (https://github.com/webpack/webpack-dev-server/issues/882)
    },
    experiments: {
        outputModule: true,
    }
};
