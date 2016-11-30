'use babel';

import {shallowCopyTargetProperty, unicodeEscapeSequenceToChar, toArrayBuffer, toBuffer } from './utility';

import fs from 'fs';
import cson from 'cson';
import path from 'path';

/*
class
*/

export class SourceFile {
  constructor() {
    this.name = '';
    this.fileName = '';
    this.fileData = null;
  }

  toString() {
    let ret = 'name: ' + this.name;
    ret += ', fileName: ' + this.fileName;
    return ret;
  }
}

export class KeyBind {
  constructor() {
    this.keyCode = -1;
    this.altKey = false;
    this.ctrlKey = false;
    this.shiftKey = false;
    this.name = '';
    this.fileData = null;
  }

  toString() {
    let ret = 'keyCode: ' + this.keyCode.toString(10);
    ret += ', name: ' + this.name;
    ret += ', altKey: ' + String(this.altKey);
    ret += ', ctrlKey: ' + String(this.ctrlKey);
    ret += ', shiftKey: ' + String(this.shiftKey);
    return ret;
  }

  static checkSpecialKey(obj) {
    let ret = 0;
    if(obj.altKey === true) {
      ret += 1;
    }
    if(obj.ctrlKey === true) {
      ret += 2;
    }
    if(obj.shiftKey === true) {
      ret += 4;
    }
    return ret;
  }

  static compare(a, b){
    if(a.keyCode < b.keyCode) {
      return -1;
    }
    if(a.keyCode > b.keyCode) {
      return 1;
    }
    if(KeyBind.checkSpecialKey(a) < KeyBind.checkSpecialKey(b)){
      return -1;
    }
    if(KeyBind.checkSpecialKey(a) > KeyBind.checkSpecialKey(b)){
      return 1;
    }
    return 0;
  }
}

export class ImpulseResponse {
  constructor() {
    this.description = '';
    this.fileName = '';
    this.fileData = null;
  }

  toString() {
    let ret = 'description: ' + this.description;
    ret += ', fileName: ' + this.fileName;
    return ret;
  }
}
/*
export read
*/
export function readSource(filePath, dataPath) {
  return readConfigFile(filePath, dataPath, stringToSourceFile);
}
export function getReadSource(filePath, dataPath) {
  return () => {
    return readSource(filePath, dataPath);
  }
}

export function readIR(filePath, dataPath) {
  return readConfigFile(filePath, dataPath, stringToIR);
}
export function getReadIR(filePath, dataPath) {
  return () => {
    return readIR(filePath, dataPath);
  }
}

export function readKeyBind(filePath) {
  if(filePath === null) {
    return null;
  }
  return createReadFilePromise(filePath, null, stringToKeyBind);
}

//
function createReadFilePromise(filePath, dataPath, converter) {
  return new Promise ( (resolve, reject)=> {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if(err) {
        reject([err, 0]);
        return;
      }
      let result = converter(data, dataPath);
      if(result instanceof Error) {
        reject([result, 1]);
        return;
      }
      resolve(result);
    });
  });
}

//
function readConfigFile(filePath, dataPath, converter) {
  if(filePath === null) {
    return null;
  }
  let promise = createReadFilePromise(filePath, dataPath, converter);
  return promise.then(readBinaryDatas); //返るのは、readBinaryDatasのpromise
}

function readBinaryDatas(keyBinds) {
  let promises = [];
  for(let keyBind of keyBinds) {
    promises.push(readBinaryData(keyBind));
  }
  return Promise.all(promises);
}

function readBinaryData(keyBind) {
  return new Promise( (resolve, reject) => {
    fs.readFile(keyBind.fileName, (err, data) => {
      if(err) {
        reject(err);
        return;
      }
      keyBind.fileData = toArrayBuffer(data);
      resolve(keyBind);
    });
  });
}

/*
converter
*/
function stringToKeyBind(data) {
  let obj = cson.parse(unicodeEscapeSequenceToChar(data));

  if(obj instanceof Error) {
    return obj;
  }
  if( obj.hasOwnProperty("keyBinds") === false || Object.prototype.toString.call(obj.keyBinds) !== '[object Array]') {
    return new Error(`file is invalid.`);
  }

  let keyBinds = [];

  for(let i = 0; i < obj.keyBinds.length; ++i) {
    let keyBind = new KeyBind();

    shallowCopyTargetProperty(keyBind, obj.keyBinds[i]);
    if(keyBind.name === '' || typeof keyBind.name !== 'string'
      || typeof keyBind.keyCode !== 'number'
      || typeof keyBind.shiftKey !== 'boolean'
      || typeof keyBind.ctrlKey !== 'boolean'
      || typeof keyBind.altKey !== 'boolean'
    ) {
      return new Error(`${i}th data is invalid.` + keyBind.toString());
    }
    keyBinds.push(keyBind);
  }
  return keyBinds;
}

function stringToSourceFile(data, commonPath) {
  let obj = cson.parse(unicodeEscapeSequenceToChar(data));

  if(obj instanceof Error) {
    return obj;
  }
  if(obj.hasOwnProperty("commonPath") === false || typeof obj.commonPath !== 'string'
    || obj.hasOwnProperty("sourceFiles") === false || Object.prototype.toString.call(obj.sourceFiles) !== '[object Array]') {
    return new Error(`file is invalid.`);
  }
  if(obj.commonPath === '') {
    obj.commonPath = commonPath;
  }

  let sourceFiles = [];

  for(let i = 0; i < obj.sourceFiles.length; ++i) {
    let sourceFile = new SourceFile();

    shallowCopyTargetProperty(sourceFile, obj.sourceFiles[i]);
    if(typeof sourceFile.name !== 'string'
      || sourceFile.fileName === '' || typeof sourceFile.fileName !== 'string'
    ) {
      return new Error(`${i}th data is invalid.` + sourceFile.toString());
    }
    if(sourceFile.name === '') {
      sourceFile.name = sourceFile.fileName;
    }
    sourceFile.fileName = path.join(obj.commonPath, sourceFile.fileName);
    sourceFiles.push(sourceFile);
  }
  return sourceFiles;
}

function stringToIR(data, commonPath) {
  let obj = cson.parse(unicodeEscapeSequenceToChar(data));

  if(obj instanceof Error) {
    return obj;
  }
  if(obj.hasOwnProperty("commonPath") === false || typeof obj.commonPath !== 'string'
    || obj.hasOwnProperty("impulseResponses") === false || Object.prototype.toString.call(obj.impulseResponses) !== '[object Array]') {
    return new Error(`file is invalid.`);
  }
  if(obj.commonPath === '') {
    obj.commonPath = commonPath;
  }

  let impulseResponses = [];

  for(let i = 0; i < obj.impulseResponses.length; ++i) {
    let impulseResponse = new ImpulseResponse();

    shallowCopyTargetProperty(impulseResponse, obj.impulseResponses[i]);
    if(typeof impulseResponse.description !== 'string'
      || typeof impulseResponse.fileName !== 'string'
    ) {
      return new Error(`${i}th data is invalid.` + impulseResponse.toString());
    }
    impulseResponse.fileName = path.join(obj.commonPath, impulseResponse.fileName);
    impulseResponses.push(impulseResponse);
  }
  return impulseResponses;
}

/*
export output
*/

export function writeToCson(filePath, obj, resolved, rejected) {
  let data = cson.createCSONString(obj, {indent: "  "});
  let promise = new Promise( (resolve, reject) => {
    fs.writeFile(filePath, data, (err) => {
      if(err) {
        reject(err);
        return
      }
      resolve(filePath);
    });
  });
  promise.then(resolved, rejected);
}

export function writeAnalysedData(filePath, data, resolved, rejected) {
  let writeString = '';
  for(let i = 0; i < data.length; ++i) {
    writeString += data[i].toString(10) + '\n';
  }
  let promise = new Promise( (resolve, reject) => {
    fs.writeFile(filePath, writeString, (err) => {
      if(err) {
        reject(err);
        return
      }
      resolve(filePath);
    });
  });
  promise.then(resolved, rejected);
}

export function writeBinaryData(filePath, data) {
  let buf = toBuffer(data);
  let promise = new Promise( (resolve, reject) => {
    fs.writeFile(filePath, buf, (err) => {
      if(err) {
        reject(err);
        return
      }
      resolve(filePath);
    });
  });
  return promise;
}
