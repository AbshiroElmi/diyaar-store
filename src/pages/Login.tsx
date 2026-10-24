import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, FlaskConical, Loader2, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/shared/Logo";
import storeHero from "@/assets/store-hero.jpg";
import loginBgVideo from "@/assets/login-bg.mp4";
import { MOCK_OTP } from "@/api/mock/handlers";
import { useAuth } from "@/contexts/AuthContext";
import { isMockApi } from "@/lib/env";
import { setStatusBarTheme } from "@/lib/native";
import { useTheme } from "next-themes";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function LoginPage() {
  const { requestOtp, verifyOtp } = useAuth();
  const { resolvedTheme } = useTheme();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState(isMockApi ? "615550107" : "");
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
      <div className="pt-safe relative w-full overflow-hidden pb-28 sm:pb-32 text-white">
        {/* Looping clear video background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={storeHero}
          className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
        >
          <source src={loginBgVideo} type="video/mp4" />
        </video>

        {/* Clear, subtle cinematic vignette so text is readable without obscuring video */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/15 to-black/45" />

        {/* Soft bottom fade into page background */}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent via-background/60 to-background dark:via-black/60 dark:to-black" />

        <div className="relative mx-auto flex max-w-sm flex-col items-center px-6 pt-12 text-center sm:pt-16">
          <LogoMark className="h-16 w-16 rounded-[1.25rem] shadow-2xl shadow-black/50 ring-2 ring-white/40 backdrop-blur-sm" />
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-md">Diyaar Store</h1>
          <p className="mt-1 text-sm font-medium text-white/90 drop-shadow-md">Your orders, menu and earnings — in your pocket</p>
        </div>
      </div>

      <Card className="relative -mt-6 sm:-mt-8 w-[calc(100%-2rem)] max-w-sm rounded-3xl p-6 shadow-xl shadow-black/10">
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send code <ArrowRight className="ml-2 h-4 w-4" /></>}
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
            <button type="button" onClick={() => setStep("phone")} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1 h-4 w-4" /> Change number
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
