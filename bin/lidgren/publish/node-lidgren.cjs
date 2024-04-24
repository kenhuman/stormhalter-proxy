// Generated for: node-lidgren 1.0.0.0
// Generated by: Microsoft.JavaScript.NodeApi.Generator 0.7.0.0
/* eslint-disable */

const dotnet = undefined;
const path = require('node:path');
// @ts-ignore - https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/65252
const { dlopen, platform, arch } = require('node:process');

const moduleName = path.basename(__filename, __filename.match(/(\.[cm]?js)?$/)[0]);
module.exports = dotnet ? importDotnetModule(moduleName) : importAotModule(moduleName);

function importDotnetModule(moduleName) {
	const moduleFilePath = path.join(__dirname, moduleName + '.dll');
	return dotnet.require(moduleFilePath);
}

function importAotModule(moduleName) {
	const ridPlatform = platform === 'win32' ? 'win' : platform === 'darwin' ? 'osx' : platform;
	const ridArch = arch === 'ia32' ? 'x86' : arch;
	const rid = `${ridPlatform}-${ridArch}`;
	const moduleFilePath = path.join(__dirname, moduleName + '.node');
	const module = { exports: {} };
	dlopen(module, moduleFilePath);
	return module.exports;
}
