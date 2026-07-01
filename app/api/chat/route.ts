import { streamChat } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const { prompt, useWebSearch } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response("Missing prompt", { status: 400 });
    }

    const stream = await streamChat(prompt, useWebSearch ?? true);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return new Response(message, { status: 500 });
  }
}
