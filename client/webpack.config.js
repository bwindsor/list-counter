var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    // Set the "homepage"
    entry: "./src/index.tsx",
    
    // Output the js bundle to the dist folder
    output: {
        filename: "bundle.js",
        path: __dirname + "/dist"
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    devServer: {
        inline: true,
        open: true,
        progress: true
    },

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    },

    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            { test: /\.tsx?$/, loader: "awesome-typescript-loader" },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },

            // Any .css files are treated as css
            { test: /\.css$/, use: [ 'style-loader', 'css-loader' ] }
        ]
    },

     plugins: [
        new CopyWebpackPlugin([
            { from: './src/style.css'},
            { from: './src/index.html'},
            { from: './src/environment.js'},
            { from: './src/favicon.ico'}
        ])
     ],

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
    externals: {
        "react": "React",
        "react-dom": "ReactDOM"
    },
};