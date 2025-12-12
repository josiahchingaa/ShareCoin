"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ReactFlagsSelect from "react-flags-select";
import {
  User,
  Shield,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Upload,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Globe,
  Lock,
  ChevronLeft,
  ChevronRight,
  Home,
  History,
  Settings,
  Download,
  TrendingUp,
  Save,
} from "lucide-react";

type TabType = "profile" | "security" | "kyc";

// Employment status options
const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "employed", label: "Employed" },
  { value: "self_employed", label: "Self-Employed" },
  { value: "unemployed", label: "Unemployed" },
  { value: "retired", label: "Retired" },
  { value: "student", label: "Student" },
];

// Source of funds options
const SOURCE_OF_FUNDS_OPTIONS = [
  { value: "salary", label: "Salary / Employment Income" },
  { value: "self_employment", label: "Self-Employment / Business Income" },
  { value: "savings", label: "Savings" },
  { value: "investments", label: "Investments / Dividends" },
  { value: "inheritance", label: "Inheritance" },
  { value: "pension", label: "Pension / Retirement" },
  { value: "property_sale", label: "Sale of Property / Assets" },
  { value: "gifts", label: "Gifts / Family Support" },
  { value: "other", label: "Other" },
];

// Country code to name mapping for display
const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  BE: "Belgium",
  AT: "Austria",
  CH: "Switzerland",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  IE: "Ireland",
  PT: "Portugal",
  PL: "Poland",
  CZ: "Czech Republic",
  GR: "Greece",
  HU: "Hungary",
  RO: "Romania",
  BG: "Bulgaria",
  HR: "Croatia",
  SK: "Slovakia",
  SI: "Slovenia",
  LT: "Lithuania",
  LV: "Latvia",
  EE: "Estonia",
  CY: "Cyprus",
  LU: "Luxembourg",
  MT: "Malta",
  CA: "Canada",
  AU: "Australia",
  NZ: "New Zealand",
  JP: "Japan",
  KR: "South Korea",
  SG: "Singapore",
  HK: "Hong Kong",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  QA: "Qatar",
  KW: "Kuwait",
  BH: "Bahrain",
  OM: "Oman",
  IL: "Israel",
  TR: "Turkey",
  ZA: "South Africa",
  BR: "Brazil",
  MX: "Mexico",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colombia",
  IN: "India",
  TH: "Thailand",
  MY: "Malaysia",
  ID: "Indonesia",
  PH: "Philippines",
  VN: "Vietnam",
  CN: "China",
  TW: "Taiwan",
  RU: "Russia",
  UA: "Ukraine",
};

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
    dateOfBirth: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    countryCode: "",
    nationality: "",
    timezone: "UTC",
    employmentStatus: "",
    occupation: "",
    sourceOfFunds: [] as string[],
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
            dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            city: data.city || "",
            postalCode: data.postalCode || "",
            country: data.country || "",
            countryCode: data.countryCode || "",
            nationality: data.nationality || "",
            timezone: data.timezone || "UTC",
            employmentStatus: data.employmentStatus || "",
            occupation: data.occupation || "",
            sourceOfFunds: data.sourceOfFunds || [],
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

  const handleCountrySelect = (code: string) => {
    setProfileData({
      ...profileData,
      countryCode: code,
      country: COUNTRY_NAMES[code] || code,
    });
  };

  const handleNationalitySelect = (code: string) => {
    setProfileData({
      ...profileData,
      nationality: COUNTRY_NAMES[code] || code,
    });
  };

  const handleSourceOfFundsChange = (value: string) => {
    setProfileData((prev) => {
      const current = prev.sourceOfFunds;
      if (current.includes(value)) {
        return { ...prev, sourceOfFunds: current.filter((v) => v !== value) };
      } else {
        return { ...prev, sourceOfFunds: [...current, value] };
      }
    });
  };

  // Mobile skeleton
  const MobileSkeleton = () => (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 h-14 border-b border-[#1A1A1A]" />
      <div className="px-4 py-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#141414] rounded-2xl p-4 border border-[#262626] animate-pulse">
            <div className="h-5 w-32 bg-[#262626] rounded mb-3" />
            <div className="h-4 w-full bg-[#262626] rounded mb-2" />
            <div className="h-4 w-3/4 bg-[#262626] rounded" />
          </div>
        ))}
      </div>
    </div>
  );

  if (status === "loading") {
    return (
      <DashboardLayout hideMobileHeader>
        {/* Mobile Loading */}
        <div className="lg:hidden">
          <MobileSkeleton />
        </div>
        {/* Desktop Loading */}
        <div className="hidden lg:flex min-h-screen items-center justify-center">
          <div className="text-text-primary text-xl">{tCommon("loading")}</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return null;
  }

  // Menu items for mobile
  const menuItems = [
    { id: 'profile', label: t("personalInfo"), icon: User, description: 'Manage your personal details' },
    { id: 'security', label: t("security"), icon: Shield, description: 'Password and security settings' },
    { id: 'kyc', label: t("kyc"), icon: FileText, description: 'Identity verification documents' },
  ];

  return (
    <DashboardLayout hideMobileHeader>
      {/* ==================== MOBILE VIEW ==================== */}
      <div className="lg:hidden min-h-screen bg-[#0A0A0A] pb-[100px]">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-[#1A1A1A]">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-lg font-semibold text-white">{t("title")}</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* KYC Status Banner */}
        <div className="px-4 pt-4">
          <div className={`rounded-2xl p-4 border ${
            kycStatus === 'APPROVED'
              ? 'bg-[#00FF87]/10 border-[#00FF87]/30'
              : kycStatus === 'PENDING'
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {kycStatus === 'APPROVED' ? (
                  <CheckCircle className="w-6 h-6 text-[#00FF87]" />
                ) : kycStatus === 'PENDING' ? (
                  <Clock className="w-6 h-6 text-amber-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
                <div>
                  <p className={`font-semibold ${
                    kycStatus === 'APPROVED' ? 'text-[#00FF87]' : kycStatus === 'PENDING' ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    KYC {kycStatus === 'APPROVED' ? 'Verified' : kycStatus === 'PENDING' ? 'Under Review' : 'Required'}
                  </p>
                  <p className="text-xs text-[#808080]">
                    {kycStatus === 'APPROVED' ? 'Full access enabled' : 'Complete verification to unlock features'}
                  </p>
                </div>
              </div>
              {kycStatus !== 'APPROVED' && (
                <button
                  onClick={() => setActiveTab('kyc')}
                  className="px-3 py-1.5 bg-[#00FF87] text-black text-xs font-semibold rounded-full"
                >
                  Verify
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Settings Menu */}
        <div className="px-4 py-4 space-y-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full bg-[#141414] rounded-2xl p-4 border text-left active:scale-[0.98] transition-all flex items-center justify-between ${
                activeTab === item.id ? 'border-[#00FF87]' : 'border-[#262626]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activeTab === item.id ? 'bg-[#00FF87]/20' : 'bg-[#1A1A1A]'
                }`}>
                  <item.icon className={`w-5 h-5 ${
                    activeTab === item.id ? 'text-[#00FF87]' : 'text-[#808080]'
                  }`} />
                </div>
                <div>
                  <p className="text-white font-medium">{item.label}</p>
                  <p className="text-[#808080] text-xs">{item.description}</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 ${
                activeTab === item.id ? 'text-[#00FF87]' : 'text-[#404040]'
              }`} />
            </button>
          ))}
        </div>

        {/* Active Tab Content */}
        <div className="px-4">
          {message && (
            <div
              className={`mb-4 p-4 rounded-2xl ${
                message.type === "success"
                  ? "bg-[#00FF87]/20 text-[#00FF87] border border-[#00FF87]/30"
                  : "bg-red-500/20 text-red-500 border border-red-500/30"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Profile Tab - Mobile */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              {/* Personal Details */}
              <div className="bg-[#141414] rounded-2xl p-4 border border-[#262626]">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#00FF87]" />
                  Personal Details
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#808080] mb-1">First Name</label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#262626] rounded-xl text-white text-sm focus:outline-none focus:border-[#00FF87]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#808080] mb-1">Last Name</label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#262626] rounded-xl text-white text-sm focus:outline-none focus:border-[#00FF87]"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[#808080] mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#262626] rounded-xl text-white text-sm focus:outline-none focus:border-[#00FF87]"
                    />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-[#141414] rounded-2xl p-4 border border-[#262626]">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#00FF87]" />
                  Contact
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-[#808080] mb-1">Email (locked)</label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#262626] rounded-xl text-[#808080] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#808080] mb-1">Phone</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                      className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#262626] rounded-xl text-white text-sm focus:outline-none focus:border-[#00FF87]"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-[#141414] rounded-2xl p-4 border border-[#262626]">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#00FF87]" />
                  Address
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-[#808080] mb-1">Street Address</label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      placeholder="123 Main Street"
                      className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#262626] rounded-xl text-white text-sm focus:outline-none focus:border-[#00FF87]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#808080] mb-1">City</label>
                      <input
                        type="text"
                        value={profileData.city}
                        onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                        className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#262626] rounded-xl text-white text-sm focus:outline-none focus:border-[#00FF87]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#808080] mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={profileData.postalCode}
                        onChange={(e) => setProfileData({ ...profileData, postalCode: e.target.value })}
                        className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#262626] rounded-xl text-white text-sm focus:outline-none focus:border-[#00FF87]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment */}
              <div className="bg-[#141414] rounded-2xl p-4 border border-[#262626]">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#00FF87]" />
                  Employment
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-[#808080] mb-1">Employment Status</label>
                    <select
                      value={profileData.employmentStatus}
                      onChange={(e) => setProfileData({ ...profileData, employmentStatus: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#262626] rounded-xl text-white text-sm focus:outline-none focus:border-[#00FF87]"
                    >
                      <option value="">Select status</option>
                      {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#808080] mb-1">Occupation</label>
                    <input
                      type="text"
                      value={profileData.occupation}
                      onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
                      placeholder="e.g., Software Engineer"
                      className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#262626] rounded-xl text-white text-sm focus:outline-none focus:border-[#00FF87]"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#00FF87] text-black font-semibold rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* Security Tab - Mobile */}
          {activeTab === "security" && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="bg-[#141414] rounded-2xl p-4 border border-[#262626]">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#00FF87]" />
                  Change Password
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-[#808080] mb-1">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#262626] rounded-xl text-white text-sm focus:outline-none focus:border-[#00FF87]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#808080] mb-1">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#262626] rounded-xl text-white text-sm focus:outline-none focus:border-[#00FF87]"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#808080] mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#262626] rounded-xl text-white text-sm focus:outline-none focus:border-[#00FF87]"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#00FF87] text-black font-semibold rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          {/* KYC Tab - Mobile */}
          {activeTab === "kyc" && (
            <form onSubmit={handleKycUpload} className="space-y-4">
              {/* Status */}
              <div className={`rounded-2xl p-4 border ${
                kycStatus === 'APPROVED'
                  ? 'bg-[#00FF87]/10 border-[#00FF87]/30'
                  : kycStatus === 'PENDING'
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-[#141414] border-[#262626]'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  {kycStatus === 'APPROVED' ? (
                    <CheckCircle className="w-6 h-6 text-[#00FF87]" />
                  ) : kycStatus === 'PENDING' ? (
                    <Clock className="w-6 h-6 text-amber-500" />
                  ) : (
                    <FileText className="w-6 h-6 text-[#808080]" />
                  )}
                  <span className={`font-semibold ${
                    kycStatus === 'APPROVED' ? 'text-[#00FF87]' : kycStatus === 'PENDING' ? 'text-amber-500' : 'text-white'
                  }`}>
                    {kycStatus === 'APPROVED' ? 'Verified' : kycStatus === 'PENDING' ? 'Under Review' : 'Not Verified'}
                  </span>
                </div>
                <p className="text-[#808080] text-sm">
                  {kycStatus === 'APPROVED'
                    ? 'Your identity has been verified.'
                    : kycStatus === 'PENDING'
                    ? 'Your documents are being reviewed (1-2 business days).'
                    : 'Upload your documents to verify your identity.'}
                </p>
              </div>

              {/* Passport */}
              <div className="bg-[#141414] rounded-2xl p-4 border border-[#262626]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium">Government ID</h4>
                    <p className="text-xs text-[#808080]">Passport or national ID</p>
                  </div>
                  <Upload className="w-5 h-5 text-[#00FF87]" />
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect("passport", e.target.files?.[0])}
                  className="w-full text-sm text-[#808080] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#00FF87]/20 file:text-[#00FF87] file:font-medium file:text-sm"
                />
                {kycDocuments.passport && (
                  <p className="mt-2 text-xs text-[#00FF87]">Selected: {kycDocuments.passport.name}</p>
                )}
              </div>

              {/* Proof of Address */}
              <div className="bg-[#141414] rounded-2xl p-4 border border-[#262626]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium">Proof of Address</h4>
                    <p className="text-xs text-[#808080]">Utility bill or bank statement</p>
                  </div>
                  <Upload className="w-5 h-5 text-[#00FF87]" />
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect("proofOfAddress", e.target.files?.[0])}
                  className="w-full text-sm text-[#808080] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#00FF87]/20 file:text-[#00FF87] file:font-medium file:text-sm"
                />
                {kycDocuments.proofOfAddress && (
                  <p className="mt-2 text-xs text-[#00FF87]">Selected: {kycDocuments.proofOfAddress.name}</p>
                )}
              </div>

              {/* Wealth Statement */}
              <div className="bg-[#141414] rounded-2xl p-4 border border-[#262626]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium">Wealth Statement</h4>
                    <p className="text-xs text-[#808080]">Bank statement (optional)</p>
                  </div>
                  <Upload className="w-5 h-5 text-[#808080]" />
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect("wealthStatement", e.target.files?.[0])}
                  className="w-full text-sm text-[#808080] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#00FF87]/20 file:text-[#00FF87] file:font-medium file:text-sm"
                />
                {kycDocuments.wealthStatement && (
                  <p className="mt-2 text-xs text-[#00FF87]">Selected: {kycDocuments.wealthStatement.name}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || (!kycDocuments.passport && !kycDocuments.proofOfAddress)}
                className="w-full py-4 bg-[#00FF87] text-black font-semibold rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Upload Documents'}
              </button>
            </form>
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-white/[0.08] z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="flex items-center justify-around py-2 px-2">
            <Link href="/dashboard" className="flex flex-col items-center gap-1 py-2 px-4">
              <Home className="w-5 h-5 text-text-tertiary" />
              <span className="text-[10px] font-medium text-text-tertiary">Home</span>
            </Link>
            <Link href="/dashboard/trades" className="flex flex-col items-center gap-1 py-2 px-4">
              <TrendingUp className="w-5 h-5 text-text-tertiary" />
              <span className="text-[10px] font-medium text-text-tertiary">Trades</span>
            </Link>
            <Link
              href="/dashboard/deposit"
              className="flex items-center justify-center w-12 h-12 -mt-4 rounded-xl bg-gradient-to-br from-accent-green to-emerald-500 shadow-lg shadow-accent-green/30"
            >
              <Download className="w-5 h-5 text-background-main" />
            </Link>
            <Link href="/dashboard/transactions" className="flex flex-col items-center gap-1 py-2 px-4">
              <History className="w-5 h-5 text-text-tertiary" />
              <span className="text-[10px] font-medium text-text-tertiary">History</span>
            </Link>
            <Link href="/dashboard/settings" className="flex flex-col items-center gap-1 py-2 px-4 rounded-xl bg-[#00FF87]/10">
              <Settings className="w-5 h-5 text-[#00FF87]" />
              <span className="text-[10px] font-semibold text-[#00FF87]">Settings</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* ==================== DESKTOP VIEW ==================== */}
      <div className="hidden lg:block p-4 lg:p-8 max-w-5xl mx-auto">
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
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {/* Personal Details Section */}
                <div className="bg-background-primary border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-accent-gold/20 rounded-lg">
                      <User className="w-5 h-5 text-accent-gold" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">
                        Personal Details
                      </h3>
                      <p className="text-sm text-text-secondary">
                        Your basic personal information
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
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
                        className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Date of Birth <span className="text-accent-red">*</span>
                      </label>
                      <input
                        type="date"
                        value={profileData.dateOfBirth}
                        onChange={(e) =>
                          setProfileData({ ...profileData, dateOfBirth: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        <Globe className="w-4 h-4 inline mr-1" />
                        Nationality
                      </label>
                      <ReactFlagsSelect
                        selected={Object.keys(COUNTRY_NAMES).find(
                          (code) => COUNTRY_NAMES[code] === profileData.nationality
                        ) || ""}
                        onSelect={handleNationalitySelect}
                        searchable
                        searchPlaceholder="Search nationality..."
                        className="flags-select"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="bg-background-primary border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-accent-gold/20 rounded-lg">
                      <Mail className="w-5 h-5 text-accent-gold" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">
                        Contact Information
                      </h3>
                      <p className="text-sm text-text-secondary">
                        How we can reach you
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email Address
                        <Lock className="w-3 h-3 inline ml-2 text-text-secondary" />
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full px-4 py-3 bg-background-tertiary border border-border rounded-lg text-text-secondary cursor-not-allowed"
                        title="Email cannot be changed"
                      />
                      <p className="mt-1 text-xs text-text-secondary flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Email address cannot be modified for security reasons
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({ ...profileData, phone: e.target.value })
                        }
                        placeholder="+1 234 567 8900"
                        className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Residential Address Section */}
                <div className="bg-background-primary border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-accent-gold/20 rounded-lg">
                      <MapPin className="w-5 h-5 text-accent-gold" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">
                        Residential Address
                      </h3>
                      <p className="text-sm text-text-secondary">
                        Your current home address
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
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
                        className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Postal / ZIP Code
                      </label>
                      <input
                        type="text"
                        value={profileData.postalCode}
                        onChange={(e) =>
                          setProfileData({ ...profileData, postalCode: e.target.value })
                        }
                        placeholder="10001"
                        className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Country
                      </label>
                      <ReactFlagsSelect
                        selected={profileData.countryCode || Object.keys(COUNTRY_NAMES).find(
                          (code) => COUNTRY_NAMES[code] === profileData.country
                        ) || ""}
                        onSelect={handleCountrySelect}
                        searchable
                        searchPlaceholder="Search country..."
                        className="flags-select"
                      />
                    </div>
                  </div>
                </div>

                {/* Employment & Financial Information Section */}
                <div className="bg-background-primary border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-accent-gold/20 rounded-lg">
                      <Briefcase className="w-5 h-5 text-accent-gold" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">
                        Employment & Financial Information
                      </h3>
                      <p className="text-sm text-text-secondary">
                        Required for regulatory compliance
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Employment Status <span className="text-accent-red">*</span>
                      </label>
                      <select
                        value={profileData.employmentStatus}
                        onChange={(e) =>
                          setProfileData({ ...profileData, employmentStatus: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all cursor-pointer"
                        required
                      >
                        <option value="">Select status</option>
                        {EMPLOYMENT_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Occupation / Job Title
                      </label>
                      <input
                        type="text"
                        value={profileData.occupation}
                        onChange={(e) =>
                          setProfileData({ ...profileData, occupation: e.target.value })
                        }
                        placeholder="e.g., Software Engineer"
                        className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Source of Funds <span className="text-accent-red">*</span>
                        <span className="text-text-secondary font-normal ml-1">(Select all that apply)</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                        {SOURCE_OF_FUNDS_OPTIONS.map((option) => (
                          <label
                            key={option.value}
                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                              profileData.sourceOfFunds.includes(option.value)
                                ? "bg-accent-gold/20 border-accent-gold text-accent-gold"
                                : "bg-background-secondary border-border text-text-primary hover:border-accent-gold/50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={profileData.sourceOfFunds.includes(option.value)}
                              onChange={() => handleSourceOfFundsChange(option.value)}
                              className="sr-only"
                            />
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                profileData.sourceOfFunds.includes(option.value)
                                  ? "bg-accent-gold border-accent-gold"
                                  : "border-border"
                              }`}
                            >
                              {profileData.sourceOfFunds.includes(option.value) && (
                                <CheckCircle className="w-3 h-3 text-background-primary" />
                              )}
                            </div>
                            <span className="text-sm">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferences Section */}
                <div className="bg-background-primary border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-accent-gold/20 rounded-lg">
                      <Globe className="w-5 h-5 text-accent-gold" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">
                        Preferences
                      </h3>
                      <p className="text-sm text-text-secondary">
                        Your display preferences
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Timezone
                      </label>
                      <select
                        value={profileData.timezone}
                        onChange={(e) =>
                          setProfileData({ ...profileData, timezone: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all cursor-pointer"
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
              <div className="space-y-6">
                <div className="bg-background-primary border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-accent-gold/20 rounded-lg">
                      <Lock className="w-5 h-5 text-accent-gold" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">
                        Change Password
                      </h3>
                      <p className="text-sm text-text-secondary">
                        Update your account password
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-4">
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
                        className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
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
                        className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
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
                        className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
                        required
                        minLength={8}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-accent-gold text-background-primary rounded-lg font-medium hover:bg-accent-gold/90 transition-colors disabled:opacity-50"
                    >
                      {loading ? tCommon("loading") : t("changePassword")}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* KYC Tab */}
            {activeTab === "kyc" && (
              <div className="space-y-6">
                {/* KYC Status */}
                <div className="bg-background-primary border border-border rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-xl font-bold text-text-primary">
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
                <form onSubmit={handleKycUpload} className="space-y-4">
                  {/* Passport */}
                  <div className="bg-background-primary border border-border rounded-xl p-6">
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
                        Selected: {kycDocuments.passport.name}
                      </p>
                    )}
                  </div>

                  {/* Proof of Address */}
                  <div className="bg-background-primary border border-border rounded-xl p-6">
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
                        Selected: {kycDocuments.proofOfAddress.name}
                      </p>
                    )}
                  </div>

                  {/* Wealth Statement */}
                  <div className="bg-background-primary border border-border rounded-xl p-6">
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
                        Selected: {kycDocuments.wealthStatement.name}
                      </p>
                    )}
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
