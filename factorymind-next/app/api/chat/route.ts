import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_URL;

    if (!apiKey) {
      // Friendly warning fallback when API key is missing
      return NextResponse.json({
        choices: [
          {
            message: {
              role: "assistant",
              content: "⚠️ **Groq API Key is not set in `.env.local`**\n\nPlease add `GROQ_API_KEY=gsk_...` to your `factorymind-next/.env.local` file to connect the live AI model.\n\n### 💡 Preventive Precaution Examples:\n- **Immediate Action**: Stop the spindle override and verify coolant pressure.\n- **Vibration Peak**: Check bearing lubrication immediately to avoid structural failure.\n- **Voltage Surge**: Trip the circuit breaker and run thermal scans."
            }
          }
        ]
      });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content: "You are FactoryMind AI, a veteran Industrial Safety, Machine Diagnosis, and Preventive Maintenance engineer. Your primary directive is to provide highly actionable, detailed, step-by-step precautions and preventive measures for factory machines (such as CNC machines, assembly line conveyor belts, heat exchangers, hydraulic pumps, industrial robots, etc.) to avert catastrophic downtime, bearing wear, overheating, tool wear, and electrical faults.\n\nFormat your responses beautifully and interactively:\n- Use bold text for critical warnings.\n- Use structured sections: '🔴 IMMEDIATE ACTIONS', '🔧 PREVENTIVE MEASURES', and '⚠️ EARLY WARNING SIGNS'.\n- Use emojis and concise, professional steps.\n- Keep explanations clear and engineer-focused.",
          },
          ...messages,
        ],
        temperature: 0.5,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Groq API Error]", errText);

      let errorDetail = "Failed to communicate with Groq API";
      try {
        const errJson = JSON.parse(errText);
        errorDetail = errJson?.error?.message || errJson?.error || errorDetail;
      } catch {}

      return NextResponse.json(
        { error: errorDetail },
        { status: response.status }
      );
    }

    const json = await response.json();
    return NextResponse.json(json);
  } catch (error: any) {
    console.error("[Chat API Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
