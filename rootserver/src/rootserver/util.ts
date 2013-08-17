export function isEmpty(str: string) {
    return str == null || str.length === 0;
}

export interface SimpleMap<T> {
    [key: string]: T
}

export function padLeft(str: string, totalWidth: number, paddingChar: string) {
    var padStr = str;
    while (padStr.length < totalWidth) {
        padStr = paddingChar + padStr;
    }
    return padStr.substring(0, totalWidth);
}

export function padRight(str: string, totalWidth: number, paddingChar: string) {
    var padStr = str;
    while (padStr.length < totalWidth) {
        padStr += paddingChar;
    }
    return padStr.substring(0, totalWidth);
}

export function deleteIf<T>(array: any, filter: (item: T) => boolean) {
    array.filter(filter).forEach(del => {
        array.splice(array.indexOf(del), 1);
    });
}

export function deleteIf2<T>(array: SimpleMap<T>, filter: (item: T) => boolean) {
    for (var key in array) {
        if (filter(array[key])) {
            delete array[key];
        }
    }
}

export function forEach<T>(array: SimpleMap<T>, func: (item: T) => void ) {
    for (var key in array) {
        func(array[key]);
    }
}

export function firstOrUndefined<T>(obj: SimpleMap<T>) {
    return obj[Object.keys(obj)[0]];
}

export function emptyIfNull(str: string) {
    return str == null ? '' : str;
}

export function ifNullThen<T>(obj: T, proxy: T) {
    return obj == null ? proxy : obj;
}

export function bind<TSender, TResult>(obj: TSender, func: (sender: TSender) => TResult) {
    if (obj == null)
        return null;
    return func(obj);
}