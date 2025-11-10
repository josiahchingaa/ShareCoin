"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { COUNTRIES } from "@/lib/countries";

type AccountType = "CRYPTO" | "STOCK" | null;

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");

  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    country: "",
    accountType: null as AccountType,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAccountTypeSelect = (type: AccountType) => {
    setFormData({ ...formData, accountType: type });
    setStep(2);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.email) return tErrors("required");
    if (!formData.password) return tErrors("required");
    if (formData.password.length < 8) return tErrors("passwordTooShort");
    if (formData.password !== formData.confirmPassword)
      return tErrors("passwordMismatch");
    if (!formData.firstName || !formData.lastName) return tErrors("required");
    if (!formData.accountType) return tErrors("required");
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          country: formData.country,
          accountType: formData.accountType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || tErrors("serverError"));
        return;
      }

      // Redirect to login page after successful registration
      router.push("/login?registered=true");
    } catch (error) {
      setError(tErrors("serverError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="bg-background-secondary border border-border rounded-xl p-8 shadow-xl">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gradient-gold mb-2">
              {tCommon("appName")}
            </h1>
            <p className="text-text-secondary">{t("signUp")}</p>
          </div>

          {/* Step 1: Account Type Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-text-primary mb-6">
                {t("selectAccountType")}
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Crypto Account */}
                <button
                  onClick={() => handleAccountTypeSelect("CRYPTO")}
                  className="group p-6 bg-background-primary border-2 border-border hover:border-accent-gold rounded-xl transition-all hover:scale-105"
                >
                  <div className="text-center space-y-4">
                    <div className="text-5xl">₿</div>
                    <h3 className="text-xl font-bold text-gradient-gold">
                      {t("cryptoAccount")}
                    </h3>
                    <p className="text-text-secondary text-sm">
                      {t("cryptoDescription")}
                    </p>
                  </div>
                </button>

                {/* Stock Account */}
                <button
                  onClick={() => handleAccountTypeSelect("STOCK")}
                  className="group p-6 bg-background-primary border-2 border-border hover:border-accent-gold rounded-xl transition-all hover:scale-105"
                >
                  <div className="text-center space-y-4">
                    <div className="text-5xl">📈</div>
                    <h3 className="text-xl font-bold text-gradient-gold">
                      {t("stockAccount")}
                    </h3>
                    <p className="text-text-secondary text-sm">
                      {t("stockDescription")}
                    </p>
                  </div>
                </button>
              </div>

              <div className="text-center text-text-secondary text-sm mt-6">
                {t("hasAccount")}{" "}
                <Link
                  href="/login"
                  className="text-accent-gold hover:text-accent-goldAlt transition-colors font-medium"
                >
                  {t("signIn")}
                </Link>
              </div>
            </div>
          )}

          {/* Step 2: Registration Form */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-accent-gold hover:text-accent-goldAlt transition-colors text-sm mb-4"
                >
                  ← {tCommon("back")}
                </button>
                <div className="bg-accent-gold/10 border border-accent-gold rounded-lg p-3 text-center">
                  <span className="text-accent-gold font-medium">
                    {formData.accountType === "CRYPTO"
                      ? t("cryptoAccount")
                      : t("stockAccount")}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("firstName")}
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("lastName")}
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("email")}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold transition-all"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("phoneNumber")} ({tCommon("optional")})
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("country")} ({tCommon("optional")})
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold transition-all cursor-pointer"
                  >
                    <option value="">Select Country</option>
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("password")}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("confirmPassword")}
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold transition-all"
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
                className="w-full py-3 bg-gradient-to-r from-accent-gold to-accent-goldAlt text-white font-semibold rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent-gold transition-all disabled:opacity-50"
              >
                {loading ? tCommon("loading") : t("signUp")}
              </button>

              <div className="text-center text-text-secondary text-sm">
                {t("hasAccount")}{" "}
                <Link
                  href="/login"
                  className="text-accent-gold hover:text-accent-goldAlt transition-colors font-medium"
                >
                  {t("signIn")}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
