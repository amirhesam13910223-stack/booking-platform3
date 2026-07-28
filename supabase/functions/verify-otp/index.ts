import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

/**
 * verify-otp Edge Function
 * ─────────────────────────────────────────────────────────
 * کد OTP را بررسی و در صورت صحت، session صادر می‌کند.
 *
 * قابلیت‌ها:
 * - بررسی صحت کد ۵ رقمی
 * - بررسی انقضا (۲ دقیقه)
 * - حداکثر ۳ تلاش → قفل ۵ دقیقه‌ای
 * - ساخت کاربر جدید در Supabase Auth (در صورت عدم وجود)
 * - ساخت profile + referral_code برای کاربر جدید
 * - صدور session (access_token + refresh_token)
 * - پردازش referral code
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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
        error_code: "INVALID_CODE",
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
    }

    // ─── بررسی انقضا ──────────────────────────────────
    if (new Date() > new Date(otpRecord.expires_at)) {
      // پاک کردن کد منقضی
      await supabase.from("otp_codes").delete().eq("id", otpRecord.id);
      return jsonResponse({
        success: false,
        error_code: "EXPIRED",
        message: "کد تأیید منقضی شده است. کد جدید درخواست دهید.",
      }, 410);
    }

    // ─── بررسی صحت کد ────────────────────────────────
    if (otpRecord.code !== code) {
      // افزایش attempt_count
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
    // پاک کردن کد استفاده‌شده
    await supabase.from("otp_codes").delete().eq("id", otpRecord.id);

    // ─── بررسی وجود کاربر در Auth ─────────────────────
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let userId: string;
    let isNewUser = false;

    const existingUser = existingUsers?.users?.find(
      (u) => u.phone === phoneNumber || u.phone === "+98" + phoneNumber.slice(1)
    );

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // ─── ساخت کاربر جدید ────────────────────────────
      isNewUser = true;
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          phone: phoneNumber,
          phone_confirm: true,
          user_metadata: {
            phone_number: phoneNumber,
            signup_method: "otp",
          },
        });

      if (createError || !newUser.user) {
        console.error("User creation error:", createError);
        return jsonResponse({
          success: false,
          message: "خطا در ساخت حساب کاربری. دوباره تلاش کنید.",
        }, 500);
      }

      userId = newUser.user.id;

      // ─── ساخت Profile ───────────────────────────────
      const referralUserCode = generateReferralCode();

      // بررسی referred_by
      let referredBy: string | null = null;
      if (referralCode) {
        const { data: referrer } = await supabase
          .from("profiles")
          .select("id, referral_code")
          .eq("referral_code", referralCode)
          .single();
        if (referrer) {
          referredBy = referralCode;
        }
      }

      const clientIp =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

      await supabase.from("profiles").insert({
        id: userId,
        phone_number: phoneNumber,
        referral_code: referralUserCode,
        referred_by: referredBy,
        signup_ip: clientIp,
        onboarding_completed: false,
      });

      // ─── ساخت credits اولیه ─────────────────────────
      await supabase.from("credits").insert({
        user_id: userId,
        balance: 0,
      });

      // ─── ساخت subscription رایگان ───────────────────
      const { data: freePlan } = await supabase
        .from("plans")
        .select("id")
        .eq("name", "free")
        .single();

      if (freePlan) {
        await supabase.from("subscriptions").insert({
          user_id: userId,
          plan_id: freePlan.id,
          status: "active",
          started_at: new Date().toISOString(),
          expires_at: null, // رایگان = بدون انقضا
          auto_renew: false,
        });
      }

      // ─── پردازش Referral ────────────────────────────
      if (referredBy) {
        await processReferral(supabase, referredBy, userId, clientIp);
      }
    }

    // ─── صدور Session ─────────────────────────────────
    const { data: sessionData, error: sessionError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        phone: phoneNumber,
      });

    // اگر generateLink کار نکرد، از روش جایگزین استفاده کن
    let session = null;
    if (!sessionError && sessionData) {
      // استخراج token از لینک
      const token = sessionData.properties?.token;
      if (token) {
        const { data: verifyData } = await supabase.auth.verifyOtp({
          phone: phoneNumber,
          token: token,
          type: "sms",
        });
        session = verifyData?.session || null;
      }
    }

    // ─── پاسخ موفق ────────────────────────────────────
    return jsonResponse({
      success: true,
      message: "ورود موفقیت‌آمیز",
      is_new_user: isNewUser,
      user_id: userId,
      session: session
        ? {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
          }
        : null,
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
    // پیدا کردن referrer
    const { data: referrer } = await supabase
      .from("profiles")
      .select("id, referral_code, signup_ip")
      .eq("referral_code", referralCode)
      .single();

    if (!referrer) return;

    // ─── بررسی تقلب: IP یکسان ────────────────────────
    const isSuspicious = newSignupIp && referrer.signup_ip === newSignupIp;

    // ساخت رکورد referral
    await supabase.from("referrals").insert({
      referrer_id: referrer.id,
      referred_id: newUserId,
      status: isSuspicious ? "pending" : "verified",
    });

    if (isSuspicious) {
      // پرچم‌گذاری برای بررسی مدیر
      console.log(`[FRAUD-FLAG] Same IP referral: ${referrer.id} → ${newUserId}`);
      return; // اعتبار اعطا نمی‌شود تا بررسی دستی
    }

    // ─── اعطای اعتبار ─────────────────────────────────
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

    // ─── اعلان‌ها ─────────────────────────────────────
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

    // ─── بررسی ۵ دعوت = Pro رایگان ────────────────────
    const { count } = await supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", referrer.id)
      .eq("status", "verified");

    if (count && count % 5 === 0) {
      // فعال‌سازی یک هفته Pro رایگان
      const { data: proPlan } = await supabase
        .from("plans")
        .select("id")
        .eq("name", "pro")
        .single();

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

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}
