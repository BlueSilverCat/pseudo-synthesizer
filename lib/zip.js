'use babel';

import fs from 'fs';
import JSZip from 'jszip';
import { writeBinaryData } from './control-file'
import { mkDir } from './utility'

export function readZip(path) {
  let promise = new Promise( (resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if(err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
  return promise.then(unzip);
}

function unzip(data) {
  return JSZip.loadAsync(data).then((zip) => {
    let promises = [];
    let fileNames = Object.keys(zip.files)
    for(let fileName of fileNames) {
      promises.push(zip.files[fileName].async('arraybuffer'));
    }
    return Promise.all(promises).then(checkDir(fileNames));
  });
}

function checkDir(fileNames) {
  return (datas) => {
    let func = write(fileNames, datas)
    return mkDir("C:/Users/BlueSilverCat/github/pseudo-synthesizer/data/" + fileNames[0]).then(func);
  };
}

function write(fileNames, datas) {
  return () => {
    let promises = [];
    for(let i = 1; i < fileNames.length; ++i) {
      promises.push(writeBinaryData("C:/Users/BlueSilverCat/github/pseudo-synthesizer/data/" + fileNames[i], datas[i]));
    }
    atom.notifications.addInfo('Extract done.',
      {detail: `Number of files: ${fileNames.length}`, dismissable: false});
    return Promise.all(promises);
  }
}
