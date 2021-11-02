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
const gifFrames = require("gif-frames");
const GIFEncoder = require("gif-encoder-2");

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

const cleanDna = (_str) => {
  var dna = Number(_str.split(":").shift());
  return dna;
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

const saveImage = (_editionCount) => {
  fs.writeFileSync(
    `${buildDir}/images/${_editionCount}.png`,
    canvas.toBuffer("image/png")
  );
};

const genColor = () => {
  let hue = Math.floor(Math.random() * 360);
  let pastel = `hsl(${hue}, 100%, ${background.brightness})`;
  return pastel;
};

const drawBackground = () => {
  ctx.fillStyle = genColor();
  ctx.fillRect(0, 0, format.width, format.height);
};

const addMetadata = (_dna, _edition, isGif = false) => {
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
    attributes: attributesList,
    collection: collection,
    properties: properties,
  };
  metadataList.push(tempMetadata);
  attributesList = [];
};

const addAttributes = (_element) => {
  let selectedElement = _element.layer.selectedElement;
  attributesList.push({
    trait_type: _element.layer.name,
    value: selectedElement.name,
  });
};

function stream2buffer(stream) {

  return new Promise((resolve, reject) => {

    const _buf = [];

    stream.on("data", (chunk) => _buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", (err) => reject(err));

  });
}

const loadLayerFrame = async (_layer, idx) => {
  return new Promise(async (resolve) => {
    let _filename = `${_layer.selectedElement.path}`
    if (!isGif(_filename)) {
      const image = await loadImage(`${_layer.selectedElement.path}`);
      resolve({ layer: _layer, loadedImage: image });
    } else {
      idx = idx % _layer.nbFrames;
      let frameData = await gifFrames({ url: _filename, frames: idx, outputType: 'png' });
      let _stream = frameData[0].getImage();
      const image = new Image;
      image.src = await stream2buffer(_stream);
      resolve({ layer: _layer, loadedImage: image });
    }
  });
};

const loadLayerImg = async (_layer) => {
  return new Promise(async (resolve) => {
    const image = await loadImage(`${_layer.selectedElement.path}`);
    resolve({ layer: _layer, loadedImage: image });
  });
};

const drawElement = (_renderObject) => {
  ctx.globalAlpha = _renderObject.layer.opacity;
  ctx.globalCompositeOperation = _renderObject.layer.blendMode;
  ctx.drawImage(_renderObject.loadedImage, _renderObject.layer.position.x, _renderObject.layer.position.y);

  addAttributes(_renderObject);
};

const isGif = (_filename) => {
  let extension = _filename.replace(/^.*\./, "");
  return extension === "gif";
}

const getNumberOfFrames = async (_filename) => {
  if (!isGif(_filename)) {
    return 1;
  }
  // we have a gif so we need to count number of frames
  let results = await gifFrames({ url: _filename, frames: 'all' });
  return results.length;
}

const constructLayerToDna = async (_dna = [], _layers = []) => {
  let mappedDnaToLayers = _layers.map(async (layer, index) => {
    let selectedElement = layer.elements.find(
      (e) => e.id == cleanDna(_dna[index])
    );
    let nbFrames = await getNumberOfFrames(selectedElement.path);
    return {
      name: layer.name,
      blendMode: layer.blendMode,
      opacity: layer.opacity,
      selectedElement: selectedElement,
      position: layer.position,
      nbFrames: nbFrames,
    };
  });
  return mappedDnaToLayers;
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
        const encoder = new GIFEncoder(format.width, format.height);
        encoder.setDelay(format.frame_delay);

        let results = await constructLayerToDna(newDna, layers);
        let frames = [];
        const res = await Promise.all(results);

        // compute max number of frames
        let maxNbFrames = 0;
        res.forEach((layer) => {
          if (layer.nbFrames > maxNbFrames) {
            maxNbFrames = layer.nbFrames;
          }
        });
        debugLogs ? console.log("Max number of Frames: ", maxNbFrames) : null;
        if (maxNbFrames > 1) {
          encoder.start();
        }

        for (let idx = 0; idx < maxNbFrames; idx++) {
          let loadedElements = [];
          res.forEach((layer) => {
            loadedElements.push(loadLayerFrame(layer, idx));
          });

          const renderObjectArray = await Promise.all(loadedElements).catch((err) => { console.log("Error"); throw (err); });
          debugLogs ? console.log("Clearing casvas") : null;

          ctx.clearRect(0, 0, format.width, format.height);
          if (background.generate) {
            drawBackground();
          }

          renderObjectArray.forEach((renderObject) => {
            drawElement(renderObject);
          });

          debugLogs
            ? console.log("Editions left to create: ", abstractedIndexes)
            : null;
          if (maxNbFrames !== 1) {
            encoder.addFrame(ctx);
          }
        };


        if (maxNbFrames == 1) {
          console.log("Save image");
          saveImage(abstractedIndexes[0]);
        } else {
          encoder.finish();
          const buffer = encoder.out.getData();
          let gif_name = `${buildDir}/images/${abstractedIndexes[0]}.gif`;
          fs.writeFile(gif_name, buffer, error => {
            if (error !== null) {
              console.log("Failed to write:", error);
            }
          });
        }
        let isGif = maxNbFrames !== 1;
        addMetadata(newDna, abstractedIndexes[0], isGif);
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
