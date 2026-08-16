import { getProvider } from "@/lib/providers";

export const runtime = "nodejs";

const SYSTEM_PROMPT =
  "You are Nexora AI, a helpful, clear, and friendly assistant. Format responses with markdown when it improves readability. If asked who made you, who created you, or who built this AI, respond that Nexora AI was made by Nakshatra Asrani and Nexora.";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const { messages, model, temperature, providerId } = body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonError("Please enter a message.", 400);
  }

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage?.content?.trim()) {
    return jsonError("Please enter a message.", 400);
  }

  if (!process.env.GROQ_API_KEY) {
    return jsonError(
      "Nexora AI isn't configured yet. Add GROQ_API_KEY to your environment.",
      500
    );
  }

  const provider = getProvider(providerId);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const chunks = provider.streamChat({
          messages: messages.map(({ role, content }) => ({ role, content })),
          model,
          temperature,
          system: SYSTEM_PROMPT,
        });

        for await (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (err) {
        console.error("Nexora AI stream error:", err);
        const message = errorMessageFor(err);
        controller.enqueue(encoder.encode(`\n\n[[NEXORA_ERROR]]${message}`));
        controller.close();
      }
    },
    cancel() {
      // client disconnected; nothing to clean up
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

function errorMessageFor(err) {
  const status = err?.status;
  if (status === 401) return "Nexora AI's API key is invalid. Check your configuration.";
  if (status === 429) return "Nexora AI is getting a lot of requests right now. Please try again in a moment.";
  if (status === 408 || err?.name === "APIConnectionTimeoutError") {
    return "That took too long to respond. Please try again.";
  }
  if (status >= 500) return "Nexora AI couldn't connect right now. Please try again.";
  return "Something went wrong. Please try again.";
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
