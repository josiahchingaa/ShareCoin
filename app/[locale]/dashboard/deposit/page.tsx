"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  AlertTriangle,
  QrCode,
  Shield,
  Clock,
  ChevronDown,
  Wallet,
  Sparkles,
  CheckCircle2,
  Zap,
  Lock,
  Home,
  TrendingUp,
  History,
  Settings,
  Download,
} from "lucide-react";

// Wallet addresses configuration
const WALLET_ADDRESSES: Record<string, string> = {
  BTC: "bc1qdkz5ye6zv0rdkxafw9supy2rxdev94twytf8zt",
  ETH: "0xa7EB2f38effBaF2561264EeAB212b633FC6A5563",
  SOL: "H7HpNfHsXWuTh3DQrLUC3xhr7ifhRTPHaTijcspBTmrz",
  MATIC: "0xa7EB2f38effBaF2561264EeAB212b633FC6A5563",
};

// Asset configuration with compatible networks
const ASSETS = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    icon: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
    networks: ["BTC"],
    color: "#F7931A",
    gradient: "from-orange-500 to-amber-600",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    icon: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    networks: ["ETH"],
    color: "#627EEA",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    symbol: "SOL",
    name: "Solana",
    icon: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
    networks: ["SOL"],
    color: "#9945FF",
    gradient: "from-purple-500 to-fuchsia-600",
  },
  {
    symbol: "MATIC",
    name: "Polygon",
    icon: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",
    networks: ["MATIC"],
    color: "#8247E5",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    icon: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
    networks: ["ETH", "MATIC"],
    color: "#26A17B",
    gradient: "from-emerald-500 to-green-600",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    icon: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
    networks: ["SOL"],
    color: "#2775CA",
    gradient: "from-blue-500 to-cyan-600",
  },
];

// Network configuration
const NETWORKS: Record<string, { name: string; icon: string; color: string; confirmations: number; estimatedTime: string; gradient: string }> = {
  BTC: {
    name: "Bitcoin Network",
    icon: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
    color: "#F7931A",
    confirmations: 3,
    estimatedTime: "30-60 min",
    gradient: "from-orange-500 to-amber-600",
  },
  ETH: {
    name: "Ethereum Network",
    icon: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    color: "#627EEA",
    confirmations: 12,
    estimatedTime: "5-10 min",
    gradient: "from-blue-500 to-indigo-600",
  },
  SOL: {
    name: "Solana Network",
    icon: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
    color: "#9945FF",
    confirmations: 32,
    estimatedTime: "1-2 min",
    gradient: "from-purple-500 to-fuchsia-600",
  },
  MATIC: {
    name: "Polygon Network",
    icon: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",
    color: "#8247E5",
    confirmations: 128,
    estimatedTime: "2-5 min",
    gradient: "from-violet-500 to-purple-600",
  },
};

export default function DepositPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedAsset, setSelectedAsset] = useState<typeof ASSETS[0] | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleCopyAddress = () => {
    if (selectedNetwork) {
      navigator.clipboard.writeText(WALLET_ADDRESSES[selectedNetwork]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAssetSelect = (asset: typeof ASSETS[0]) => {
    setSelectedAsset(asset);
    setShowAssetDropdown(false);
    if (asset.networks.length === 1) {
      setSelectedNetwork(asset.networks[0]);
    } else {
      setSelectedNetwork(null);
    }
  };

  const handleNetworkSelect = (network: string) => {
    setSelectedNetwork(network);
    setShowNetworkDropdown(false);
  };

  const currentAddress = selectedNetwork ? WALLET_ADDRESSES[selectedNetwork] : null;
  const currentNetwork = selectedNetwork ? NETWORKS[selectedNetwork] : null;

  // Calculate step completion
  const step1Complete = selectedAsset !== null;
  const step2Complete = selectedNetwork !== null;
  const step3Complete = currentAddress !== null;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-main">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
          </div>
          <p className="text-text-secondary animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-main relative pb-[100px] lg:pb-0">
      {/* Subtle Background Gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className={`absolute -top-1/2 -right-1/2 w-full h-full rounded-full blur-3xl transition-all duration-1000 ${
            selectedAsset ? 'opacity-10' : 'opacity-5'
          }`}
          style={{
            background: selectedAsset
              ? `radial-gradient(circle, ${selectedAsset.color}20 0%, transparent 70%)`
              : 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)'
          }}
        />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-radial from-primary/3 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-[#1A1A1A]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary group-hover:text-text-primary transition-colors" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Deposit Crypto</h1>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-green/10 border border-accent-green/20">
                  <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                  <span className="text-accent-green text-xs font-medium">Live</span>
                </div>
              </div>
              <p className="text-text-secondary text-sm mt-1">
                Securely fund your account with cryptocurrency
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps - Desktop */}
      <div className="hidden lg:block relative max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          {/* Step 1 */}
          <div className="flex items-center gap-3">
            <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
              step1Complete
                ? 'bg-gradient-to-br from-accent-green to-emerald-600'
                : 'bg-white/5 border border-white/10'
            }`}>
              {step1Complete ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <span className="text-lg font-bold text-text-secondary">1</span>
              )}
            </div>
            <div>
              <p className={`font-semibold transition-colors ${step1Complete ? 'text-text-primary' : 'text-text-secondary'}`}>
                Select Asset
              </p>
              <p className="text-xs text-text-tertiary">Choose cryptocurrency</p>
            </div>
          </div>

          {/* Connector Line */}
          <div className="flex-1 h-0.5 mx-4 relative overflow-hidden bg-white/5 rounded-full">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-green to-primary rounded-full transition-all duration-500"
              style={{ width: step1Complete ? '100%' : '0%' }}
            />
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-3">
            <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
              step2Complete
                ? 'bg-gradient-to-br from-accent-green to-emerald-600'
                : step1Complete
                  ? 'bg-white/5 border border-primary/30'
                  : 'bg-white/5 border border-white/10'
            }`}>
              {step2Complete ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <span className={`text-lg font-bold ${step1Complete ? 'text-primary' : 'text-text-secondary'}`}>2</span>
              )}
            </div>
            <div>
              <p className={`font-semibold transition-colors ${step2Complete ? 'text-text-primary' : step1Complete ? 'text-text-primary' : 'text-text-secondary'}`}>
                Select Network
              </p>
              <p className="text-xs text-text-tertiary">Choose blockchain</p>
            </div>
          </div>

          {/* Connector Line */}
          <div className="flex-1 h-0.5 mx-4 relative overflow-hidden bg-white/5 rounded-full">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent-gold rounded-full transition-all duration-500"
              style={{ width: step2Complete ? '100%' : '0%' }}
            />
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-3">
            <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
              step3Complete
                ? 'bg-gradient-to-br from-accent-gold to-amber-600'
                : step2Complete
                  ? 'bg-white/5 border border-primary/30'
                  : 'bg-white/5 border border-white/10'
            }`}>
              {step3Complete ? (
                <Sparkles className="w-6 h-6 text-white" />
              ) : (
                <span className={`text-lg font-bold ${step2Complete ? 'text-primary' : 'text-text-secondary'}`}>3</span>
              )}
            </div>
            <div>
              <p className={`font-semibold transition-colors ${step3Complete ? 'text-accent-gold' : step2Complete ? 'text-text-primary' : 'text-text-secondary'}`}>
                Get Address
              </p>
              <p className="text-xs text-text-tertiary">Copy & deposit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`relative max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-2 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column - Selection */}
          <div className="lg:col-span-5 space-y-5">
            {/* Step 1: Select Asset */}
            <div className={`relative bg-background-card/60 backdrop-blur-xl border rounded-2xl p-5 transition-all duration-500 ${
              step1Complete ? 'border-white/20' : 'border-white/10'
            } ${showAssetDropdown ? 'z-20' : 'z-10'}`}>

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                  step1Complete
                    ? 'bg-gradient-to-br from-accent-green to-emerald-600'
                    : 'bg-gradient-to-br from-primary/80 to-primary'
                }`}>
                  {step1Complete ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-white font-bold">1</span>
                  )}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-primary">Select Asset</h2>
                  <p className="text-xs text-text-tertiary">Choose the cryptocurrency to deposit</p>
                </div>
              </div>

              {/* Asset Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowAssetDropdown(!showAssetDropdown)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                    showAssetDropdown
                      ? 'bg-white/10 border-primary/50 ring-2 ring-primary/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                  } border`}
                >
                  {selectedAsset ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedAsset.icon}
                        alt={selectedAsset.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="text-left">
                        <p className="text-text-primary font-semibold">{selectedAsset.symbol}</p>
                        <p className="text-text-tertiary text-sm">{selectedAsset.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-text-tertiary" />
                      </div>
                      <span className="text-text-secondary">Choose cryptocurrency</span>
                    </div>
                  )}
                  <ChevronDown className={`w-5 h-5 text-text-secondary transition-transform duration-300 ${showAssetDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showAssetDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-background-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-80 overflow-y-auto">
                      {ASSETS.map((asset, index) => (
                        <button
                          key={asset.symbol}
                          onClick={() => handleAssetSelect(asset)}
                          className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-all duration-200 ${
                            index !== ASSETS.length - 1 ? 'border-b border-white/5' : ''
                          }`}
                          style={{
                            animationDelay: `${index * 50}ms`
                          }}
                        >
                          <img
                            src={asset.icon}
                            alt={asset.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="text-left flex-1">
                            <p className="text-text-primary font-semibold">{asset.symbol}</p>
                            <p className="text-text-tertiary text-sm">{asset.name}</p>
                          </div>
                          <div className="flex gap-1.5">
                            {asset.networks.map((net) => (
                              <span
                                key={net}
                                className="px-2 py-1 text-xs rounded-lg bg-white/5 text-text-tertiary border border-white/10"
                              >
                                {net}
                              </span>
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Select Network */}
            <div className={`relative bg-background-card/60 backdrop-blur-xl border rounded-2xl p-5 transition-all duration-500 ${
              !selectedAsset ? 'opacity-40 pointer-events-none' : step2Complete ? 'border-white/20' : 'border-white/10'
            } ${showNetworkDropdown ? 'z-20' : 'z-0'}`}>

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                  step2Complete
                    ? 'bg-gradient-to-br from-accent-green to-emerald-600'
                    : step1Complete
                      ? 'bg-gradient-to-br from-primary/80 to-primary'
                      : 'bg-white/10'
                }`}>
                  {step2Complete ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span className={`font-bold ${step1Complete ? 'text-white' : 'text-text-tertiary'}`}>2</span>
                  )}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-primary">Select Network</h2>
                  <p className="text-xs text-text-tertiary">Choose the blockchain network</p>
                </div>
              </div>

              {selectedAsset && selectedAsset.networks.length > 1 ? (
                <div className="relative">
                  <button
                    onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                      showNetworkDropdown
                        ? 'bg-white/10 border-primary/50 ring-2 ring-primary/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                    } border`}
                  >
                    {selectedNetwork ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={NETWORKS[selectedNetwork].icon}
                          alt={NETWORKS[selectedNetwork].name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="text-left">
                          <p className="text-text-primary font-semibold">{selectedNetwork}</p>
                          <p className="text-text-tertiary text-sm">{NETWORKS[selectedNetwork].name}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-text-tertiary" />
                        </div>
                        <span className="text-text-secondary">Choose network</span>
                      </div>
                    )}
                    <ChevronDown className={`w-5 h-5 text-text-secondary transition-transform duration-300 ${showNetworkDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showNetworkDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-background-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {selectedAsset.networks.map((network, index) => (
                        <button
                          key={network}
                          onClick={() => handleNetworkSelect(network)}
                          className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-all duration-200 ${
                            index !== selectedAsset.networks.length - 1 ? 'border-b border-white/5' : ''
                          }`}
                        >
                          <img
                            src={NETWORKS[network].icon}
                            alt={NETWORKS[network].name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="text-left flex-1">
                            <p className="text-text-primary font-semibold">{network}</p>
                            <p className="text-text-tertiary text-sm">{NETWORKS[network].name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-text-tertiary" />
                            <span className="text-text-secondary text-sm">{NETWORKS[network].estimatedTime}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : selectedAsset ? (
                <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <img
                    src={NETWORKS[selectedAsset.networks[0]].icon}
                    alt={NETWORKS[selectedAsset.networks[0]].name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="text-text-primary font-semibold">{selectedAsset.networks[0]}</p>
                    <p className="text-text-tertiary text-sm">{NETWORKS[selectedAsset.networks[0]].name}</p>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-accent-green/10 border border-accent-green/20">
                    <span className="text-accent-green text-xs font-medium">Default</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-text-tertiary text-center">
                  Select an asset first
                </div>
              )}
            </div>

            {/* Network Info Card */}
            {currentNetwork && (
              <div className="relative bg-background-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">

                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                      Network Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <div className="flex items-center gap-2 text-text-tertiary mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs">Est. Time</span>
                      </div>
                      <p className="text-text-primary font-semibold">{currentNetwork.estimatedTime}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <div className="flex items-center gap-2 text-text-tertiary mb-1">
                        <Shield className="w-3.5 h-3.5" />
                        <span className="text-xs">Confirmations</span>
                      </div>
                      <p className="text-text-primary font-semibold">{currentNetwork.confirmations}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Address Display */}
          <div className="lg:col-span-7">
            <div className={`relative bg-background-card/60 backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-500 ${
              currentAddress ? 'border-white/20' : 'border-white/10'
            }`}>
              {/* Header Gradient Bar */}
              {currentAddress && selectedAsset && (
                <div
                  className="h-1 w-full"
                  style={{
                    background: `linear-gradient(to right, ${selectedAsset.color}, ${selectedAsset.color}80)`
                  }}
                />
              )}

              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                      currentAddress
                        ? 'bg-gradient-to-br from-accent-gold to-amber-600'
                        : 'bg-white/10'
                    }`}>
                      {currentAddress ? (
                        <Sparkles className="w-5 h-5 text-white" />
                      ) : (
                        <span className="text-text-tertiary font-bold">3</span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-text-primary">Deposit Address</h2>
                      <p className="text-xs text-text-tertiary">Scan QR or copy address</p>
                    </div>
                  </div>

                  {currentAddress && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-green/10 border border-accent-green/20">
                      <Lock className="w-3.5 h-3.5 text-accent-green" />
                      <span className="text-accent-green text-xs font-medium">Secured</span>
                    </div>
                  )}
                </div>

                {currentAddress ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* QR Code Display */}
                    <div className="flex justify-center mb-6">
                      <div className="relative group">
                        {/* QR Container */}
                        <div className="relative bg-white p-4 rounded-2xl shadow-lg">
                          {/* Corner Accents */}
                          <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 rounded-tl-lg" style={{ borderColor: selectedAsset?.color }} />
                          <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 rounded-tr-lg" style={{ borderColor: selectedAsset?.color }} />
                          <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 rounded-bl-lg" style={{ borderColor: selectedAsset?.color }} />
                          <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 rounded-br-lg" style={{ borderColor: selectedAsset?.color }} />

                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentAddress)}&bgcolor=ffffff&color=000000&margin=0`}
                            alt="QR Code"
                            className="w-44 h-44 sm:w-48 sm:h-48"
                          />

                          {/* Center Logo */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div
                              className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center"
                              style={{
                                boxShadow: `0 0 0 2px ${selectedAsset?.color}`
                              }}
                            >
                              <img
                                src={selectedAsset?.icon}
                                alt={selectedAsset?.symbol}
                                className="w-6 h-6 rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address Display */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-text-secondary">
                          {selectedAsset?.symbol} Address
                        </label>
                        <span
                          className="text-xs px-2 py-0.5 rounded-md"
                          style={{
                            backgroundColor: `${currentNetwork?.color}20`,
                            color: currentNetwork?.color
                          }}
                        >
                          {selectedNetwork}
                        </span>
                      </div>
                      <div className="relative">
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors">
                          <input
                            type="text"
                            readOnly
                            value={currentAddress}
                            className="flex-1 px-4 py-4 bg-transparent text-text-primary font-mono text-sm focus:outline-none"
                          />
                          <button
                            onClick={handleCopyAddress}
                            className={`flex items-center gap-2 px-5 py-4 font-medium text-sm transition-all duration-300 ${
                              copied
                                ? 'bg-accent-green text-white'
                                : 'bg-primary hover:bg-primary/90 text-white'
                            }`}
                          >
                            {copied ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="relative bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-6 overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                      <div className="flex gap-3 pl-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-amber-400 font-semibold text-sm mb-2">Important Notice</p>
                          <ul className="text-amber-500/90 text-sm space-y-1.5">
                            <li className="flex items-start gap-2">
                              <span className="text-amber-500 mt-1.5">•</span>
                              Only send <strong className="text-amber-400">{selectedAsset?.symbol}</strong> to this address
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-amber-500 mt-1.5">•</span>
                              Ensure you&apos;re using the <strong className="text-amber-400">{selectedNetwork}</strong> network
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-amber-500 mt-1.5">•</span>
                              Sending to wrong address or network will result in loss of funds
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                          How to Deposit
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { step: 1, text: "Copy address or scan QR code" },
                          { step: 2, text: "Open your external wallet" },
                          { step: 3, text: `Wait for ${currentNetwork?.confirmations} confirmations` },
                          { step: 4, text: "Balance credited automatically" },
                        ].map((item) => (
                          <div key={item.step} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                              {item.step}
                            </div>
                            <p className="text-text-secondary text-sm">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
                      <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10">
                        <QrCode className="w-12 h-12 text-text-tertiary" />
                      </div>
                    </div>
                    <p className="text-text-secondary font-medium mb-2">
                      Select an asset and network
                    </p>
                    <p className="text-text-tertiary text-sm max-w-xs">
                      Your unique deposit address and QR code will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-5 relative bg-gradient-to-br from-accent-green/5 to-accent-green/[0.02] backdrop-blur-xl border border-accent-green/10 rounded-2xl p-5 overflow-hidden">
              {/* Decorative Icon */}
              <div className="absolute -right-4 -bottom-4 opacity-5">
                <Shield className="w-32 h-32 text-accent-green" />
              </div>

              <div className="relative flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-green/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-accent-green" />
                </div>
                <div>
                  <h3 className="text-text-primary font-semibold mb-1">Institutional-Grade Security</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Your deposits are protected by multi-signature wallets, cold storage solutions,
                    and enterprise-grade security protocols trusted by leading institutions worldwide.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-white/[0.08] z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
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
          <Link href="/dashboard/settings" className="flex flex-col items-center gap-1 py-2 px-4">
            <Settings className="w-5 h-5 text-text-tertiary" />
            <span className="text-[10px] font-medium text-text-tertiary">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
