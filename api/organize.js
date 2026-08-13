function buildSystemPrompt(columnLabels) {
  const labels = Array.isArray(columnLabels) && columnLabels.length ? columnLabels : ["Hotel", "Restaurants", "Experiences", "Sights", "Travel"];
  const labelList = labels.map((t) => `"${t}"`).join(", ");
  return `You help sort a traveler's rough, freeform notes about a single day of a trip into that day's existing spreadsheet columns.

This day currently has these columns: ${labelList}.

Read the notes and decide which single column each activity or item belongs in, from that exact list. If something genuinely doesn't fit any of them, put it under a column called "Notes" instead (even though "Notes" isn't one of the given columns).

For each column that ends up with content, write it as one or more short lines of text, one per activity. Start a line with a time if one is stated or clearly implied, formatted like "9:00 AM \u2014 activity description". If no time applies, just write the activity description on its own line.

Respond with ONLY a JSON object (no markdown fences, no commentary) in this exact shape:
{
  "cells": [
    { "title": "<one of the exact column names given, or \\"Notes\\">", "text": "<one or more lines of text>" }
  ]
}

Only include columns that end up with content. Do not invent activities that weren't mentioned or reasonably implied by the notes.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { notes, columnLabels } = req.body || {};
  if (!notes || typeof notes !== "string" || !notes.trim()) {
    res.status(400).json({ error: "Missing notes" });
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
        max_tokens: 1500,
        system: buildSystemPrompt(columnLabels),
        messages: [{ role: "user", content: notes }],
      }),
    });

    const json = await anthropicRes.json();

    if (!anthropicRes.ok) {
      const message = (json && json.error && json.error.message) || "Anthropic API error";
      res.status(anthropicRes.status).json({ error: message });
      return;
    }

    const rawText = (json.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    let parsed;
    try {
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      res.status(500).json({ error: "Couldn't understand the result. Try again, or add a bit more detail to your notes." });
      return;
    }

    const cells = Array.isArray(parsed.cells) ? parsed.cells : [];
    res.status(200).json({ cells });
  } catch (err) {
    res.status(500).json({ error: "Request to Anthropic failed" });
  }
}
