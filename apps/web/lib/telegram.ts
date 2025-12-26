import { parse } from "path";

export async function sendTelegramMessage(text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.warn('Telegram token or chat ID is not set.');
        return;
    }
    
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
     
    try { 
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: "HTML",
                disable_web_page_preview: true,
            }),
        });
    } catch (err) {
        console.error("Telegram send failed:", err);
    }
}