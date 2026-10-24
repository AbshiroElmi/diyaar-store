import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronLeft, FlaskConical, Loader2, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/shared/Logo";
import storeHero from "@/assets/store-hero.jpg";
import loginBgVideo from "@/assets/login-bg.mp4";
import { useLoginMedia } from "@/lib/login-media";
import { MOCK_OTP } from "@/api/mock/handlers";
import { useAuth } from "@/contexts/AuthContext";
import { isMockApi } from "@/lib/env";
import { setStatusBarTheme } from "@/lib/native";
import { useTheme } from "next-themes";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function LoginPage() {
  const { requestOtp, verifyOtp } = useAuth();
  // Custom backgrounds are switched off for now (the API will provide it); always use the built-in loop.
  const SHOW_CUSTOM_BACKGROUND = false;
  const login = useLoginMedia();
  const customBg = SHOW_CUSTOM_BACKGROUND ? login.media : null;
  const bgReady = SHOW_CUSTOM_BACKGROUND ? login.ready : true;
  const { resolvedTheme } = useTheme();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState(isMockApi ? "613187029" : "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);

  const fullPhone = `+252${phone.replace(/\D/g, "").replace(/^252/, "").replace(/^0/, "")}`;

  useEffect(() => {
    setStatusBarTheme(true);
    return () => setStatusBarTheme(resolvedTheme === "dark");
  }, [resolvedTheme]);

  useEffect(() => {
    if (!resendIn) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (step === "otp") otpRef.current?.focus();
  }, [step]);

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestOtp(fullPhone);
      setStep("otp");
      setOtp("");
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code");
    } finally {
      setLoading(false);
    }
  }

  async function verify(code = otp) {
    if (code.length !== OTP_LENGTH) return;
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(fullPhone, code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setOtp("");
      otpRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center bg-background">
      <div
        className="pt-safe relative w-full overflow-hidden min-h-[46dvh] sm:min-h-[50dvh] flex flex-col justify-between text-white"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
        }}
      >
        {/* Background: the owner's own video/photo (Settings → Login background) or the built-in loop */}
        {customBg?.kind === "image" ? (
          <img src={customBg.url} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_35%]" />
        ) : bgReady ? (
          <video
            key={customBg?.url ?? "default"}
            autoPlay
            loop
            muted
            playsInline
            poster={customBg ? undefined : storeHero}
            className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
          >
            <source src={customBg?.url ?? loginBgVideo} type={customBg ? undefined : "video/mp4"} />
          </video>
        ) : (
          <img src={storeHero} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_35%]" />
        )}

        {/* Minimal top scrim only for status bar and branding readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/20 pointer-events-none" />

        <div className="relative mx-auto flex max-w-sm flex-col items-center px-6 pt-10 text-center sm:pt-14">
          <LogoMark className="h-16 w-16 rounded-[1.25rem] shadow-2xl shadow-black/50 ring-2 ring-white/40 backdrop-blur-sm" />
          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-md">Diyaar Store</h1>
          <p className="mt-0.5 text-xs sm:text-sm font-medium text-white/90 drop-shadow-md">Your orders, menu and earnings — in your pocket</p>
        </div>

        {/* Spacer so video details are fully visible before the card */}
        <div className="h-10 sm:h-12" />
      </div>

      <Card className="relative -mt-8 w-[calc(100%-2rem)] max-w-sm rounded-3xl p-6 shadow-2xl shadow-black/15 border-0 bg-card">
        {step === "phone" ? (
          <form onSubmit={sendCode} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phone">Owner phone number</Label>
              <div className="flex rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <span className="flex items-center gap-1.5 border-r px-3 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" /> +252
                </span>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="61 234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">We'll text you a 6-digit code to sign in.</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="h-11 w-full" disabled={loading || phone.replace(/\D/g, "").length < 7}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send code </>}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verify();
            }}
            className="space-y-5"
          >
            <button type="button" onClick={() => setStep("phone")} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-1 h-4 w-4" /> Change number
            </button>
            <div className="space-y-2">
              <Label htmlFor="otp">Enter the code sent to {fullPhone}</Label>
              <Input
                id="otp"
                ref={otpRef}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={OTP_LENGTH}
                placeholder="••••••"
                value={otp}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH);
                  setOtp(v);
                  if (v.length === OTP_LENGTH) verify(v);
                }}
                className="h-12 text-center text-xl tracking-[0.5em]"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="h-11 w-full" disabled={loading || otp.length !== OTP_LENGTH}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify & sign in <ShieldCheck className="ml-2 h-4 w-4" /></>}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Didn't get it?{" "}
              {resendIn ? (
                <span>Resend in {resendIn}s</span>
              ) : (
                <button type="button" className="font-medium text-primary hover:underline" onClick={() => sendCode()}>
                  Resend code
                </button>
              )}
            </p>
          </form>
        )}
      </Card>

      {isMockApi && (
        <p className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground">
          <FlaskConical className="h-3.5 w-3.5" /> Demo mode — any phone, code <span className="font-mono font-semibold text-foreground">{MOCK_OTP}</span>
        </p>
      )}

      <p className="pb-safe mb-6 mt-auto pt-8 text-xs text-muted-foreground">© {new Date().getFullYear()} Diyaar. All rights reserved.</p>
    </div>
  );
}
