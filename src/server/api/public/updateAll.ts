import { TRPCError } from "@trpc/server";
import type { NextRequest } from "next/server";
import { api } from "~/trpc/server";

export async function updateAll (req: NextRequest) {
  
  const media = await api.media.updateAll()
  .catch((error) => {
    if (error instanceof TRPCError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.code === "INTERNAL_SERVER_ERROR" ? 500 : 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    return new Response(JSON.stringify({ error: "Failed to update media data" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  });
  
  return new Response(JSON.stringify(media), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}