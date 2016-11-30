'use babel';

import fs from 'fs';
import JSZip from 'jszip';
import { writeBinaryData } from './control-file'
import { mkDir } from './utility'
import path from 'path';

export function readZip(filePath, writePath) {
  let promise = new Promise( (resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if(err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
  return promise.then(unzip(writePath));
}

function unzip(writePath) {
  return (data) => {
    return JSZip.loadAsync(data).then((zip) => {
      let promises = [];
      let fileNames = Object.keys(zip.files)
      for(let fileName of fileNames) {
        promises.push(zip.files[fileName].async('arraybuffer'));
      }
      return Promise.all(promises).then(checkDir(fileNames, writePath));
    });
  }
}
function checkDir(fileNames, writePath) {
  return (datas) => {
    return mkDir(path.join(writePath + fileNames[0])).then(write(fileNames, datas, writePath));
  };
}

function write(fileNames, datas, writePath) {
  return () => {
    let promises = [];
    for(let i = 1; i < fileNames.length; ++i) {
      promises.push(writeBinaryData(path.join(writePath + fileNames[i]), datas[i]));
    }
    atom.notifications.addInfo('Extract done.',
      {detail: `Number of files: ${fileNames.length}`, dismissable: false});
    return Promise.all(promises);
  }
}
