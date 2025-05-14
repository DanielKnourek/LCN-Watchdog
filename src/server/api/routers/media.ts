import { TRPCError } from "@trpc/server";
import test from "node:test";
import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";
import mediDownloader, { updateAllTrackedStocks } from "~/server/lib/mediaDowloader";

export const mediaRouter = createTRPCRouter({
    getTest: publicProcedure
        .query(async () => {
            return await mediDownloader();
        }
        ),
    getMediaList: publicProcedure
        .query(() => {
            return {
                test: "test",
            };
        }
        ),
    updateAll: publicProcedure
        .query(async () => {
            await updateAllTrackedStocks()
                .catch((error) => {
                    console.error("Error updating media data:", error); //TODO remove log
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to update media data",
                    })
                })
        }),
});