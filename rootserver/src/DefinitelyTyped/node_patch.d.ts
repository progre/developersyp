/// <reference path='../DefinitelyTyped/node/node.d.ts'/>

interface ReadableStream2 extends ReadableStream {
    read(size?: number): NodeBuffer;
}
