module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    env: {
      development: {
        plugins: ["react-native-paper/babel"],
      },
      production: {
        plugins: ["react-native-paper/babel"],
      },
    },
  };
};
