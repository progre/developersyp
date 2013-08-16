export interface Channel {
    id: string;
    info: {
        name: string;
        url: string;
        genre: string;
        desc: string;
        bitrate: number;
        type: string;
        comment: string;
    };
    host: {
        ip: string;
        listeners: number;
        relays: number;
        direct: boolean;
        uptime: number;
    };
    track: {
        creator: string;
        album: string;
        title: string;
        url: string;
    };
}

export interface DoneChannel {
    begin: Date;
    end: Date;
    channel: Channel;
}
