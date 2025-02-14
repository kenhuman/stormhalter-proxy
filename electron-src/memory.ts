import memory, { DataType, Module, Process } from 'memoryjs';
const processName = 'Kesmai.Client.exe';

let kesmaiProcess: Process;
let coreclr: Module;

export const init = () => {
    kesmaiProcess = memory.openProcess(processName);
    coreclr = memory.findModule('coreclr.dll', kesmaiProcess.th32ProcessID);
};

export const getKesmaiProcess = () => kesmaiProcess;
export const getCoreClr = () => coreclr;

export const getAddress = (base: number, offsets: number[]): number => {
    let currentAddress: number | bigint = base;
    for (const offset of offsets) {
        if (typeof currentAddress === 'bigint') {
            currentAddress = Number(currentAddress);
        }
        currentAddress = memory.readMemory(
            kesmaiProcess.handle,
            currentAddress + offset,
            'pointer',
        );
    }
    return Number(currentAddress);
};

export const writeMemory = (
    base: number,
    offset: number,
    data: any,
    dataType: DataType,
): void => {
    memory.writeMemory(kesmaiProcess.handle, base + offset, data, dataType);
};

export const readMemory = (
    base: number,
    offset: number,
    dataType: DataType,
): any => {
    return memory.readMemory(kesmaiProcess.handle, base + offset, dataType);
};
