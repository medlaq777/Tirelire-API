export default {
  testEnvironment: "node",
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  transformIgnorePatterns: ["/node_modules/(?!(uuid)/)"],
  testMatch: ["**/src/test/**/*.test.js"],
};
