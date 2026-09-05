"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OUTPUT_EXTENSIONS = exports.OUTPUT_FORMAT = void 0;
/**
 * Only a few of the [possible formats](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/rest-text-to-speech#audio-outputs) are accepted.
 */
var OUTPUT_FORMAT;
(function (OUTPUT_FORMAT) {
    OUTPUT_FORMAT["AUDIO_24KHZ_48KBITRATE_MONO_MP3"] = "audio-24khz-48kbitrate-mono-mp3";
    OUTPUT_FORMAT["AUDIO_24KHZ_96KBITRATE_MONO_MP3"] = "audio-24khz-96kbitrate-mono-mp3";
    OUTPUT_FORMAT["WEBM_24KHZ_16BIT_MONO_OPUS"] = "webm-24khz-16bit-mono-opus";
})(OUTPUT_FORMAT || (exports.OUTPUT_FORMAT = OUTPUT_FORMAT = {}));
exports.OUTPUT_EXTENSIONS = {
    [OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3]: "mp3",
    [OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3]: "mp3",
    [OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS]: "webm",
};
