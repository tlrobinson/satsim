module.exports = {
  transform: {
    "\\.[jt]s$": ["babel-jest", { configFile: "./babel.jest.config.js" }],
  },
};
