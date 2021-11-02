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
const external_url = "https://rollingplanets.art";        // I will purchase this here at deployment: https://uk.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=rollingplantes.art

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
  frame_delay: 100, // GIF frame delay
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

const extraMetadata = {
  creator: "The Big Bang",
};

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
      "__comment1__":" We will all put our Solana addressees here so we will all get 25% (we are 4) each from royalties",
          
      "address": "@Mashu0x Solana Address",
      "share": 25
    },
      {
      "address": "@Z1kos Solana Address",
      "share": 25
      },
      {
      "address": "@hotsauce Solana Address",
      "share": 25
    },
    {
      "address": "@ptisserand Solana Address",
      "share": 25
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
