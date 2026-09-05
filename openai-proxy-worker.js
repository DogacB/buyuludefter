// Bu worker HİÇBİR ŞEYİ SAKLAMAZ. Sadece isteği olduğu gibi OpenAI'a iletir,
// cevabı olduğu gibi geri döndürür ve CORS header'larını ekler.
// Amaç: OpenAI'ın tarayıcıdan direkt erişime izin vermemesini (CORS) aşmak.

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== "POST") {
      return new Response("Sadece POST kabul edilir", { status: 405, headers: corsHeaders() });
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization header eksik" }), {
        status: 400,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }

    try {
      const body = await request.text();
      const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
        body,
      });

      const data = await upstream.text();
      return new Response(data, {
        status: upstream.status,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }
  },
};
