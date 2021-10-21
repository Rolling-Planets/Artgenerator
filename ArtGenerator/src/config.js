"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const { MODE } = require(path.join(basePath, "src/blendMode.js"));
const description =
  "Rolling planets is full of well...planets that are on a roll. We aim to support the next generation of engineers and scientists as well as give back to our holders.";
const baseUri = "";

//Added metadata for solana
const collectionName = "Rolling Planet";
const symbol = "ROLP";              //we can still discuss this

//Define how much % you want from second market sales 1000 = 10%
const seller_fee_basis_points = 500;            // this is 5%, we can still discuss this
const external_url = "https://rollingplantes.art";        // I will purchase this here at deployment: https://uk.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=rollingplantes.art

const layerConfigurations = [
  {
    growEditionSizeTo: 9, //on Solana, count starts fro 0, so for 10,000 you input 9999
    layersOrder: [
      { name: "Background" },
      { name: "Nebulae" },
      { name: "Starfields" },
      { name: "Comets" },
      { name: "Planet" },
      { name: "Moon" },
      { name: "Rings" },
    ],
  },
];

const shuffleLayerConfigurations = false;

const debugLogs = false;

// const randomNumber = (min, max) =>  {
//   return Math.floor(Math.random() * (max - min) + min);
//     };

const format = {
  width: 128,
  height: 128,
};

// const quarterNr = {
//   c1: {x: randomNumber(4,15), y: randomNumber(4,15)}, 
//   c2: {x: randomNumber(72,78), y:randomNumber(4,15)},
//   c3: {x:  randomNumber(72,78), y:randomNumber(72,78)},
//   c4: {x: randomNumber(4,15), y:randomNumber(72,78)},
//   };

const background = {
  generate: false,
  brightness: "0%",
};

const extraMetadata = {};

const rarityDelimiter = "#";

const uniqueDnaTorrance = 10000;

const preview = {
  thumbPerRow: 5,
  thumbWidth: 50,
  imageRatio: format.width / format.height,
  imageName: "planet.png",
};

// This is a optinal feature you can use to define if your NFT is a part of a collection
const collection = {
  name: "Rolling Planets",
  family: "Space Wonders"
};


//Added metadata for solana
//Leave uri and type at the current way because they are placeholders for arweave
const properties = {
  files: [
      {
        "uri": "image.png",
        "type": "image/png"
      },
    ],
  category: "png",
  creators: [
    {
      "address": "Your Solana Address", // create wallet address
      "share": 100
    }
  ]
};

module.exports = {
  format,
  baseUri,
  description,

  //Added metadata for solana
  collectionName,
  symbol,
  seller_fee_basis_points,
  external_url,
  collection, 
  properties, 

  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  preview,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  // quarterNr,

   
};
