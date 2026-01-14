module.exports = {
  packagerConfig: {
    asar: true,
    icon: "resources/icons/icon"
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {},
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
  ],
};
