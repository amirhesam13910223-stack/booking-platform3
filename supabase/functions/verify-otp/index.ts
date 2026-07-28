import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

/**
 * verify-otp Edge Function (v2 - fixed)
 * ─────────────────────────────────────────────────────────
 * کد OTP را بررسی و در صورت صحت، session صادر می‌کند.
 *
 * قابلیت‌ها:
 * - بررسی صحت کد ۵ رقمی
 * - بررسی انقضا (۲ دقیقه)
 * - حداکثر ۳ تلاش → قفل ۵ دقیقه‌ای
 * - ساخت کاربر جدید در Supabase Auth (در صورت عدم وجود)
 * - ساخت profile + referral_code برای کاربر جدید
 * - صدور session معتبر (access_token + refresh_token) از طریق REST API
 * - پردازش referral code با بررسی تقلب
 *
 * Secrets مورد نیاز:
 * - SUPABASE_URL (خودکار)
 * - SUPABASE_SERVICE_ROLE_KEY (خودکار)
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 5;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, message: "فقط POST مجاز است" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const phoneNumber: string = body.phone_number?.trim() ?? "";
    const code: string = body.code?.trim() ?? "";
    const referralCode: string | null = body.referral_code || null;

    // ─── اعتبارسنجی ورودی‌ها ──────────────────────────
    if (!phoneNumber || !code) {
      return jsonResponse({
        success: false,
        message: "شماره موبایل و کد تأیید الزامی است",
      }, 400);
    }

    if (code.length !== 5 || !/^\d{5}$/.test(code)) {
      return jsonResponse({
        success: false,
        error_code: "INVALID_CODE",
        message: "کد تأیید باید ۵ رقم باشد",
      }, 400);
    }

    // ─── دریافت آخرین کد فعال ─────────────────────────
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("phone_number", phoneNumber)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return jsonResponse({
        success: false,
        error_code: "NO_OTP",
        message: "کدی برای این شماره یافت نشد. لطفاً کد جدید درخواست دهید.",
      }, 404);
    }

    // ─── بررسی قفل بودن ───────────────────────────────
    if (otpRecord.attempt_count >= MAX_ATTEMPTS) {
      const lockExpiry = new Date(
        new Date(otpRecord.created_at).getTime() + LOCKOUT_MINUTES * 60 * 1000
      );
      if (new Date() < lockExpiry) {
        return jsonResponse({
          success: false,
          error_code: "LOCKED",
          message: `شماره قفل شده است. ${LOCKOUT_MINUTES} دقیقه صبر کنید.`,
        }, 429);
      }
      await supabase
        .from("otp_codes")
        .update({ attempt_count: 0 })
        .eq("id", otpRecord.id);
    }

    // ─── بررسی انقضا ──────────────────────────────────
    if (new Date() > new Date(otpRecord.expires_at)) {
      await supabase.from("otp_codes").delete().eq("id", otpRecord.id);
      return jsonResponse({
        success: false,
        error_code: "EXPIRED",
        message: "کد تأیید منقضی شده است. کد جدید درخواست دهید.",
      }, 410);
    }

    // ─── بررسی صحت کد ────────────────────────────────
    if (otpRecord.code !== code) {
      const newAttempts = otpRecord.attempt_count + 1;
      await supabase
        .from("otp_codes")
        .update({ attempt_count: newAttempts })
        .eq("id", otpRecord.id);

      if (newAttempts >= MAX_ATTEMPTS) {
        return jsonResponse({
          success: false,
          error_code: "LOCKED",
          message: `تعداد تلاش‌ها بیش از حد مجاز. شماره به مدت ${LOCKOUT_MINUTES} دقیقه قفل شد.`,
        }, 429);
      }

      return jsonResponse({
        success: false,
        error_code: "INVALID_CODE",
        message: `کد اشتباه است. ${MAX_ATTEMPTS - newAttempts} تلاش باقی‌مانده.`,
      }, 401);
    }

    // ─── کد صحیح است! ─────────────────────────────────
    await supabase.from("otp_codes").delete().eq("id", otpRecord.id);

    // ─── صدور Session از طریق Supabase Auth REST API ────────
    // این روش مستقیم و امن برای phone OTP است
    const verifyResponse = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: "POST",
      headers: {
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "sms",
        token: code,
        phone: phoneNumber,
      }),
    });

    if (!verifyResponse.ok) {
      const errText = await verifyResponse.text();
      console.error("Auth verify failed:", verifyResponse.status, errText);
      return jsonResponse({
        success: false,
        message: "خطا در صدور session. لطفاً دوباره تلاش کنید.",
      }, 500);
    }

    const sessionData = await verifyResponse.json();
    const userId = sessionData.user?.id;

    if (!userId) {
      return jsonResponse({
        success: false,
        message: "خطا در دریافت اطلاعات کاربر.",
      }, 500);
    }

    // ─── بررسی وجود Profile ─────────────────────────────
    // service_role RLS را دور می‌زند، پس این query امن است
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, onboarding_completed")
      .eq("id", userId)
      .maybeSingle();

    let isNewUser = false;

    if (!existingProfile) {
      isNewUser = true;
      const referralUserCode = generateReferralCode();

      // بررسی referred_by از طریق تابع امن (RLS bypass نمی‌شود چون از anon key استفاده می‌کنیم)
      // در واقع service_role داریم پس RLS bypass می‌شود - مستقیم query می‌زنیم
      let referredBy: string | null = null;
      if (referralCode) {
        const { data: referrer } = await supabase
          .from("profiles")
          .select("id, referral_code")
          .eq("referral_code", referralCode)
          .maybeSingle();
        if (referrer) {
          referredBy = referralCode;
        }
      }

      const clientIp =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

      // Device fingerprint (SHA-256 hash of user-agent + IP)
      const userAgent = req.headers.get("user-agent") ?? "";
      const fingerprint = await simpleHash(userAgent + (clientIp || ""));

      // ساخت Profile
      // fn_init_new_user trigger خودکار credits و free subscription را می‌سازد
      const { error: insertError } = await supabase.from("profiles").insert({
        id: userId,
        phone_number: phoneNumber,
        referral_code: referralUserCode,
        referred_by: referredBy,
        signup_ip: clientIp,
        signup_device_fingerprint: fingerprint,
        onboarding_completed: false,
      });

      if (insertError) {
        console.error("Profile insert error:", insertError);
      }

      // پردازش Referral
      if (referredBy) {
        await processReferral(supabase, referredBy, userId, clientIp);
      }
    }

    // ─── پاسخ موفق ────────────────────────────────────
    return jsonResponse({
      success: true,
      message: "ورود موفقیت‌آمیز",
      is_new_user: isNewUser,
      user_id: userId,
      session: {
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
        expires_at: sessionData.expires_at,
        token_type: sessionData.token_type || "bearer",
      },
    });
  } catch (error) {
    console.error("verify-otp error:", error);
    return jsonResponse({
      success: false,
      message: "خطای داخلی سرور",
    }, 500);
  }
});

// ─── پردازش Referral ────────────────────────────────────
async function processReferral(
  supabase: ReturnType<typeof createClient>,
  referralCode: string,
  newUserId: string,
  newSignupIp: string | null
) {
  try {
    const { data: referrer } = await supabase
      .from("profiles")
      .select("id, referral_code, signup_ip")
      .eq("referral_code", referralCode)
      .maybeSingle();

    if (!referrer) return;

    // بررسی تقلب: IP یکسان
    const isSuspicious = !!(newSignupIp && referrer.signup_ip && newSignupIp === referrer.signup_ip);

    await supabase.from("referrals").insert({
      referrer_id: referrer.id,
      referred_id: newUserId,
      status: isSuspicious ? "pending" : "verified",
    });

    if (isSuspicious) {
      console.log(`[FRAUD-FLAG] Same IP referral: ${referrer.id} → ${newUserId}`);
      return;
    }

    // ۵۰ اعتبار برای referrer
    await supabase.from("credit_transactions").insert({
      user_id: referrer.id,
      amount: 50,
      reason: "referral_bonus",
    });

    // ۲۰ اعتبار برای کاربر جدید
    await supabase.from("credit_transactions").insert({
      user_id: newUserId,
      amount: 20,
      reason: "referred_bonus",
    });

    await supabase.from("notifications").insert([
      {
        user_id: referrer.id,
        type: "referral_reward",
        title: "دعوت موفق! 🎉",
        body: "دوست شما عضو شد و ۵۰ اعتبار رایگان دریافت کردید.",
        is_read: false,
      },
      {
        user_id: newUserId,
        type: "system",
        title: "هدیه خوش‌آمدگویی 🎁",
        body: "۲۰ اعتبار رایگان به حساب شما اضافه شد.",
        is_read: false,
      },
    ]);

    // ۵ دعوت = Pro رایگان
    const { count } = await supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", referrer.id)
      .eq("status", "verified");

    if (count && count % 5 === 0) {
      const { data: proPlan } = await supabase
        .from("plans")
        .select("id")
        .eq("name", "pro")
        .maybeSingle();

      if (proPlan) {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("subscriptions").insert({
          user_id: referrer.id,
          plan_id: proPlan.id,
          status: "active",
          started_at: new Date().toISOString(),
          expires_at: expiresAt,
          auto_renew: false,
        });

        await supabase.from("notifications").insert({
          user_id: referrer.id,
          type: "referral_reward",
          title: "تبریک! 🏆",
          body: `با ${count.toLocaleString("fa-IR")} دعوت موفق، یک هفته پلن حرفه‌ای رایگان فعال شد!`,
          is_read: false,
        });
      }
    }
  } catch (err) {
    console.error("processReferral error:", err);
  }
}

// ─── Helpers ────────────────────────────────────────────
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function simpleHash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}
