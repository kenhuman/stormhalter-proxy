// Type definitions for memoryjs
// Project: https://github.com/Rob--/memoryjs
// Definitions by: Seth Stephens <https://github.com/FNCxPro>

/// <reference types="node" />

declare module 'memoryjs' {
    export type DataType =
        | 'int'
        | 'dword'
        | 'short'
        | 'long'
        | 'float'
        | 'double'
        | 'bool'
        | 'boolean'
        | 'ptr'
        | 'pointer'
        | 'str'
        | 'string'
        | 'vec3'
        | 'vector3'
        | 'vec4'
        | 'vector4';
    type SignatureType = 0x0 | 0x1 | 0x2;
    export interface Process {
        dwSize: number;
        th32ProcessID: number;
        cntThreads: number;
        th32ParentProcessID: number;
        pcPriClassBase: number;
        szExeFile: string;
        modBaseAddr: number;
        handle: number;
    }

    export interface Module {
        modBaseAddr: number;
        modBaseSize: number;
        szExePath: string;
        szModule: string;
        th32ProcessID: number;
    }
    interface Callback<T> {
        (error: string, result: T): any;
    }
    interface MemoryJS {
        INT: 'int';
        DWORD: 'dword';
        SHORT: 'short';
        LONG: 'long';
        FLOAT: 'float';
        DOUBLE: 'double';
        BOOL: 'bool';
        BOOLEAN: 'boolean';
        PTR: 'ptr';
        POINTER: 'pointer';
        STR: 'str';
        STRING: 'string';
        VEC3: 'vec3';
        VECTOR3: 'vector3';
        VEC4: 'vec4';
        VECTOR4: 'vector4';

        /**
         * Denotes a normal signature
         */
        NORMAL: 0x0;

        /**
         * Reads memory at the address
         */
        READ: 0x1;

        /**
         * Subtracts the image base from the address
         */
        SUBTRACT: 0x2;

        /**
         * opens a process to be able to read from and write to it
         * @param processIdentifier the identifier of the process to open, can either be a name ('csgo.exe') or an id (3270)
         */
        openProcess(processIdentifier: string | number): Process;
        /**
         * opens a process to be able to read from and write to it
         * @param processIdentifier the identifier of the process to open, can either be a name ('csgo.exe') or an id (3270)
         */
        openProcess(
            processIdentifier: string | number,
            callback: Callback<Process>,
        ): void;

        /**
         * closes the handle on the opened process
         * @param handle the handle of the process to close
         */
        closeProcess(handle: number): void;

        /**
         * collects information about all the running processes
         */
        getProcesses(): Array<Process>;
        /**
         * collects information about all the running processes
         */
        getProcesses(callback: Callback<Array<Process>>): void;

        /**
         * finds a module associated with a given process
         * @param moduleName the name of the module to find
         * @param processId the id of the process in which to find the module
         */
        findModule(moduleName: string, processId: number): Module;
        /**
         * finds a module associated with a given process
         * @param moduleName the name of the module to find
         * @param processId the id of the process in which to find the module
         */
        findModule(
            moduleName: string,
            processId: number,
            callback: Callback<Module>,
        ): void;

        /**
         * gets all modules associated with a given process
         * @param processId the id of the process in which to find the module
         */
        getModules(processId: number): Array<Module>;
        /**
         * gets all modules associated with a given process
         * @param processId the id of the process in which to find the module
         */
        getModules(processId: number, callback: Callback<Array<Module>>): void;

        /**
         * reads the memory at a given address
         * @param handle the handle of the process, given to you by the process object retrieved when opening the process
         * @param address the address in memory to read from
         * @param dataType the data type to read into
         */
        readMemory(handle: number, address: number, dataType: DataType): any;
        /**
         * reads the memory at a given address
         * @param handle the handle of the process, given to you by the process object retrieved when opening the process
         * @param address the address in memory to read from
         * @param dataType the data type to read into
         */
        readMemory(
            handle: number,
            address: number,
            dataType: DataType,
            callback: Callback<any>,
        ): void;

        /**
         * reads size bytes of memory at the given address
         * @param handle the handle of the process, given to you by the process object retrieved when opening the process
         * @param address the address in memory to read from
         * @param size the number of bytes to read into the buffer
         */
        readBuffer(handle: number, address: number, size: number): Buffer;
        /**
         * reads size bytes of memory at the given address
         * @param handle the handle of the process, given to you by the process object retrieved when opening the process
         * @param address the address in memory to read from
         * @param size the number of bytes to read into the buffer
         */
        readBuffer(
            handle: number,
            address: number,
            size: number,
            callback: Callback<Buffer>,
        ): void;

        /**
         * writes to an address in memory
         * @param handle the handle of the process, given to you by the process object retrieved when opening the process
         * @param address the address in memory to write to
         * @param value the data type of value must be either number, string or boolean and is the value that will be written to the address in memory
         * @param dataType the data type of the value
         */
        writeMemory(
            handle: number,
            address: number,
            value: any,
            dataType: DataType,
        ): void;
        /**
         * writes to an address in memory
         * @param handle the handle of the process, given to you by the process object retrieved when opening the process
         * @param address the address in memory to write to
         * @param value the data type of value must be either number, string or boolean and is the value that will be written to the address in memory
         * @param dataType the data type of the value
         */
        writeMemory(
            handle: number,
            address: number,
            value: any,
            dataType: DataType,
            callback: Callback<void>,
        ): void;

        /**
         * writes size bytes of memory to the given address
         * @param handle the handle of the process, given to you by the process object retrieved when opening the process
         * @param address the address in memory to write to
         * @param buffer the buffer to write to memory
         */
        writeBuffer(handle: number, address: number, buffer: Buffer): void;

        /**
         * pattern scans memory to find an offset
         * @param handle the handle of the process, given to you by the process object retrieved when opening the process
         * @param moduleName the name of the module to pattern scan (module.szModule)
         * @param signature the actual signature mask (in the form `A9 ? ? ? A3 ?`)
         * @param signatureType flags for signature types (definitions can be found at the top of this section)
         * @param patternOffset offset will be added to the address (before reading, if memoryjs.READ is raised)
         * @param addressOffset offset will be added to the address returned
         */
        findPattern(
            handle: number,
            moduleName: string,
            signature: string,
            signatureType: SignatureType,
            patternOffset: number,
            addressOffset: number,
        ): number;
        /**
         * pattern scans memory to find an offset
         * @param handle the handle of the process, given to you by the process object retrieved when opening the process
         * @param moduleName the name of the module to pattern scan (module.szModule)
         * @param signature the actual signature mask (in the form `A9 ? ? ? A3 ?`)
         * @param signatureType flags for signature types (definitions can be found at the top of this section)
         * @param patternOffset offset will be added to the address (before reading, if memoryjs.READ is raised)
         * @param addressOffset offset will be added to the address returned
         */
        findPattern(
            handle: number,
            moduleName: string,
            signature: string,
            signatureType: SignatureType,
            patternOffset: number,
            addressOffset: number,
            callback: Callback<number>,
        ): void;

        /**
         * sets the protection of the memory address
         * @param handle the handle of the process, given to you by the process object retrieved when opening the process
         * @param address the address in memory to write to
         * @param size number of bytes at the address to change the protection of.
         * @param protection the protection type to set this if a bit flag
         */
        virtualProtectEx(
            handle: number,
            address: number,
            size: number,
            protection: number,
        ): number;
    }
    var memory: MemoryJS;
    export = memory;
}
