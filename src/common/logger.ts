import * as pino from "pino";

export const logger = pino({
    name: "gif-attack-api",
    prettyPrint: {
        forceColor: true,
    },
    timestamp: pino.stdTimeFunctions.isoTime
});