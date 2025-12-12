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
  Upload,
  Building2,
  Bitcoin,
  ArrowRight,
  Info,
  Banknote,
  Globe,
  User,
  Hash,
} from "lucide-react";

// Withdrawal type
type WithdrawalType = "crypto" | "fiat" | null;

// Crypto assets configuration
const CRYPTO_ASSETS = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    icon: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
    networks: ["BTC"],
    color: "#F7931A",
    gradient: "from-orange-500 to-amber-600",
    minWithdrawal: 0.0001,
    fee: 0.00005,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    icon: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    networks: ["ETH"],
    color: "#627EEA",
    gradient: "from-blue-500 to-indigo-600",
    minWithdrawal: 0.001,
    fee: 0.0005,
  },
  {
    symbol: "SOL",
    name: "Solana",
    icon: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
    networks: ["SOL"],
    color: "#9945FF",
    gradient: "from-purple-500 to-fuchsia-600",
    minWithdrawal: 0.01,
    fee: 0.001,
  },
  {
    symbol: "MATIC",
    name: "Polygon",
    icon: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",
    networks: ["MATIC"],
    color: "#8247E5",
    gradient: "from-violet-500 to-purple-600",
    minWithdrawal: 1,
    fee: 0.1,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    icon: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
    networks: ["ETH", "MATIC"],
    color: "#26A17B",
    gradient: "from-emerald-500 to-green-600",
    minWithdrawal: 10,
    fee: 1,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    icon: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
    networks: ["SOL"],
    color: "#2775CA",
    gradient: "from-blue-500 to-cyan-600",
    minWithdrawal: 10,
    fee: 1,
  },
];

// Network configuration
const NETWORKS: Record<string, { name: string; icon: string; color: string; estimatedTime: string; gradient: string }> = {
  BTC: {
    name: "Bitcoin Network",
    icon: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
    color: "#F7931A",
    estimatedTime: "30-60 min",
    gradient: "from-orange-500 to-amber-600",
  },
  ETH: {
    name: "Ethereum Network",
    icon: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    color: "#627EEA",
    estimatedTime: "5-10 min",
    gradient: "from-blue-500 to-indigo-600",
  },
  SOL: {
    name: "Solana Network",
    icon: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
    color: "#9945FF",
    estimatedTime: "1-2 min",
    gradient: "from-purple-500 to-fuchsia-600",
  },
  MATIC: {
    name: "Polygon Network",
    icon: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",
    color: "#8247E5",
    estimatedTime: "2-5 min",
    gradient: "from-violet-500 to-purple-600",
  },
};

// Fiat currencies
const FIAT_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$", minWithdrawal: 100, fee: 25 },
  { code: "EUR", name: "Euro", symbol: "€", minWithdrawal: 100, fee: 20 },
  { code: "GBP", name: "British Pound", symbol: "£", minWithdrawal: 100, fee: 20 },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", minWithdrawal: 100, fee: 25 },
];

// Bank identification database - SWIFT codes and bank names to logos
// Using BankConv API (https://logo.bankconv.com/{domain}) for reliable bank logos
const BANK_DATABASE: Record<string, { name: string; logo: string; country: string }> = {
  // US Banks - SWIFT codes
  "CHASUS33": { name: "JPMorgan Chase", logo: "https://logo.bankconv.com/chase.com", country: "USA" },
  "BOFAUS3N": { name: "Bank of America", logo: "https://logo.bankconv.com/bankofamerica.com", country: "USA" },
  "WFBIUS6S": { name: "Wells Fargo", logo: "https://logo.bankconv.com/wellsfargo.com", country: "USA" },
  "CITIUS33": { name: "Citibank", logo: "https://logo.bankconv.com/citi.com", country: "USA" },
  "USBKUS44": { name: "US Bank", logo: "https://logo.bankconv.com/usbank.com", country: "USA" },
  "PNCCUS33": { name: "PNC Bank", logo: "https://logo.bankconv.com/pnc.com", country: "USA" },
  "TRWIUS33": { name: "Truist Bank", logo: "https://logo.bankconv.com/truist.com", country: "USA" },
  "TDBANK": { name: "TD Bank", logo: "https://logo.bankconv.com/td.com", country: "USA" },
  "CAPIUSA": { name: "Capital One", logo: "https://logo.bankconv.com/capitalone.com", country: "USA" },
  "SCHWUS33": { name: "Charles Schwab", logo: "https://logo.bankconv.com/schwab.com", country: "USA" },
  // UK Banks
  "BARCGB22": { name: "Barclays", logo: "https://logo.bankconv.com/barclays.co.uk", country: "UK" },
  "HSBCGB2L": { name: "HSBC", logo: "https://logo.bankconv.com/hsbc.com", country: "UK" },
  "LOYDGB2L": { name: "Lloyds Bank", logo: "https://logo.bankconv.com/lloydsbank.com", country: "UK" },
  "NWBKGB2L": { name: "NatWest", logo: "https://logo.bankconv.com/natwest.com", country: "UK" },
  "RLOSGB2L": { name: "Royal Bank of Scotland", logo: "https://logo.bankconv.com/rbs.co.uk", country: "UK" },
  "STDNGB2L": { name: "Standard Chartered", logo: "https://logo.bankconv.com/sc.com", country: "UK" },
  // European Banks
  "BNPAFRPP": { name: "BNP Paribas", logo: "https://logo.bankconv.com/bnpparibas.com", country: "France" },
  "SOGEFRPP": { name: "Société Générale", logo: "https://logo.bankconv.com/societegenerale.com", country: "France" },
  "CRLOFRPP": { name: "Crédit Agricole", logo: "https://logo.bankconv.com/credit-agricole.com", country: "France" },
  "DEUTDEFF": { name: "Deutsche Bank", logo: "https://logo.bankconv.com/db.com", country: "Germany" },
  "COBADEFF": { name: "Commerzbank", logo: "https://logo.bankconv.com/commerzbank.de", country: "Germany" },
  "INGBNL2A": { name: "ING Bank", logo: "https://logo.bankconv.com/ing.com", country: "Netherlands" },
  "ABNANL2A": { name: "ABN AMRO", logo: "https://logo.bankconv.com/abnamro.com", country: "Netherlands" },
  "UBSWCHZH": { name: "UBS", logo: "https://logo.bankconv.com/ubs.com", country: "Switzerland" },
  "CRESCHZZ": { name: "Credit Suisse", logo: "https://logo.bankconv.com/credit-suisse.com", country: "Switzerland" },
  // Canadian Banks
  "ROYCCAT2": { name: "Royal Bank of Canada", logo: "https://logo.bankconv.com/rbc.com", country: "Canada" },
  "TDOMCATT": { name: "TD Bank", logo: "https://logo.bankconv.com/td.com", country: "Canada" },
  "BOFMCAM2": { name: "Bank of Montreal", logo: "https://logo.bankconv.com/bmo.com", country: "Canada" },
  // Australian Banks
  "CTBAAU2S": { name: "Commonwealth Bank", logo: "https://logo.bankconv.com/commbank.com.au", country: "Australia" },
  "WPACAU2S": { name: "Westpac", logo: "https://logo.bankconv.com/westpac.com.au", country: "Australia" },
  "ANZBAU3M": { name: "ANZ Bank", logo: "https://logo.bankconv.com/anz.com.au", country: "Australia" },
  "NATAAU33": { name: "NAB", logo: "https://logo.bankconv.com/nab.com.au", country: "Australia" },
  // Asian Banks
  "HSBCHKHH": { name: "HSBC Hong Kong", logo: "https://logo.bankconv.com/hsbc.com.hk", country: "Hong Kong" },
  "SCBLSGSG": { name: "Standard Chartered Singapore", logo: "https://logo.bankconv.com/sc.com", country: "Singapore" },
  "DBSSSGSG": { name: "DBS Bank", logo: "https://logo.bankconv.com/dbs.com.sg", country: "Singapore" },
  "OCBCSGSG": { name: "OCBC Bank", logo: "https://logo.bankconv.com/ocbc.com", country: "Singapore" },
  "MHCBJPJT": { name: "Mizuho Bank", logo: "https://logo.bankconv.com/mizuhobank.com", country: "Japan" },
  "BOTKJPJT": { name: "MUFG Bank", logo: "https://logo.bankconv.com/mufg.jp", country: "Japan" },
};

// Bank name patterns for fuzzy matching
// Using BankConv API (https://logo.bankconv.com/{domain}) for reliable bank logos
const BANK_NAME_PATTERNS: Array<{ pattern: RegExp; bank: { name: string; logo: string; country: string } }> = [
  // US Banks
  { pattern: /chase|jpmorgan/i, bank: { name: "JPMorgan Chase", logo: "https://logo.bankconv.com/chase.com", country: "USA" } },
  { pattern: /bank\s*of\s*america|bofa/i, bank: { name: "Bank of America", logo: "https://logo.bankconv.com/bankofamerica.com", country: "USA" } },
  { pattern: /wells\s*fargo/i, bank: { name: "Wells Fargo", logo: "https://logo.bankconv.com/wellsfargo.com", country: "USA" } },
  { pattern: /citi|citibank/i, bank: { name: "Citibank", logo: "https://logo.bankconv.com/citi.com", country: "USA" } },
  { pattern: /us\s*bank/i, bank: { name: "US Bank", logo: "https://logo.bankconv.com/usbank.com", country: "USA" } },
  { pattern: /pnc/i, bank: { name: "PNC Bank", logo: "https://logo.bankconv.com/pnc.com", country: "USA" } },
  { pattern: /truist/i, bank: { name: "Truist Bank", logo: "https://logo.bankconv.com/truist.com", country: "USA" } },
  { pattern: /capital\s*one/i, bank: { name: "Capital One", logo: "https://logo.bankconv.com/capitalone.com", country: "USA" } },
  { pattern: /schwab/i, bank: { name: "Charles Schwab", logo: "https://logo.bankconv.com/schwab.com", country: "USA" } },
  { pattern: /goldman\s*sachs/i, bank: { name: "Goldman Sachs", logo: "https://logo.bankconv.com/goldmansachs.com", country: "USA" } },
  { pattern: /morgan\s*stanley/i, bank: { name: "Morgan Stanley", logo: "https://logo.bankconv.com/morganstanley.com", country: "USA" } },
  { pattern: /american\s*express|amex/i, bank: { name: "American Express", logo: "https://logo.bankconv.com/americanexpress.com", country: "USA" } },
  { pattern: /fidelity/i, bank: { name: "Fidelity", logo: "https://logo.bankconv.com/fidelity.com", country: "USA" } },
  { pattern: /ally/i, bank: { name: "Ally Bank", logo: "https://logo.bankconv.com/ally.com", country: "USA" } },
  { pattern: /discover/i, bank: { name: "Discover", logo: "https://logo.bankconv.com/discover.com", country: "USA" } },
  // UK Banks
  { pattern: /barclays/i, bank: { name: "Barclays", logo: "https://logo.bankconv.com/barclays.co.uk", country: "UK" } },
  { pattern: /hsbc/i, bank: { name: "HSBC", logo: "https://logo.bankconv.com/hsbc.com", country: "UK" } },
  { pattern: /lloyds/i, bank: { name: "Lloyds Bank", logo: "https://logo.bankconv.com/lloydsbank.com", country: "UK" } },
  { pattern: /natwest/i, bank: { name: "NatWest", logo: "https://logo.bankconv.com/natwest.com", country: "UK" } },
  { pattern: /standard\s*chartered/i, bank: { name: "Standard Chartered", logo: "https://logo.bankconv.com/sc.com", country: "UK" } },
  { pattern: /santander/i, bank: { name: "Santander", logo: "https://logo.bankconv.com/santander.co.uk", country: "UK" } },
  { pattern: /revolut/i, bank: { name: "Revolut", logo: "https://logo.bankconv.com/revolut.com", country: "UK" } },
  { pattern: /monzo/i, bank: { name: "Monzo", logo: "https://logo.bankconv.com/monzo.com", country: "UK" } },
  { pattern: /starling/i, bank: { name: "Starling Bank", logo: "https://logo.bankconv.com/starlingbank.com", country: "UK" } },
  // European Banks
  { pattern: /bnp\s*paribas/i, bank: { name: "BNP Paribas", logo: "https://logo.bankconv.com/bnpparibas.com", country: "France" } },
  { pattern: /societe\s*generale|soci[eé]t[eé]/i, bank: { name: "Société Générale", logo: "https://logo.bankconv.com/societegenerale.com", country: "France" } },
  { pattern: /credit\s*agricole|cr[eé]dit\s*agricole/i, bank: { name: "Crédit Agricole", logo: "https://logo.bankconv.com/credit-agricole.com", country: "France" } },
  { pattern: /deutsche\s*bank/i, bank: { name: "Deutsche Bank", logo: "https://logo.bankconv.com/db.com", country: "Germany" } },
  { pattern: /commerzbank/i, bank: { name: "Commerzbank", logo: "https://logo.bankconv.com/commerzbank.de", country: "Germany" } },
  { pattern: /\bing\b/i, bank: { name: "ING Bank", logo: "https://logo.bankconv.com/ing.com", country: "Netherlands" } },
  { pattern: /abn\s*amro/i, bank: { name: "ABN AMRO", logo: "https://logo.bankconv.com/abnamro.com", country: "Netherlands" } },
  { pattern: /\bubs\b/i, bank: { name: "UBS", logo: "https://logo.bankconv.com/ubs.com", country: "Switzerland" } },
  { pattern: /credit\s*suisse/i, bank: { name: "Credit Suisse", logo: "https://logo.bankconv.com/credit-suisse.com", country: "Switzerland" } },
  { pattern: /unicredit/i, bank: { name: "UniCredit", logo: "https://logo.bankconv.com/unicredit.it", country: "Italy" } },
  { pattern: /intesa/i, bank: { name: "Intesa Sanpaolo", logo: "https://logo.bankconv.com/intesasanpaolo.com", country: "Italy" } },
  { pattern: /rabobank/i, bank: { name: "Rabobank", logo: "https://logo.bankconv.com/rabobank.com", country: "Netherlands" } },
  // Canadian Banks
  { pattern: /royal\s*bank.*canada|rbc/i, bank: { name: "Royal Bank of Canada", logo: "https://logo.bankconv.com/rbc.com", country: "Canada" } },
  { pattern: /td\s*bank|toronto.dominion/i, bank: { name: "TD Bank", logo: "https://logo.bankconv.com/td.com", country: "Canada" } },
  { pattern: /bank\s*of\s*montreal|bmo/i, bank: { name: "Bank of Montreal", logo: "https://logo.bankconv.com/bmo.com", country: "Canada" } },
  { pattern: /scotiabank/i, bank: { name: "Scotiabank", logo: "https://logo.bankconv.com/scotiabank.com", country: "Canada" } },
  { pattern: /cibc/i, bank: { name: "CIBC", logo: "https://logo.bankconv.com/cibc.com", country: "Canada" } },
  // Australian Banks
  { pattern: /commonwealth\s*bank|commbank/i, bank: { name: "Commonwealth Bank", logo: "https://logo.bankconv.com/commbank.com.au", country: "Australia" } },
  { pattern: /westpac/i, bank: { name: "Westpac", logo: "https://logo.bankconv.com/westpac.com.au", country: "Australia" } },
  { pattern: /\banz\b/i, bank: { name: "ANZ Bank", logo: "https://logo.bankconv.com/anz.com.au", country: "Australia" } },
  { pattern: /\bnab\b|national\s*australia/i, bank: { name: "NAB", logo: "https://logo.bankconv.com/nab.com.au", country: "Australia" } },
  // Asian Banks
  { pattern: /\bdbs\b/i, bank: { name: "DBS Bank", logo: "https://logo.bankconv.com/dbs.com.sg", country: "Singapore" } },
  { pattern: /ocbc/i, bank: { name: "OCBC Bank", logo: "https://logo.bankconv.com/ocbc.com", country: "Singapore" } },
  { pattern: /mizuho/i, bank: { name: "Mizuho Bank", logo: "https://logo.bankconv.com/mizuhobank.com", country: "Japan" } },
  { pattern: /mufg|mitsubishi\s*ufj/i, bank: { name: "MUFG Bank", logo: "https://logo.bankconv.com/mufg.jp", country: "Japan" } },
  { pattern: /sumitomo/i, bank: { name: "Sumitomo Mitsui", logo: "https://logo.bankconv.com/smbc.co.jp", country: "Japan" } },
  { pattern: /icbc/i, bank: { name: "ICBC", logo: "https://logo.bankconv.com/icbc.com.cn", country: "China" } },
  { pattern: /bank\s*of\s*china/i, bank: { name: "Bank of China", logo: "https://logo.bankconv.com/boc.cn", country: "China" } },
  // Fintech/Neobanks
  { pattern: /\bn26\b/i, bank: { name: "N26", logo: "https://logo.bankconv.com/n26.com", country: "Germany" } },
  { pattern: /wise|transferwise/i, bank: { name: "Wise", logo: "https://logo.bankconv.com/wise.com", country: "UK" } },
  { pattern: /paypal/i, bank: { name: "PayPal", logo: "https://logo.bankconv.com/paypal.com", country: "USA" } },
  { pattern: /stripe/i, bank: { name: "Stripe", logo: "https://logo.bankconv.com/stripe.com", country: "USA" } },
  { pattern: /chime/i, bank: { name: "Chime", logo: "https://logo.bankconv.com/chime.com", country: "USA" } },
  { pattern: /sofi/i, bank: { name: "SoFi", logo: "https://logo.bankconv.com/sofi.com", country: "USA" } },
];

// Portfolio holding type
interface Holding {
  asset: string;
  symbol: string;
  quantity: number;
  value: number;
  change24h: number;
  allocation: number;
}

export default function WithdrawPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Common state
  const [withdrawalType, setWithdrawalType] = useState<WithdrawalType>(null);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Portfolio state for available balances
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loadingHoldings, setLoadingHoldings] = useState(true);

  // Crypto withdrawal state
  const [selectedAsset, setSelectedAsset] = useState<typeof CRYPTO_ASSETS[0] | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);

  // Fiat withdrawal state
  const [selectedCurrency, setSelectedCurrency] = useState<typeof FIAT_CURRENCIES[0] | null>(null);
  const [fiatAmount, setFiatAmount] = useState("");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [bankLogoError, setBankLogoError] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountName: "",        // Required - beneficiary name
    accountNumber: "",      // Required - account number or IBAN
    bankCode: "",           // Required - SWIFT/BIC or Routing Number
  });

  // Fetch portfolio holdings
  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const response = await fetch('/api/portfolio');
        if (response.ok) {
          const data = await response.json();
          setHoldings(data.holdings || []);
        }
      } catch (error) {
        console.error('Failed to fetch holdings:', error);
      } finally {
        setLoadingHoldings(false);
      }
    };

    if (status === 'authenticated') {
      fetchHoldings();
    }
  }, [status]);

  useEffect(() => {
    setMounted(true);
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Get available balance for selected asset
  const getAvailableBalance = (symbol: string): number => {
    const holding = holdings.find(h =>
      h.symbol?.toUpperCase() === symbol.toUpperCase() ||
      h.asset?.toUpperCase().startsWith(symbol.toUpperCase())
    );
    return holding?.quantity || 0;
  };

  const availableBalance = selectedAsset ? getAvailableBalance(selectedAsset.symbol) : 0;

  // Handle max button click
  const handleMaxClick = () => {
    if (availableBalance > 0) {
      setCryptoAmount(availableBalance.toString());
    }
  };

  // Detect bank from SWIFT/BIC code or Routing Number
  const detectBank = (): { name: string; logo: string; country: string } | null => {
    if (!bankDetails.bankCode || bankDetails.bankCode.length < 3) return null;

    const codeUpper = bankDetails.bankCode.toUpperCase().replace(/\s/g, '');

    // Try to match as SWIFT/BIC code (8-11 characters, letters and numbers)
    if (codeUpper.length >= 8 && /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(codeUpper)) {
      // Try exact match first
      if (BANK_DATABASE[codeUpper]) {
        return BANK_DATABASE[codeUpper];
      }
      // Try matching first 8 characters (main SWIFT code without branch)
      const swiftBase = codeUpper.substring(0, 8);
      for (const [code, bank] of Object.entries(BANK_DATABASE)) {
        if (code.startsWith(swiftBase) || swiftBase.startsWith(code.substring(0, 8))) {
          return bank;
        }
      }
    }

    // Try to match by name patterns (if user types bank name in the code field)
    for (const { pattern, bank } of BANK_NAME_PATTERNS) {
      if (pattern.test(bankDetails.bankCode)) {
        return bank;
      }
    }

    return null;
  };

  const detectedBank = detectBank();

  // Reset bank logo error when detected bank changes
  useEffect(() => {
    setBankLogoError(false);
  }, [detectedBank?.name]);

  // Reset forms when changing withdrawal type
  useEffect(() => {
    if (withdrawalType === "crypto") {
      setSelectedCurrency(null);
      setFiatAmount("");
      setBankDetails({
        accountName: "",
        accountNumber: "",
        bankCode: "",
      });
    } else if (withdrawalType === "fiat") {
      setSelectedAsset(null);
      setSelectedNetwork(null);
      setWalletAddress("");
      setCryptoAmount("");
    }
  }, [withdrawalType]);

  const handleAssetSelect = (asset: typeof CRYPTO_ASSETS[0]) => {
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

  const handleCurrencySelect = (currency: typeof FIAT_CURRENCIES[0]) => {
    setSelectedCurrency(currency);
    setShowCurrencyDropdown(false);
  };

  const handleSubmitCrypto = async () => {
    if (!selectedAsset || !selectedNetwork || !walletAddress || !cryptoAmount) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setSubmitSuccess(true);
  };

  const handleSubmitFiat = async () => {
    if (!selectedCurrency || !fiatAmount || !bankDetails.accountName || !bankDetails.accountNumber || !bankDetails.bankCode) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setSubmitSuccess(true);
  };

  // Calculate amounts
  const cryptoFee = selectedAsset?.fee || 0;
  const cryptoAmountNum = parseFloat(cryptoAmount) || 0;
  const cryptoReceiveAmount = Math.max(0, cryptoAmountNum - cryptoFee);

  const fiatFee = selectedCurrency?.fee || 0;
  const fiatAmountNum = parseFloat(fiatAmount) || 0;
  const fiatReceiveAmount = Math.max(0, fiatAmountNum - fiatFee);

  // Validation
  const isCryptoValid = selectedAsset && selectedNetwork && walletAddress.length >= 20 && cryptoAmountNum >= (selectedAsset?.minWithdrawal || 0) && cryptoAmountNum <= availableBalance;
  const isFiatValid = selectedCurrency && fiatAmountNum >= (selectedCurrency?.minWithdrawal || 0) && bankDetails.accountName && bankDetails.accountNumber && bankDetails.bankCode;

  const currentNetwork = selectedNetwork ? NETWORKS[selectedNetwork] : null;

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

  // Success state
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-background-main relative pb-[100px] lg:pb-0">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full blur-3xl opacity-10 bg-gradient-radial from-accent-green/20 to-transparent" />
        </div>

        <div className="relative max-w-lg mx-auto px-4 sm:px-6 py-20">
          <div className="bg-background-card/60 backdrop-blur-xl border border-accent-green/20 rounded-3xl p-8 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-accent-green/20 blur-2xl animate-pulse" />
              <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-accent-green to-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-text-primary mb-2">Withdrawal Request Submitted</h1>
            <p className="text-text-secondary mb-6">
              Your withdrawal request has been received and is being processed. You will receive a confirmation email shortly.
            </p>

            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-tertiary">Estimated Processing Time</span>
                <span className="text-text-primary font-medium">
                  {withdrawalType === "crypto" ? currentNetwork?.estimatedTime || "5-30 min" : "1-3 business days"}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/dashboard/transactions"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-text-primary font-medium hover:bg-white/10 transition-all"
              >
                <History className="w-4 h-4" />
                View History
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-medium hover:opacity-90 transition-all"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Link>
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
              href="/dashboard/withdraw"
              className="flex items-center justify-center w-12 h-12 -mt-4 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30"
            >
              <Upload className="w-5 h-5 text-background-main" />
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

  return (
    <div className="min-h-screen bg-background-main relative pb-[100px] lg:pb-0">
      {/* Subtle Background Gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className={`absolute -top-1/2 -right-1/2 w-full h-full rounded-full blur-3xl transition-all duration-1000 ${
            withdrawalType ? 'opacity-10' : 'opacity-5'
          }`}
          style={{
            background: withdrawalType === 'crypto' && selectedAsset
              ? `radial-gradient(circle, ${selectedAsset.color}20 0%, transparent 70%)`
              : withdrawalType === 'fiat'
                ? 'radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, transparent 70%)'
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
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Withdraw Funds</h1>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <Lock className="w-3 h-3 text-primary" />
                  <span className="text-primary text-xs font-medium">Secure</span>
                </div>
              </div>
              <p className="text-text-secondary text-sm mt-1">
                Withdraw crypto or fiat to your preferred destination
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`relative max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        {/* Withdrawal Type Selection */}
        {!withdrawalType && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-text-primary mb-2">Choose Withdrawal Method</h2>
              <p className="text-text-secondary">Select how you'd like to withdraw your funds</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Crypto Option */}
              <button
                onClick={() => setWithdrawalType("crypto")}
                className="group relative bg-background-card/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 text-left hover:border-orange-500/30 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-orange-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-y-1/2 translate-x-1/2" />

                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Bitcoin className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">Crypto Withdrawal</h3>
                  <p className="text-text-secondary text-sm mb-4">
                    Withdraw cryptocurrency to your external wallet address
                  </p>
                  <div className="flex items-center gap-2 text-orange-400 text-sm font-medium">
                    <span>BTC, ETH, SOL & more</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>

              {/* Fiat Option */}
              <button
                onClick={() => setWithdrawalType("fiat")}
                className="group relative bg-background-card/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 text-left hover:border-blue-500/30 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-blue-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-y-1/2 translate-x-1/2" />

                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">Bank Transfer</h3>
                  <p className="text-text-secondary text-sm mb-4">
                    Withdraw fiat currency directly to your bank account
                  </p>
                  <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                    <span>USD, EUR, GBP, CHF</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Crypto Withdrawal Form */}
        {withdrawalType === "crypto" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Column - Selection */}
            <div className="lg:col-span-5 space-y-5">
              {/* Type Switcher */}
              <button
                onClick={() => setWithdrawalType(null)}
                className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change withdrawal method</span>
              </button>

              {/* Step 1: Select Asset */}
              <div className={`relative bg-background-card/60 backdrop-blur-xl border rounded-2xl p-5 transition-all duration-500 ${
                selectedAsset ? 'border-white/20' : 'border-white/10'
              } ${showAssetDropdown ? 'z-20' : 'z-10'}`}>

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    selectedAsset
                      ? 'bg-gradient-to-br from-accent-green to-emerald-600'
                      : 'bg-gradient-to-br from-primary/80 to-primary'
                  }`}>
                    {selectedAsset ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-white font-bold">1</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-text-primary">Select Asset</h2>
                    <p className="text-xs text-text-tertiary">Choose cryptocurrency to withdraw</p>
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

                  {showAssetDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-background-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="max-h-80 overflow-y-auto">
                        {CRYPTO_ASSETS.map((asset, index) => (
                          <button
                            key={asset.symbol}
                            onClick={() => handleAssetSelect(asset)}
                            className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-all duration-200 ${
                              index !== CRYPTO_ASSETS.length - 1 ? 'border-b border-white/5' : ''
                            }`}
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
                            <div className="text-right text-xs text-text-tertiary">
                              <div>Min: {asset.minWithdrawal}</div>
                              <div>Fee: {asset.fee}</div>
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
                !selectedAsset ? 'opacity-40 pointer-events-none' : selectedNetwork ? 'border-white/20' : 'border-white/10'
              } ${showNetworkDropdown ? 'z-20' : 'z-0'}`}>

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    selectedNetwork
                      ? 'bg-gradient-to-br from-accent-green to-emerald-600'
                      : selectedAsset
                        ? 'bg-gradient-to-br from-primary/80 to-primary'
                        : 'bg-white/10'
                  }`}>
                    {selectedNetwork ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span className={`font-bold ${selectedAsset ? 'text-white' : 'text-text-tertiary'}`}>2</span>
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
                          <Banknote className="w-3.5 h-3.5" />
                          <span className="text-xs">Network Fee</span>
                        </div>
                        <p className="text-text-primary font-semibold">{selectedAsset?.fee} {selectedAsset?.symbol}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Withdrawal Details */}
            <div className="lg:col-span-7">
              <div className={`relative bg-background-card/60 backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-500 ${
                selectedNetwork ? 'border-white/20' : 'border-white/10'
              }`}>
                {/* Header Gradient Bar */}
                {selectedAsset && (
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
                        walletAddress && cryptoAmount
                          ? 'bg-gradient-to-br from-accent-gold to-amber-600'
                          : 'bg-white/10'
                      }`}>
                        {walletAddress && cryptoAmount ? (
                          <Sparkles className="w-5 h-5 text-white" />
                        ) : (
                          <span className="text-text-tertiary font-bold">3</span>
                        )}
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-text-primary">Withdrawal Details</h2>
                        <p className="text-xs text-text-tertiary">Enter address and amount</p>
                      </div>
                    </div>
                  </div>

                  {selectedNetwork ? (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {/* Wallet Address Input */}
                      <div>
                        <label className="block text-sm text-text-secondary mb-2">
                          Recipient Wallet Address
                        </label>
                        <input
                          type="text"
                          value={walletAddress}
                          onChange={(e) => setWalletAddress(e.target.value)}
                          placeholder={`Enter ${selectedNetwork} wallet address`}
                          className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-text-primary font-mono text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>

                      {/* Amount Input */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-text-secondary">
                            Amount
                          </label>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-text-tertiary">
                              Min: {selectedAsset?.minWithdrawal} {selectedAsset?.symbol}
                            </span>
                          </div>
                        </div>

                        {/* Available Balance Display */}
                        <div className="flex items-center justify-between mb-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-text-tertiary" />
                            <span className="text-sm text-text-secondary">Available Balance</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-text-primary">
                              {loadingHoldings ? (
                                <span className="text-text-tertiary">Loading...</span>
                              ) : (
                                `${availableBalance.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${selectedAsset?.symbol}`
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={handleMaxClick}
                              disabled={availableBalance <= 0}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                                availableBalance > 0
                                  ? 'bg-primary/20 text-primary hover:bg-primary/30'
                                  : 'bg-white/5 text-text-tertiary cursor-not-allowed'
                              }`}
                            >
                              MAX
                            </button>
                          </div>
                        </div>

                        <div className="relative">
                          <input
                            type="number"
                            value={cryptoAmount}
                            onChange={(e) => setCryptoAmount(e.target.value)}
                            placeholder="0.00"
                            step="any"
                            max={availableBalance}
                            className="w-full px-4 py-4 pr-24 bg-white/5 border border-white/10 rounded-xl text-text-primary text-lg font-semibold placeholder:text-text-tertiary focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <img src={selectedAsset?.icon} alt="" className="w-5 h-5 rounded-full" />
                            <span className="text-text-secondary font-medium">{selectedAsset?.symbol}</span>
                          </div>
                        </div>

                        {/* Insufficient balance warning */}
                        {cryptoAmountNum > availableBalance && availableBalance > 0 && (
                          <p className="mt-2 text-xs text-accent-red flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Insufficient balance. You only have {availableBalance} {selectedAsset?.symbol} available.
                          </p>
                        )}
                      </div>

                      {/* Summary */}
                      {cryptoAmountNum > 0 && (
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-text-tertiary">Withdrawal Amount</span>
                            <span className="text-text-primary">{cryptoAmountNum} {selectedAsset?.symbol}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-text-tertiary">Network Fee</span>
                            <span className="text-text-secondary">-{cryptoFee} {selectedAsset?.symbol}</span>
                          </div>
                          <div className="h-px bg-white/10" />
                          <div className="flex items-center justify-between">
                            <span className="text-text-secondary font-medium">You will receive</span>
                            <span className="text-accent-green font-bold text-lg">{cryptoReceiveAmount.toFixed(8)} {selectedAsset?.symbol}</span>
                          </div>
                        </div>
                      )}

                      {/* Warning */}
                      <div className="relative bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                        <div className="flex gap-3 pl-2">
                          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-amber-400 font-semibold text-sm mb-2">Important Notice</p>
                            <ul className="text-amber-500/90 text-sm space-y-1.5">
                              <li className="flex items-start gap-2">
                                <span className="text-amber-500 mt-1.5">•</span>
                                Verify the address supports <strong className="text-amber-400">{selectedNetwork}</strong> network
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-amber-500 mt-1.5">•</span>
                                Withdrawals cannot be reversed once confirmed
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        onClick={handleSubmitCrypto}
                        disabled={!isCryptoValid || isSubmitting}
                        className={`w-full py-4 rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-center gap-2 ${
                          isCryptoValid && !isSubmitting
                            ? 'bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-90'
                            : 'bg-white/5 text-text-tertiary cursor-not-allowed'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            Withdraw {selectedAsset?.symbol}
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
                        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10">
                          <Wallet className="w-12 h-12 text-text-tertiary" />
                        </div>
                      </div>
                      <p className="text-text-secondary font-medium mb-2">
                        Select an asset and network
                      </p>
                      <p className="text-text-tertiary text-sm max-w-xs">
                        Choose your cryptocurrency and network to proceed with withdrawal
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-5 relative bg-gradient-to-br from-accent-green/5 to-accent-green/[0.02] backdrop-blur-xl border border-accent-green/10 rounded-2xl p-5 overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5">
                  <Shield className="w-32 h-32 text-accent-green" />
                </div>

                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-green/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-accent-green" />
                  </div>
                  <div>
                    <h3 className="text-text-primary font-semibold mb-1">Secure Withdrawals</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      All withdrawals are processed through our secure multi-signature system
                      with enterprise-grade encryption and verification protocols.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fiat Withdrawal Form */}
        {withdrawalType === "fiat" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Column - Currency & Amount */}
            <div className="lg:col-span-5 space-y-5">
              {/* Type Switcher */}
              <button
                onClick={() => setWithdrawalType(null)}
                className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change withdrawal method</span>
              </button>

              {/* Currency Selection */}
              <div className={`relative bg-background-card/60 backdrop-blur-xl border rounded-2xl p-5 transition-all duration-500 ${
                selectedCurrency ? 'border-white/20' : 'border-white/10'
              } ${showCurrencyDropdown ? 'z-20' : 'z-10'}`}>

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    selectedCurrency
                      ? 'bg-gradient-to-br from-accent-green to-emerald-600'
                      : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  }`}>
                    {selectedCurrency ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-white font-bold">1</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-text-primary">Select Currency</h2>
                    <p className="text-xs text-text-tertiary">Choose fiat currency</p>
                  </div>
                </div>

                {/* Currency Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                      showCurrencyDropdown
                        ? 'bg-white/10 border-primary/50 ring-2 ring-primary/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                    } border`}
                  >
                    {selectedCurrency ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <span className="text-blue-400 font-bold text-lg">{selectedCurrency.symbol}</span>
                        </div>
                        <div className="text-left">
                          <p className="text-text-primary font-semibold">{selectedCurrency.code}</p>
                          <p className="text-text-tertiary text-sm">{selectedCurrency.name}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <Banknote className="w-5 h-5 text-text-tertiary" />
                        </div>
                        <span className="text-text-secondary">Choose currency</span>
                      </div>
                    )}
                    <ChevronDown className={`w-5 h-5 text-text-secondary transition-transform duration-300 ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showCurrencyDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-background-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {FIAT_CURRENCIES.map((currency, index) => (
                        <button
                          key={currency.code}
                          onClick={() => handleCurrencySelect(currency)}
                          className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-all duration-200 ${
                            index !== FIAT_CURRENCIES.length - 1 ? 'border-b border-white/5' : ''
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="text-blue-400 font-bold">{currency.symbol}</span>
                          </div>
                          <div className="text-left flex-1">
                            <p className="text-text-primary font-semibold">{currency.code}</p>
                            <p className="text-text-tertiary text-sm">{currency.name}</p>
                          </div>
                          <div className="text-right text-xs text-text-tertiary">
                            <div>Min: {currency.symbol}{currency.minWithdrawal}</div>
                            <div>Fee: {currency.symbol}{currency.fee}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Amount Input */}
              <div className={`relative bg-background-card/60 backdrop-blur-xl border rounded-2xl p-5 transition-all duration-500 ${
                !selectedCurrency ? 'opacity-40 pointer-events-none' : fiatAmount ? 'border-white/20' : 'border-white/10'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    fiatAmount
                      ? 'bg-gradient-to-br from-accent-green to-emerald-600'
                      : selectedCurrency
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        : 'bg-white/10'
                  }`}>
                    {fiatAmount ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span className={`font-bold ${selectedCurrency ? 'text-white' : 'text-text-tertiary'}`}>2</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-text-primary">Enter Amount</h2>
                    <p className="text-xs text-text-tertiary">Minimum: {selectedCurrency?.symbol}{selectedCurrency?.minWithdrawal}</p>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    value={fiatAmount}
                    onChange={(e) => setFiatAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-4 pr-20 bg-white/5 border border-white/10 rounded-xl text-text-primary text-xl font-semibold placeholder:text-text-tertiary focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <span className="text-text-secondary font-bold text-lg">{selectedCurrency?.code}</span>
                  </div>
                </div>

                {/* Summary */}
                {fiatAmountNum > 0 && selectedCurrency && (
                  <div className="mt-4 bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-tertiary">Withdrawal Amount</span>
                      <span className="text-text-primary">{selectedCurrency.symbol}{fiatAmountNum.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-tertiary">Processing Fee</span>
                      <span className="text-text-secondary">-{selectedCurrency.symbol}{fiatFee.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary font-medium">You will receive</span>
                      <span className="text-accent-green font-bold text-lg">{selectedCurrency.symbol}{fiatReceiveAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Processing Time Info */}
              <div className="relative bg-background-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                    Processing Info
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 text-text-tertiary mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs">Processing Time</span>
                    </div>
                    <p className="text-text-primary font-semibold">1-3 Business Days</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 text-text-tertiary mb-1">
                      <Globe className="w-3.5 h-3.5" />
                      <span className="text-xs">Transfer Method</span>
                    </div>
                    <p className="text-text-primary font-semibold">SWIFT/Wire</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Bank Details */}
            <div className="lg:col-span-7">
              <div className={`relative bg-background-card/60 backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-500 ${
                selectedCurrency ? 'border-white/20' : 'border-white/10'
              }`}>
                {/* Header Gradient Bar */}
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />

                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                        bankDetails.accountName && bankDetails.accountNumber && bankDetails.bankCode
                          ? 'bg-gradient-to-br from-accent-gold to-amber-600'
                          : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}>
                        {bankDetails.accountName && bankDetails.accountNumber && bankDetails.bankCode ? (
                          <Sparkles className="w-5 h-5 text-white" />
                        ) : (
                          <span className="text-white font-bold">3</span>
                        )}
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-text-primary">Bank Account Details</h2>
                        <p className="text-xs text-text-tertiary">Enter your bank information</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Bank Code - SWIFT/BIC or Routing Number (FIRST) */}
                    <div>
                      <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                        <Globe className="w-4 h-4" />
                        SWIFT/BIC or Routing Number *
                      </label>
                      <input
                        type="text"
                        value={bankDetails.bankCode}
                        onChange={(e) => setBankDetails({...bankDetails, bankCode: e.target.value})}
                        placeholder="e.g., CHASUS33 or 021000021"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <p className="text-xs text-text-tertiary mt-1.5">SWIFT/BIC code for international transfers, or 9-digit routing number for US banks</p>
                    </div>

                    {/* Detected Bank Card - Shows when bank is identified (RIGHT AFTER SWIFT) */}
                    {detectedBank && (
                      <div className="relative overflow-hidden bg-gradient-to-r from-accent-green/10 to-accent-green/5 border border-accent-green/20 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-accent-green/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center p-2 shadow-lg overflow-hidden">
                            {!bankLogoError ? (
                              <img
                                src={detectedBank.logo}
                                alt={detectedBank.name}
                                className="w-full h-full object-contain"
                                onError={() => setBankLogoError(true)}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-green to-emerald-600 rounded-lg">
                                <Building2 className="w-7 h-7 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="w-4 h-4 text-accent-green" />
                              <span className="text-accent-green text-xs font-semibold uppercase tracking-wide">Bank Identified</span>
                            </div>
                            <p className="text-text-primary font-semibold text-lg">{detectedBank.name}</p>
                            <p className="text-text-tertiary text-sm">{detectedBank.country}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Account Holder Name */}
                    <div>
                      <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                        <User className="w-4 h-4" />
                        Account Holder Name *
                      </label>
                      <input
                        type="text"
                        value={bankDetails.accountName}
                        onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                        placeholder="Full name as it appears on your bank account"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>

                    {/* Account Number / IBAN */}
                    <div>
                      <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                        <Hash className="w-4 h-4" />
                        Account Number / IBAN *
                      </label>
                      <input
                        type="text"
                        value={bankDetails.accountNumber}
                        onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                        placeholder="Account number or IBAN (e.g., GB82WEST12345698765432)"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <p className="text-xs text-text-tertiary mt-1.5">Enter your account number (US) or IBAN (International)</p>
                    </div>

                    {/* Info Note */}
                    <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                      <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-300/90">
                        <p className="font-medium text-blue-400 mb-1">Bank Transfer Information</p>
                        <p>For US transfers, use your routing number (9 digits). For international SWIFT transfers, use your BIC code (8-11 characters). The bank will be automatically identified when possible.</p>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmitFiat}
                      disabled={!isFiatValid || isSubmitting}
                      className={`w-full py-4 rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-center gap-2 ${
                        isFiatValid && !isSubmitting
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90'
                          : 'bg-white/5 text-text-tertiary cursor-not-allowed'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Building2 className="w-5 h-5" />
                          Withdraw to Bank
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-5 relative bg-gradient-to-br from-blue-500/5 to-blue-500/[0.02] backdrop-blur-xl border border-blue-500/10 rounded-2xl p-5 overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5">
                  <Shield className="w-32 h-32 text-blue-400" />
                </div>

                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-text-primary font-semibold mb-1">Bank-Grade Security</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      Your bank details are encrypted and securely processed through our
                      regulated banking partners with full compliance to financial regulations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
            href="/dashboard/withdraw"
            className="flex items-center justify-center w-12 h-12 -mt-4 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30"
          >
            <Upload className="w-5 h-5 text-background-main" />
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
