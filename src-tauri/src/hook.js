// JUST FOR LEARNING PURPOSES, DON'T USE THIS TO CRACK SOFTWARE

const crypto = require("crypto");
const pubdec = crypto["publicDecrypt"];
delete crypto["publicDecrypt"];
let fingerprint, email, uuid, license, computerInfo = "";
let License = ""
crypto.publicDecrypt = function (key, buffer) {
    log("PubDec Key:" + key);
    log("buf: " + buffer.toString('base64'));
    if (buffer.slice(0, 26).compare(Buffer.from("CRACKED_BY_DIAMOND_HUNTERS")) == 0) {
        License = buffer.toString('base64');
        let ret = buffer.toString().replace("CRACKED_BY_DIAMOND_HUNTERS", "");
        log("backdoor data,return : " + ret);
        return Buffer.from(ret);
    }
    return pubdec(key, buffer);
};

const fetch = require("electron-fetch")
fetch_bak = fetch['default'];
delete fetch['default'];
fetch.default = async function fetch(url, options) {
    log('[fetch]fetch ' + url);
    log('[fetch]Arg ' + JSON.stringify(options));
    data = await fetch_bak(url, options);
    if (url.indexOf('api/client/activate') != -1) {
        params = JSON.parse(options.body);
        fingerprint = params.f, email = params.email, uuid = params.u, license = params.license, computerInfo = params.l
        log('[activate]Fingerprint ' + fingerprint);
        log('[activate]Email ' + email);
        log('[activate]UUID ' + uuid);
        log('[activate]License ' + license);
        log('[activate]ComputerInfo ' + computerInfo);
        log('[fetch]RetCode ' + data.status);
        ret = await data.buffer();
        log('[fetch]Ret ' + ret.toString());

        ret = Buffer.from('{"code":0,"retry":true,"msg":"' + Buffer.from("CRACKED_BY_DIAMOND_HUNTERS" + JSON.stringify(
            {
                "fingerprint": fingerprint,
                "email": email,
                "license": license,
                "type": ""
            })).toString('base64') + '"}');
        log("replace ret: " + ret.toString());
        data.text = () => {
            return new Promise((resolve, reject) => {
                resolve(ret.toString());
            });
        };
        data.json = () => {
            return new Promise((resolve, reject) => {
                resolve(JSON.parse(ret.toString()));
            });
        };
    }
    if (url.indexOf('api/client/renew') != -1) {
        ret = await data.buffer();
        log('[fetch]Ret ' + ret.toString());

        ret = Buffer.from('{"success":true,"code":0,"retry":true,"msg":"' + License + '"}');
        log("replace ret: " + ret.toString());
        data.text = () => {
            return new Promise((resolve, reject) => {
                resolve(ret.toString());
            });
        };
        data.json = () => {
            return new Promise((resolve, reject) => {
                resolve(JSON.parse(ret.toString()));
            });
        };
    }
    return new Promise((resolve, reject) => {
        resolve(data);
    });

}

http = require("http")

function log(str) {
    http.get('http://127.0.0.1:3000/log?str=' + str, res => {
    }).on('error', err => {
        console.log('Error: ', err.message);
    });
}

log = console.log;
log('Hook Init')


var Module = require('module');
var originalRequire = Module.prototype.require;

Module.prototype.require = function () {
    log('Require ' + arguments[0])
    if (arguments[0] == 'crypto') {
        log('Hooking crypto');
        return crypto;
    }
    if (arguments[0] == 'electron-fetch') {
        log('Hooking electron-fetch');
        return fetch;
    }
    return originalRequire.apply(this, arguments);
};


console.log = log
let validator = {
    set: function (target, key, value) {
        if (key === 'log') {
            log('console.log override blocked');
            return;
        }
        target[key] = value;
    }
}

let proxy = new Proxy(console, validator);
console = proxy
module.exports = fetch