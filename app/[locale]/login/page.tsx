"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        setError(tErrors("loginFailed"));
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setError(tErrors("serverError"));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-background-secondary border border-border rounded-xl p-8 shadow-xl">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gradient-gold mb-2">
              {tCommon("appName")}
            </h1>
            <p className="text-text-secondary">{tCommon("tagline")}</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                {t("email")}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
                placeholder="investor@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                {t("password")}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-500 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-accent-gold to-accent-goldAlt text-white font-semibold rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 focus:ring-offset-background-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? tCommon("loading") : t("signIn")}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 text-center space-y-3">
            <Link
              href="/forgot-password"
              className="text-sm text-accent-gold hover:text-accent-goldAlt transition-colors"
            >
              {t("forgotPassword")}
            </Link>

            <div className="text-text-secondary text-sm">
              {t("noAccount")}{" "}
              <Link
                href="/register"
                className="text-accent-gold hover:text-accent-goldAlt transition-colors font-medium"
              >
                {t("signUp")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
