// api/track.js - Vercel serverless function
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Configuration - Replace with your actual values
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // Your bot token
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // Your chat ID

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("Missing Telegram configuration");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const data = req.body;

    // Format the message
    const message = `
🎯 *New Click Tracked*

📍 *Location Info:*
• IP: \`${data.ip || "Unknown"}\`
• City: ${data.city || "Unknown"}
• Region: ${data.region || "Unknown"}
• Country: ${data.country || "Unknown"}
• Timezone: ${data.timezone || "Unknown"}

🌐 *Technical Info:*
• ISP: ${data.isp || "Unknown"}
• Coordinates: ${data.latitude || "N/A"}, ${data.longitude || "N/A"}
• User Agent: \`${
      data.userAgent ? data.userAgent.substring(0, 100) + "..." : "Unknown"
    }\`

⏰ *Timestamp:* ${data.timestamp || new Date().toISOString()}
        `;

    // Send to Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json();
      console.error("Telegram API error:", errorData);
      throw new Error("Failed to send to Telegram");
    }

    // Return success
    res.status(200).json({
      success: true,
      message: "Data sent successfully",
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      error: "Failed to process request",
    });
  }
}
