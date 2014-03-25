// �g���Ă�����̂�����`���Ă��Ȃ�
declare module 'log4js' {
    export function configure(configurationFileOrObject: any, options?: any): void;
    export function getLogger(categoryName: string): Logger;

    interface Logger {
        trace(...args: any[]);
        debug(...args: any[]);
        info(...args: any[]);
        warn(...args: any[]);
        error(...args: any[]);
        fatal(...args: any[]);
    }
}
