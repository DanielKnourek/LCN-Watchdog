import type { NextRequest } from "next/server";
import { api } from "~/trpc/server";

export async function GET (req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  // const user = await api.post.hello({text: "from REST API listStock"});
  const media = await api.media.getTest();
  return new Response(JSON.stringify(media), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}