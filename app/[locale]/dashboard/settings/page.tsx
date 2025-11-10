"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  User,
  Shield,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Upload,
} from "lucide-react";
import { COUNTRIES, NATIONALITIES } from "@/lib/countries";

type TabType = "profile" | "security" | "kyc";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    nationality: "",
    timezone: "UTC",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [kycDocuments, setKycDocuments] = useState<{
    passport?: File;
    proofOfAddress?: File;
    wealthStatement?: File;
  }>({});

  const [kycStatus, setKycStatus] = useState<string>("PENDING");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      router.push("/admin/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setProfileData({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            city: data.city || "",
            country: data.country || "",
            nationality: data.nationality || "",
            timezone: data.timezone || "UTC",
          });
          setKycStatus(data.kycStatus || "PENDING");
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    if (session?.user?.role === "CUSTOMER") {
      fetchUserData();
    }
  }, [session]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
      } else {
        setMessage({ type: "error", text: "Failed to update profile" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const data = await response.json();
        setMessage({ type: "error", text: data.error || "Failed to change password" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (type: "passport" | "proofOfAddress" | "wealthStatement", file: File | undefined) => {
    setKycDocuments((prev) => ({
      ...prev,
      [type]: file,
    }));
  };

  const handleKycUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      if (kycDocuments.passport) formData.append("passport", kycDocuments.passport);
      if (kycDocuments.proofOfAddress) formData.append("proofOfAddress", kycDocuments.proofOfAddress);
      if (kycDocuments.wealthStatement) formData.append("wealthStatement", kycDocuments.wealthStatement);

      const response = await fetch("/api/user/kyc", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setMessage({ type: "success", text: "KYC documents uploaded successfully!" });
        setKycDocuments({});
      } else {
        setMessage({ type: "error", text: "Failed to upload documents" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-text-primary text-xl">{tCommon("loading")}</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-text-primary mb-2">
            {t("title")}
          </h2>
          <p className="text-text-secondary">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-background-secondary border border-border rounded-xl overflow-hidden mb-6">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === "profile"
                  ? "bg-accent-gold/20 text-accent-gold border-b-2 border-accent-gold"
                  : "text-text-secondary hover:bg-background-primary"
              }`}
            >
              <User className="w-5 h-5" />
              {t("personalInfo")}
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === "security"
                  ? "bg-accent-gold/20 text-accent-gold border-b-2 border-accent-gold"
                  : "text-text-secondary hover:bg-background-primary"
              }`}
            >
              <Shield className="w-5 h-5" />
              {t("security")}
            </button>
            <button
              onClick={() => setActiveTab("kyc")}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === "kyc"
                  ? "bg-accent-gold/20 text-accent-gold border-b-2 border-accent-gold"
                  : "text-text-secondary hover:bg-background-primary"
              }`}
            >
              <FileText className="w-5 h-5" />
              {t("kyc")}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-accent-green/20 text-accent-green border border-accent-green"
                    : "bg-accent-red/20 text-accent-red border border-accent-red"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileUpdate} className="space-y-8">
                {/* Basic Information Section */}
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-4 pb-2 border-b border-border">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        First Name <span className="text-accent-red">*</span>
                      </label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) =>
                          setProfileData({ ...profileData, firstName: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Last Name <span className="text-accent-red">*</span>
                      </label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) =>
                          setProfileData({ ...profileData, lastName: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-text-secondary cursor-not-allowed"
                        title="Email cannot be changed"
                      />
                      <p className="mt-1 text-xs text-text-secondary">
                        Email address cannot be modified for security reasons
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-4 pb-2 border-b border-border">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({ ...profileData, phone: e.target.value })
                        }
                        placeholder="+1 234 567 8900"
                        className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={profileData.city}
                        onChange={(e) =>
                          setProfileData({ ...profileData, city: e.target.value })
                        }
                        placeholder="New York"
                        className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={profileData.address}
                        onChange={(e) =>
                          setProfileData({ ...profileData, address: e.target.value })
                        }
                        placeholder="123 Main Street, Apartment 4B"
                        className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Country
                      </label>
                      <select
                        value={profileData.country}
                        onChange={(e) =>
                          setProfileData({ ...profileData, country: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all cursor-pointer"
                      >
                        <option value="">Select Country</option>
                        {COUNTRIES.map((country) => (
                          <option key={country.code} value={country.name}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Nationality
                      </label>
                      <select
                        value={profileData.nationality}
                        onChange={(e) =>
                          setProfileData({ ...profileData, nationality: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all cursor-pointer"
                      >
                        <option value="">Select Nationality</option>
                        {NATIONALITIES.map((nationality) => (
                          <option key={nationality} value={nationality}>
                            {nationality}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Preferences Section */}
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-4 pb-2 border-b border-border">
                    Preferences
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Timezone
                      </label>
                      <select
                        value={profileData.timezone}
                        onChange={(e) =>
                          setProfileData({ ...profileData, timezone: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
                      >
                        <option value="UTC">UTC (GMT+0)</option>
                        <option value="America/New_York">Eastern Time (GMT-5)</option>
                        <option value="America/Chicago">Central Time (GMT-6)</option>
                        <option value="America/Denver">Mountain Time (GMT-7)</option>
                        <option value="America/Los_Angeles">Pacific Time (GMT-8)</option>
                        <option value="Europe/London">London (GMT+0)</option>
                        <option value="Europe/Paris">Paris (GMT+1)</option>
                        <option value="Europe/Berlin">Berlin (GMT+1)</option>
                        <option value="Asia/Dubai">Dubai (GMT+4)</option>
                        <option value="Asia/Hong_Kong">Hong Kong (GMT+8)</option>
                        <option value="Asia/Singapore">Singapore (GMT+8)</option>
                        <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                        <option value="Australia/Sydney">Sydney (GMT+11)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-accent-gold text-background-primary rounded-lg font-semibold hover:bg-accent-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {loading ? tCommon("loading") : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t("currentPassword")}
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t("newPassword")}
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                      required
                      minLength={8}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-accent-gold text-background-primary rounded-lg font-medium hover:bg-accent-gold/90 transition-colors disabled:opacity-50"
                >
                  {loading ? tCommon("loading") : t("changePassword")}
                </button>
              </form>
            )}

            {/* KYC Tab */}
            {activeTab === "kyc" && (
              <div className="space-y-6">
                {/* KYC Status */}
                <div className="bg-background-primary border border-border rounded-lg p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-2xl font-bold text-text-primary">
                      {t("kycStatus")}:
                    </div>
                    <div className="flex items-center gap-2">
                      {kycStatus === "APPROVED" && (
                        <>
                          <CheckCircle className="w-6 h-6 text-accent-green" />
                          <span className="px-4 py-2 bg-accent-green/20 text-accent-green rounded-lg font-medium">
                            {t("approved")}
                          </span>
                        </>
                      )}
                      {kycStatus === "PENDING" && (
                        <>
                          <Clock className="w-6 h-6 text-accent-gold" />
                          <span className="px-4 py-2 bg-accent-gold/20 text-accent-gold rounded-lg font-medium">
                            {t("underReview")}
                          </span>
                        </>
                      )}
                      {kycStatus === "REJECTED" && (
                        <>
                          <XCircle className="w-6 h-6 text-accent-red" />
                          <span className="px-4 py-2 bg-accent-red/20 text-accent-red rounded-lg font-medium">
                            {t("rejected")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-text-secondary">
                    {kycStatus === "APPROVED"
                      ? "Your identity has been verified. You have full access to all features."
                      : kycStatus === "PENDING"
                      ? "Your KYC documents are under review. This usually takes 1-2 business days."
                      : "Please upload the required documents to complete your verification."}
                  </p>
                </div>

                {/* Upload Form */}
                <form onSubmit={handleKycUpload} className="space-y-6">
                  <div className="space-y-4">
                    {/* Passport */}
                    <div className="bg-background-primary border border-border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary">
                            {t("passport")}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            Government-issued ID or Passport
                          </p>
                        </div>
                        <Upload className="w-6 h-6 text-accent-gold" />
                      </div>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) =>
                          handleFileSelect("passport", e.target.files?.[0])
                        }
                        className="w-full text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-gold/20 file:text-accent-gold hover:file:bg-accent-gold/30 file:cursor-pointer"
                      />
                      {kycDocuments.passport && (
                        <p className="mt-2 text-sm text-accent-green">
                          ✓ {kycDocuments.passport.name}
                        </p>
                      )}
                    </div>

                    {/* Proof of Address */}
                    <div className="bg-background-primary border border-border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary">
                            {t("proofOfAddress")}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            Utility bill or bank statement (less than 3 months old)
                          </p>
                        </div>
                        <Upload className="w-6 h-6 text-accent-gold" />
                      </div>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) =>
                          handleFileSelect("proofOfAddress", e.target.files?.[0])
                        }
                        className="w-full text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-gold/20 file:text-accent-gold hover:file:bg-accent-gold/30 file:cursor-pointer"
                      />
                      {kycDocuments.proofOfAddress && (
                        <p className="mt-2 text-sm text-accent-green">
                          ✓ {kycDocuments.proofOfAddress.name}
                        </p>
                      )}
                    </div>

                    {/* Wealth Statement */}
                    <div className="bg-background-primary border border-border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary">
                            {t("wealthStatement")}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            Bank statement or proof of funds ({tCommon("optional")})
                          </p>
                        </div>
                        <Upload className="w-6 h-6 text-accent-gold" />
                      </div>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) =>
                          handleFileSelect("wealthStatement", e.target.files?.[0])
                        }
                        className="w-full text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-gold/20 file:text-accent-gold hover:file:bg-accent-gold/30 file:cursor-pointer"
                      />
                      {kycDocuments.wealthStatement && (
                        <p className="mt-2 text-sm text-accent-green">
                          ✓ {kycDocuments.wealthStatement.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      (!kycDocuments.passport && !kycDocuments.proofOfAddress)
                    }
                    className="px-6 py-3 bg-accent-gold text-background-primary rounded-lg font-medium hover:bg-accent-gold/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? tCommon("loading") : t("uploadDocument")}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
