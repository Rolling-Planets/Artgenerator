"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const fs = require("fs");
const sha1 = require(path.join(basePath, "/node_modules/sha1"));
const { createCanvas, loadImage, Image } = require(path.join(
  basePath,
  "/node_modules/canvas"
));
const buildDir = path.join(basePath, "/build");
const layersDir = path.join(basePath, "/layers");
console.log(path.join(basePath, "/src/config.js"));
const {
  format,
  baseUri,
  description,

  // quarterNr, -> this is fro config, but not necessary, as we can write coordinates here directly


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
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
} = require(path.join(basePath, "/src/config.js"));

const { generateMedia } = require(path.join(basePath, "src/generator/v1.js"));;

const { count } = require("console");
const { encode } = require("punycode");

const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");


var metadataList = [];
var attributesList = [];
var dnaList = [];

const buildSetup = () => {
  if (fs.existsSync(buildDir)) {
    fs.rmdirSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir);
  fs.mkdirSync(path.join(buildDir, "/json"));
  fs.mkdirSync(path.join(buildDir, "/images"));
};

const getRarityWeight = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = Number(
    nameWithoutExtension.split(rarityDelimiter).pop()
  );
  if (isNaN(nameWithoutWeight)) {
    nameWithoutWeight = 0;
  }
  return nameWithoutWeight;
};

const cleanName = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

const getElements = (path) => {
  return fs
    .readdirSync(path)
    .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((i, index) => {
      return {
        id: index,
        name: cleanName(i),
        filename: i,
        path: `${path}${i}`,
        weight: getRarityWeight(i),
      };
    });
};

// I tried bringing this function here, Initially I had this one and x,y coordinates in config
const randomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
};

const getPosition = (name) => {
  let pos = { x: 64, y: 64 };
  if (name === "Background") {
    pos = { x: 0, y: 0 }
  }
  if (name === "Nebulae") {
    pos = { x: randomNumber(4, 15), y: randomNumber(4, 15) };
  }

  if (name === "Starfields") {
    pos = { x: randomNumber(72, 78), y: randomNumber(4, 15) };
  }

  if (name === "Comets") {
    pos = { x: randomNumber(72, 78), y: randomNumber(72, 78) };
  }

  if (name === "Planet") {
    pos = { x: 40, y: 40 };
  }

  if (name === "Moon") {
    pos = { x: randomNumber(4, 15), y: randomNumber(72, 78) };
  }

  if (name === "Rings") {
    pos = { x: 32, y: 32 };
  }
  return pos;
};

const layersSetup = (layersOrder) => {
  const layers = layersOrder.map((layerObj, index) => ({
    id: index,
    name: layerObj.name,
    elements: getElements(`${layersDir}/${layerObj.name}/`),

    position: getPosition(layerObj.name),
    // size: { width: format.width, height: format.height } -> please leave this coented out, because it will resize everything to 128x128 and it's messy

    blendMode:
      layerObj["blend"] != undefined ? layerObj["blend"] : "source-over",
    opacity: layerObj["opacity"] != undefined ? layerObj["opacity"] : 1,

  }));
  return layers;
};


const addMetadata = (_dna, _edition, _attributesList, isGif = false) => {
  let dateTime = Date.now();
  let tempMetadata = {

    //Added metadata for solana
    name: collectionName + " " + `#${_edition}`,
    symbol: symbol,

    description: description,

    //Added metadata for solana
    seller_fee_basis_points: seller_fee_basis_points,

    image: isGif ? `${baseUri}image.gif` : `${baseUri}image.png`,

    //Added metadata for solana
    external_url: external_url,

    edition: _edition,
    ...extraMetadata,
    attributes: _attributesList,
    collection: collection,
    properties: properties,
  };
  metadataList.push(tempMetadata);
};


const isDnaUnique = (_DnaList = [], _dna = []) => {
  let foundDna = _DnaList.find((i) => i.join("") === _dna.join(""));
  return foundDna == undefined ? true : false;
};

const createDna = (_layers) => {
  let randNum = [];
  _layers.forEach((layer) => {
    var totalWeight = 0;
    layer.elements.forEach((element) => {
      totalWeight += element.weight;
    });
    // number between 0 - totalWeight
    let random = Math.floor(Math.random() * totalWeight);
    for (var i = 0; i < layer.elements.length; i++) {
      // subtract the current weight from the random weight until we reach a sub zero value.
      random -= layer.elements[i].weight;
      if (random < 0) {
        return randNum.push(
          `${layer.elements[i].id}:${layer.elements[i].filename}`
        );
      }
    }
  });
  return randNum;
};

const writeMetaData = (_data) => {
  fs.writeFileSync(`${buildDir}/json/_metadata.json`, _data);
};

const saveMetaDataSingleFile = (_editionCount) => {
  let metadata = metadataList.find((meta) => meta.edition == _editionCount);
  debugLogs
    ? console.log(
      `Writing metadata for ${_editionCount}: ${JSON.stringify(metadata)}`
    )
    : null;
  fs.writeFileSync(
    `${buildDir}/json/${_editionCount}.json`,
    JSON.stringify(metadata, null, 2)
  );
};

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

//let i = 1 changed to i = 0 because on solana the files have to start from 0 and go up
const startCreating = async () => {
  let layerConfigIndex = 0;
  let editionCount = 0;
  let failedCount = 0;
  let abstractedIndexes = [];
  for (
    let i = 0;
    i <= layerConfigurations[layerConfigurations.length - 1].growEditionSizeTo;
    i++
  ) {
    abstractedIndexes.push(i);
  }
  if (shuffleLayerConfigurations) {
    abstractedIndexes = shuffle(abstractedIndexes);
  }
  debugLogs
    ? console.log("Editions left to create: ", abstractedIndexes)
    : null;
  while (layerConfigIndex < layerConfigurations.length) {
    const layers = layersSetup(
      layerConfigurations[layerConfigIndex].layersOrder
    );
    while (
      editionCount <= layerConfigurations[layerConfigIndex].growEditionSizeTo
    ) {
      let newDna = createDna(layers);
      if (isDnaUnique(dnaList, newDna)) {

        let resp = await generateMedia(newDna, abstractedIndexes, layers);
        let isGif = resp.isGif;
        let attributeList = resp.attributeList;

        addMetadata(newDna, abstractedIndexes[0], attributeList, isGif);
        saveMetaDataSingleFile(abstractedIndexes[0]);
        console.log(
          `Created edition: ${abstractedIndexes[0]}, with DNA: ${sha1(
            newDna.join("")
          )}`
        );
        dnaList.push(newDna);
        editionCount++;
        abstractedIndexes.shift();
      } else {
        console.log("DNA exists!");
        failedCount++;
        if (failedCount >= uniqueDnaTorrance) {
          console.log(
            `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`
          );
          process.exit();
        }
      }
    }
    layerConfigIndex++;
  }
  writeMetaData(JSON.stringify(metadataList, null, 2));
};

module.exports = { startCreating, buildSetup, getElements };
