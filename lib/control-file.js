'use babel';

import {shallowCopyTargetProperty, unicodeEscapeSequenceToChar, toArrayBuffer, toBuffer } from './utility';

import fs from 'fs';
import cson from 'cson';

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
    this.shift = false;
    this.ctrl = false;
    this.alt = false;
    this.name = '';
    this.fileData = null;
  }

  toString() {
    let ret = 'keyCode: ' + this.keyCode.toString(10);
    ret += ', name: ' + this.name;
    ret += ', shift: ' + String(this.shift);
    ret += ', ctrl: ' + String(this.ctrl);
    ret += ', alt: ' + String(this.alt);
    return ret;
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
export function readSource(path, dataPath) {
  return readConfigFile(path, dataPath, stringToSourceFile);
}
export function getReadSource(path, dataPath) {
  return () => {
    return readSource(path, dataPath);
  }
}

export function readIR(path, dataPath) {
  return readConfigFile(path, dataPath, stringToIR);
}
export function getReadIR(path, dataPath) {
  return () => {
    return readIR(path, dataPath);
  }
}

export function readKeyBind(path) {
  if(path === null) {
    return null;
  }
  return createReadFilePromise(path, null, stringToKeyBind);
}

//
function createReadFilePromise(path, dataPath, converter) {
  return new Promise ( (resolve, reject)=> {
    fs.readFile(path, 'utf-8', (err, data) => {
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
function readConfigFile(path, dataPath, converter) {
  if(path === null) {
    return null;
  }
  let promise = createReadFilePromise(path, dataPath, converter);
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
      || typeof keyBind.shift !== 'boolean'
      || typeof keyBind.ctrl !== 'boolean'
      || typeof keyBind.alt !== 'boolean'
    ) {
      return new Error(`${i}th data is invalid.` + keyBind.toString());
    }
    keyBinds.push(keyBind);
  }
  return keyBinds;
}

function stringToSourceFile(data, path) {
  let obj = cson.parse(unicodeEscapeSequenceToChar(data));

  if(obj instanceof Error) {
    return obj;
  }
  if(obj.hasOwnProperty("commonPath") === false || typeof obj.commonPath !== 'string'
    || obj.hasOwnProperty("sourceFiles") === false || Object.prototype.toString.call(obj.sourceFiles) !== '[object Array]') {
    return new Error(`file is invalid.`);
  }
  if(obj.commonPath === '') {
    obj.commonPath = path;
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
    sourceFile.fileName = obj.commonPath + '\\' + sourceFile.fileName
    sourceFiles.push(sourceFile);
  }
  return sourceFiles;
}

function stringToIR(data, path) {
  let obj = cson.parse(unicodeEscapeSequenceToChar(data));

  if(obj instanceof Error) {
    return obj;
  }
  if(obj.hasOwnProperty("commonPath") === false || typeof obj.commonPath !== 'string'
    || obj.hasOwnProperty("impulseResponses") === false || Object.prototype.toString.call(obj.impulseResponses) !== '[object Array]') {
    return new Error(`file is invalid.`);
  }
  if(obj.commonPath === '') {
    obj.commonPath = path;
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
    impulseResponse.fileName = obj.commonPath + '\\' + impulseResponse.fileName
    impulseResponses.push(impulseResponse);
  }
  return impulseResponses;
}

/*
export output
*/

export function writeToCson(path, obj, resolved, rejected) {
  let data = cson.createCSONString(obj, {indent: "  "});
  let promise = new Promise( (resolve, reject) => {
    fs.writeFile(path, data, (err) => {
      if(err) {
        reject(err);
        return
      }
      resolve(path);
    });
  });
  promise.then(resolved, rejected);
}

export function writeAnalysedData(path, data, resolved, rejected) {
  let writeString = '';
  for(let i = 0; i < data.length; ++i) {
    writeString += data[i].toString(10) + '\n';
  }
  let promise = new Promise( (resolve, reject) => {
    fs.writeFile(path, writeString, (err) => {
      if(err) {
        reject(err);
        return
      }
      resolve(path);
    });
  });
  promise.then(resolved, rejected);
}

export function writeBinaryData(path, data) {
  let buf = toBuffer(data);
  let promise = new Promise( (resolve, reject) => {
    fs.writeFile(path, buf, (err) => {
      if(err) {
        reject(err);
        return
      }
      resolve(path);
    });
  });
  return promise;
}
