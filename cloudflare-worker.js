export default {
  async email(message, env, ctx) {
    var url = "https://richmail.onrender.com/webhook/email";
    var secret = "richmail-secret-key-2026";
    var subject = message.headers.get("subject") || "No Subject";
    var from = message.from || "unknown";
    var to = message.to || "unknown";
    var date = message.headers.get("date") || new Date().toISOString();
    var raw = await new Response(message.raw).text();
    var body = raw;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": secret
      },
      body: JSON.stringify({
        from: from,
        to: to,
        subject: subject,
        text: body,
        html: "",
        date: date
      })
    });
  }
}
