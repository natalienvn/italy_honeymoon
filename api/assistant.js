function buildSystemPrompt(tripContext) {
  return `You are a helpful, friendly trip-planning assistant. Here is the user's current itinerary:

${tripContext}

When asked to review the itinerary or find suggestions, identify concrete gaps \u2014 days with nothing planned, destinations with few or no restaurant/experience bookings, likely missing must-sees, etc. \u2014 then use web search to find real, current, well-regarded suggestions to address them. Search broadly: travel blogs, review sites, forums, and Reddit threads are all fair game, not just official tourism sites. Ground every suggestion in what you actually find; never invent options, prices, or reviews. Mention where a recommendation comes from when you reasonably can.

Keep your tone conversational and concise \u2014 short paragraphs or a simple list, not a rigid template, and not overly long. For follow-up questions, just answer naturally using the itinerary context above, searching the web again whenever it would make the answer more specific or current.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { messages, tripContext } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Provide a message" });
    return;
  }

  const cleanMessages = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content }));

  if (cleanMessages.length === 0) {
    res.status(400).json({ error: "Provide a message" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing the ANTHROPIC_API_KEY environment variable" });
    return;
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 2500,
        system: buildSystemPrompt(String(tripContext || "(no itinerary details provided)")),
        messages: cleanMessages,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
      }),
    });

    const json = await anthropicRes.json();

    if (!anthropicRes.ok) {
      const message = (json && json.error && json.error.message) || "Anthropic API error";
      res.status(anthropicRes.status).json({ error: message });
      return;
    }

    const text = (json.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!text) {
      res.status(500).json({ error: "No response \u2014 try again." });
      return;
    }

    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: "Request to Anthropic failed" });
  }
}
