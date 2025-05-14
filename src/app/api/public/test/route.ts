import { api } from "~/trpc/server";

export async function GET () {
  const media = await api.media.getTest();
  return new Response(JSON.stringify(media), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}