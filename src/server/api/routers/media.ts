import test from "node:test";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import mediDownloader from "~/server/lib/mediaDowloader";

export const mediaRouter = createTRPCRouter({
    getTest: publicProcedure
    .query(async() => {
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
});