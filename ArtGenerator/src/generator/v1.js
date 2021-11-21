"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const fs = require("fs");

const { createCanvas, loadImage, Image } = require(path.join(
    basePath,
    "/node_modules/canvas"
));
const buildDir = path.join(basePath, "/build");
const layersDir = path.join(basePath, "/layers");

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

const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");

const cleanDna = (_str) => {
    var dna = Number(_str.split(":").shift());
    return dna;
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

const addAttributes = (_element, _attributesList) => {
    let selectedElement = _element.layer.selectedElement;
    _attributesList.push({
        trait_type: _element.layer.name,
        value: selectedElement.name,
    });
};

const drawElement = (_renderObject) => {
    ctx.globalAlpha = _renderObject.layer.opacity;
    ctx.globalCompositeOperation = _renderObject.layer.blendMode;
    ctx.drawImage(_renderObject.loadedImage, _renderObject.layer.position.x, _renderObject.layer.position.y);
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

const generateMedia = async (newDna, abstractedIndexes, layers) => {
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
    let attributesList = [];
    for (let idx = 0; idx < maxNbFrames; idx++) {
        let loadedElements = [];
        attributesList = [];
        res.forEach((layer) => {
            loadedElements.push(loadLayerFrame(layer, idx));
        });

        const renderObjectArray = await Promise.all(loadedElements).catch((err) => { console.log("Error"); throw (err); });

        ctx.clearRect(0, 0, format.width, format.height);
        if (background.generate) {
            drawBackground();
        }

        renderObjectArray.forEach((renderObject) => {
            drawElement(renderObject);
            addAttributes(renderObject, attributesList);
        });

        if (maxNbFrames !== 1) {
            encoder.addFrame(ctx);
        }
    };


    if (maxNbFrames == 1) {
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

    return {
        isGif: maxNbFrames == 1,
        attributesList: attributesList
    };
}


module.exports = {
    generateMedia,
}
