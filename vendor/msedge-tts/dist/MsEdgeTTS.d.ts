import { OUTPUT_FORMAT } from "./Output";
import { Readable } from "stream";
import { Agent } from "http";
import { ProsodyOptions } from "./Prosody";
export type Voice = {
    Name: string;
    ShortName: string;
    Gender: string;
    Locale: string;
    SuggestedCodec: string;
    FriendlyName: string;
    Status: string;
};
export declare class MetadataOptions {
    voiceLocale?: string;
    sentenceBoundaryEnabled?: boolean;
    wordBoundaryEnabled?: boolean;
};
type Options = {
    agent?: Agent;
    enableLogger?: boolean;
};
export declare class MsEdgeTTS {
    private static TRUSTED_CLIENT_TOKEN;
    private static VOICES_URL;
    private static WSS_URL;
    private static JSON_XML_DELIM;
    private static AUDIO_DELIM;
    private static VOICE_LANG_REGEX;
    private readonly _enableLogger;
    private readonly _isBrowser;
    private _ws;
    private _voice;
    private _outputFormat;
    private _metadataOptions;
    private _streams;
    private _startTime;
    private readonly _agent;
    private _log;
    constructor(options?: Options);
    private static getSynthUrl;
    private _initClient;
    private static generateUUID;
    private static generateSecMsGec;
    private _send;
    private _pushAudioData;
    private _pushMetadata;
    private _SSMLTemplate;
    getVoices(): Promise<Voice[]>;
    setMetadata(voiceName: string, outputFormat: OUTPUT_FORMAT, metadataOptions?: MetadataOptions): Promise<void>;
    private _metadataCheck;
    close(): void;
    toFile(dirPath: string, input: string, options?: ProsodyOptions): Promise<{
        audioFilePath: string;
        metadataFilePath: string | null;
    }>;
    toStream(input: string, options?: ProsodyOptions): {
        audioStream: Readable;
        metadataStream: Readable | null;
    };
    rawToFile(dirPath: string, requestSSML: string): Promise<{
        audioFilePath: string;
        metadataFilePath: string | null;
    }>;
    rawToStream(requestSSML: string): {
        audioStream: Readable;
        metadataStream: Readable | null;
    };
    private _hasMetadataBoundaries;
    private _rawSSMLRequestToFile;
    private static randomHex;
    private _rawSSMLRequest;
}
export {};
