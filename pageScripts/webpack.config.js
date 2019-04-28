const path = require('path');
const webpack = require('webpack');
module.exports = {
    entry: './main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname)
    },
    mode: 'production'
};
