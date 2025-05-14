
import { api } from "~/trpc/server";

export async function saleStock () {
  const user = await api.post.hello({text: "from REST API saleStock"});
  return new Response(JSON.stringify(user), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}