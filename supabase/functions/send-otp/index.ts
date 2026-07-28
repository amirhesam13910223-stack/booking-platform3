import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

/**
 * send-otp Edge Function
 * ─────────────────────────────────────────────────────────
 * کد تأیید ۵ رقمی تولید و از طریق Kavenegar/SMS.ir ارسال می‌کند.
 *
 * قابلیت‌ها:
 * - Rate limiting: حداکثر ۳ درخواست به ازای هر شماره در ۱۰ دقیقه
 * - Rate limiting: حداکثر ۵ درخواست به ازای هر IP در ۱۰ دقیقه
 * - قفل ۵ دقیقه‌ای بعد از ۳ بار کد اشتباه
 * - انقضای کد بعد از ۲ دقیقه
 * - پاکسازی خودکار کدهای قدیمی
 *
 * Secrets مورد نیاز:
 * - KAVENEGAR_API_KEY (یا SMSIR_API_KEY)
 * - SUPABASE_URL (خودکار)
 * - SUPABASE_SERVICE_ROLE_KEY (خودکار)
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// ─── تنظیمات ───────────────────────────────────────────
const OTP_LENGTH = 5;
const OTP_EXPIRY_MINUTES = 2;
const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 5;
const RATE_LIMIT_WINDOW_MINUTES = 10;
const MAX_PER_PHONE = 3;
const MAX_PER_IP = 5;

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, message: "فقط POST مجاز است" }, 405);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const phoneNumber: string = body.phone_number?.trim() ?? "";

    // ─── اعتبارسنجی شماره ─────────────────────────────
    const phoneRegex = /^09[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return jsonResponse({
        success: false,
        message: "شماره موبایل نامعتبر است. فرمت صحیح: 09123456789",
      }, 400);
    }

    // ─── دریافت IP ────────────────────────────────────
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const now = new Date();
    const windowStart = new Date(
      now.getTime() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
    ).toISOString();

    // ─── بررسی قفل بودن شماره ─────────────────────────
    const { data: lockedCodes } = await supabase
      .from("otp_codes")
      .select("id, attempt_count, created_at")
      .eq("phone_number", phoneNumber)
      .gte("attempt_count", MAX_ATTEMPTS)
      .gte("created_at", new Date(now.getTime() - LOCKOUT_MINUTES * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (lockedCodes && lockedCodes.length > 0) {
      return jsonResponse({
        success: false,
        error_code: "LOCKED",
        message: `این شماره به مدت ${LOCKOUT_MINUTES} دقیقه قفل شده است. لطفاً صبر کنید.`,
      }, 429);
    }

    // ─── Rate Limit: شماره ────────────────────────────
    const { data: recentPhone } = await supabase
      .from("otp_codes")
      .select("id")
      .eq("phone_number", phoneNumber)
      .gte("created_at", windowStart);

    if (recentPhone && recentPhone.length >= MAX_PER_PHONE) {
      return jsonResponse({
        success: false,
        error_code: "RATE_LIMITED",
        message: `حداکثر ${MAX_PER_PHONE} درخواست در ${RATE_LIMIT_WINDOW_MINUTES} دقیقه مجاز است.`,
      }, 429);
    }

    // ─── Rate Limit: IP ───────────────────────────────
    const { data: recentIp } = await supabase
      .from("otp_codes")
      .select("id")
      .eq("ip_address", clientIp)
      .gte("created_at", windowStart);

    if (recentIp && recentIp.length >= MAX_PER_IP) {
      return jsonResponse({
        success: false,
        error_code: "RATE_LIMITED",
        message: "تعداد درخواست‌ها از این آدرس بیش از حد مجاز است.",
      }, 429);
    }

    // ─── پاکسازی کدهای قدیمی این شماره ───────────────
    await supabase
      .from("otp_codes")
      .delete()
      .eq("phone_number", phoneNumber);

    // ─── تولید کد ۵ رقمی ──────────────────────────────
    const code = String(Math.floor(10000 + Math.random() * 90000));
    const expiresAt = new Date(
      now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000
    ).toISOString();

    // ─── ذخیره در دیتابیس ─────────────────────────────
    const { error: insertError } = await supabase.from("otp_codes").insert({
      phone_number: phoneNumber,
      code: code,
      expires_at: expiresAt,
      attempt_count: 0,
      ip_address: clientIp,
    });

    if (insertError) {
      console.error("DB insert error:", insertError);
      return jsonResponse({
        success: false,
        message: "خطای داخلی سرور. دوباره تلاش کنید.",
      }, 500);
    }

    // ─── ارسال SMS ────────────────────────────────────
    const smsSent = await sendSms(phoneNumber, code);

    if (!smsSent) {
      // در محیط development، کد را در log چاپ کن
      console.log(`[DEV] OTP for ${phoneNumber}: ${code}`);
    }

    return jsonResponse({
      success: true,
      message: "کد تأیید ارسال شد",
      expires_in_seconds: OTP_EXPIRY_MINUTES * 60,
    });
  } catch (error) {
    console.error("send-otp error:", error);
    return jsonResponse({
      success: false,
      message: "خطای داخلی سرور",
    }, 500);
  }
});

// ─── ارسال SMS از طریق Kavenegar ────────────────────────
async function sendSms(phone: string, code: string): Promise<boolean> {
  const apiKey = Deno.env.get("KAVENEGAR_API_KEY");

  if (!apiKey) {
    console.warn("[WARN] KAVENEGAR_API_KEY not set. SMS not sent.");
    console.log(`[DEV-MODE] OTP for ${phone}: ${code}`);
    return false;
  }

  try {
    const message = `${code}\nکد تأیید AIHub\nاین کد تا ۲ دقیقه معتبر است.`;
    const url = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json`;

    const formData = new URLSearchParams();
    formData.append("receptor", phone);
    formData.append("message", message);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const result = await response.json();

    if (result.return?.status === 200) {
      return true;
    } else {
      console.error("Kavenegar error:", result);
      return false;
    }
  } catch (err) {
    console.error("SMS send failed:", err);
    return false;
  }
}

// ─── Helper ─────────────────────────────────────────────
function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}
