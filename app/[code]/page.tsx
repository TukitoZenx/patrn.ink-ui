"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { BrandMark } from "@/components/ui/BrandMark";
import {
  verifyLinkPassword,
  verifyAge,
  getLinkPreviewByCode,
  type LinkPreview,
} from "@/lib/api";
import { toast } from "sonner";

export default function PublicRedirectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [state, setState] = useState<
    "loading" | "password" | "age" | "redirecting" | "error"
  >("loading");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ageRequired, setAgeRequired] = useState("");
  const [ageLevel, setAgeLevel] = useState(0);
  const [passwordAfterAge, setPasswordAfterAge] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [preview, setPreview] = useState<LinkPreview | null>(null);

  useEffect(() => {
    // Try to access the link and determine what gate is needed
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    fetch(`${apiUrl}/${code}`, { redirect: "manual", credentials: "include" })
      .then(async (res) => {
        if (res.status === 0 || res.type === "opaqueredirect") {
          // Direct redirect — shouldn't normally hit this page
          window.location.href = `${apiUrl}/${code}`;
          return;
        }
        const data = await res.json();
        if (data.age_required) {
          setAgeRequired(data.age_required);
          setAgeLevel(data.age_level);
          setPasswordAfterAge(Boolean(data.password_required));
          setState("age");
        } else if (data.password_required) {
          setPasswordAfterAge(false);
          setState("password");
        } else if (data.error) {
          setErrorMsg(data.error);
          setState("error");
        }
      })
      .catch(() => {
        setErrorMsg("Failed to load link information");
        setState("error");
      });

    // Try to get preview
    getLinkPreviewByCode(code)
      .then(setPreview)
      .catch(() => {});
  }, [code]);

  const handlePasswordSubmit = async () => {
    if (!password) {
      toast.error("Enter a password");
      return;
    }
    setSubmitting(true);
    try {
      const res = await verifyLinkPassword(code, password);
      if (res.age_required) {
        setAgeRequired(res.age_required);
        setAgeLevel(res.age_level || 0);
        setPasswordAfterAge(true);
        setState("age");
        return;
      }
      if (!res.redirect_url) {
        toast.error(res.error || "Unable to continue");
        return;
      }
      setState("redirecting");
      window.location.href = res.redirect_url;
    } catch (err: unknown) {
      toast.error((err as Error).message || "Invalid password");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAgeConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await verifyAge(code, true, ageLevel);
      if (res.password_required) {
        setPassword("");
        setState("password");
        return;
      }
      if (!res.redirect_url) {
        toast.error(res.error || "Verification failed");
        return;
      }
      setState("redirecting");
      window.location.href = res.redirect_url;
    } catch (err: unknown) {
      toast.error((err as Error).message || "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <BrandMark size={36} priority />
          <span className="text-lg font-bold text-[var(--color-text)]">
            patrn.ink
          </span>
        </div>

        {state === "loading" && (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[var(--color-text-secondary)] mt-3">
              Loading...
            </p>
          </div>
        )}

        {state === "password" && (
          <Card padding="lg">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-warning-light)] flex items-center justify-center mx-auto mb-3">
                <Lock size={24} className="text-[var(--color-warning)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text)]">
                Password Protected
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                This link requires a password to access
              </p>
            </div>
            {preview && (
              <div className="p-3 rounded-xl bg-[var(--color-bg-alt)] mb-4 text-sm">
                <p className="font-medium text-[var(--color-text)]">
                  {preview.title || preview.domain}
                </p>
                {preview.description && (
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1 line-clamp-2">
                    {preview.description}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                icon={<Lock size={16} />}
              />
              <Button
                onClick={handlePasswordSubmit}
                loading={submitting}
                className="w-full"
              >
                Unlock & Continue
              </Button>
            </div>
          </Card>
        )}

        {state === "age" && (
          <Card padding="lg">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-error-light)] flex items-center justify-center mx-auto mb-3">
                <ShieldCheck size={24} className="text-[var(--color-error)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text)]">
                Age Verification Required
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                You must be {ageRequired} or older to view this content
                {passwordAfterAge ? ". You will enter the password next." : ""}
              </p>
            </div>
            {preview && (
              <div className="p-3 rounded-xl bg-[var(--color-bg-alt)] mb-4 text-sm">
                <p className="font-medium text-[var(--color-text)]">
                  {preview.title || preview.domain}
                </p>
              </div>
            )}
            <div className="space-y-3">
              <Button
                onClick={handleAgeConfirm}
                loading={submitting}
                className="w-full"
              >
                I confirm I am {ageRequired} or older
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </Card>
        )}

        {state === "redirecting" && (
          <div className="text-center">
            <ExternalLink
              size={32}
              className="text-[var(--color-primary)] mx-auto mb-3 animate-pulse"
            />
            <p className="text-sm text-[var(--color-text-secondary)]">
              Redirecting...
            </p>
          </div>
        )}

        {state === "error" && (
          <Card padding="lg" className="text-center">
            <AlertTriangle
              size={32}
              className="text-[var(--color-error)] mx-auto mb-3"
            />
            <h2 className="text-lg font-bold text-[var(--color-text)]">
              Link Unavailable
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {errorMsg}
            </p>
            <Button
              variant="ghost"
              onClick={() => (window.location.href = "/")}
              className="mt-4"
            >
              Go Home
            </Button>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
