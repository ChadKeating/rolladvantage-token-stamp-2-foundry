module.exports = {
  extends: ["plugin:foundry-vtt/recommended", "airbnb-base", "plugin:prettier/recommended"],
  env: {
    // allow NodeJs global variables and NodeJS scoping
    node: true,
    // allow use of ES6 globals such as Set
    es6: true
  },
  parserOptions: {
    // allow use of object rest/spread properties as well as other ES8 features
    ecmaVersion: 2018
    // allow use of Ecmascript modules
    // sourceType: "module"
  },
  rules: {
    "no-console": "off"
  }
}
