import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Send,
  Bot,
  User,
  Wrench,
  Zap,
  Home,
  Car,
  Loader2,
  Check,
  Phone,
  MapPin,
  Star,
  BadgePercent,
  Clock,
  Briefcase,
  Calendar,
  X,
  ClipboardList,
  AlertCircle,
  WifiOff,
  RefreshCw,
  Search,
  Users,
  Globe,
  TrendingUp,
  CheckCircle,
  UtensilsCrossed,
  Hammer,
  Paintbrush,
  Shield,
} from "lucide-react";

// ============== Types ==============

interface Worker {
  naam?: string;
  name?: string;
  skill?: string;
  area?: string;
  city?: string;
  country?: string;
  rate?: string | number;
  price?: string | number;
  rating?: string | number;
  phone?: string;
  contact?: string;
  experience?: string | number;
  match_score?: number;
}

interface BookingWorker {
  name?: string;
  naam?: string;
  area?: string;
  city?: string;
  country?: string;
  skill?: string;
  price?: string | number;
  rate?: string | number;
  rating?: string | number;
  phone?: string;
  contact?: string;
}

interface BookingCard {
  worker: BookingWorker;
  status: "pending" | "confirmed";
  rated?: boolean;
}

interface Booking {
  booking_id: string;
  worker_name: string;
  skill?: string;
  city?: string;
  country?: string;
  status: "confirmed" | "cancelled";
  date?: string;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  quickReplies?: string[];
  workers: Worker[];
  bookingCard?: BookingCard;
  error?: boolean;
  canRetry?: boolean;
}

interface ApiError {
  type: "network" | "timeout" | "server" | "unknown";
  message: string;
}

// ============== Utilities ==============

const API_TIMEOUT = 90000;

async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), API_TIMEOUT);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    if (err instanceof Error && err.name === "AbortError")
      throw {
        type: "timeout",
        message: "Request timed out. Please try again.",
      } as ApiError;
    if (!navigator.onLine)
      throw {
        type: "network",
        message: "No internet connection. Please check your network.",
      } as ApiError;
    throw {
      type: "network",
      message: "Connection failed. Please try again.",
    } as ApiError;
  }
}

function extractWorkers(data: Record<string, unknown>): Worker[] {
  const tryExtract = (obj: unknown): Worker[] | null => {
    if (
      obj &&
      typeof obj === "object" &&
      Array.isArray((obj as Record<string, unknown>).workers)
    ) {
      const w = (obj as Record<string, unknown>).workers as Worker[];
      if (w.length > 0) return w;
    }
    return null;
  };
  return (
    tryExtract(data) ||
    tryExtract(data.data) ||
    tryExtract(data.result) ||
    tryExtract(data.response) ||
    []
  );
}

function getWorkerName(w: Worker | BookingWorker): string {
  return w.name || w.naam || "Unknown";
}
function getWorkerRate(w: Worker): string {
  const val = w.price || w.rate;
  if (val === undefined || val === null) return "N/A";
  const s = String(val);
  return s.match(/^\d+$/) ? `${s}/day` : s;
}
function getWorkerPhone(w: Worker): string {
  return w.phone || w.contact || "";
}
function getLocationLine(w: Worker): string {
  const parts = [w.area, w.city, w.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Location not specified";
}
function getMatchScore(w: Worker): number | null {
  return typeof w.match_score === "number" ? w.match_score : null;
}
function getExperience(w: Worker): string {
  return w.experience === undefined || w.experience === null
    ? ""
    : `${w.experience} yrs`;
}

// ============== Hooks ==============

function useCountUp(target: number, duration = 1800, trigger = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, trigger]);
  return count;
}

// ============== Sub-components ==============

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 animate-fadeIn">
      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-gray-300" />
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span
              className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
          <span className="text-sm text-gray-400 ml-1">
            RozgarBot is thinking...
          </span>
        </div>
      </div>
    </div>
  );
}

function StatsBanner({ visible }: { visible: boolean }) {
  const workers = useCountUp(2400, 1600, visible);
  const cities = useCountUp(180, 1400, visible);
  const bookings = useCountUp(15000, 2000, visible);

  const stats = [
    { icon: Users, label: "Workers Available", value: workers, suffix: "+" },
    { icon: Globe, label: "Cities Covered", value: cities, suffix: "+" },
    {
      icon: TrendingUp,
      label: "Successful Bookings",
      value: bookings,
      suffix: "+",
    },
  ];

  return (
    <div className="border-b border-gray-800/60 bg-gray-900/40 px-4 py-2.5">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-around sm:justify-center sm:gap-10">
          {stats.map(({ icon: Icon, label, value, suffix }) => (
            <div key={label} className="flex items-center gap-2 group">
              <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-white tabular-nums leading-none">
                  {value.toLocaleString()}
                  {suffix}
                </div>
                <div className="text-xs text-gray-500 leading-tight hidden sm:block">
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SuccessToast({
  type,
  onDone,
}: {
  type: "booking" | "rating";
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="animate-successPop bg-gray-900 border border-emerald-500/40 rounded-2xl px-8 py-6 shadow-2xl shadow-emerald-500/20 flex flex-col items-center gap-3 max-w-xs mx-4">
        <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center animate-successIcon">
          <CheckCircle className="w-9 h-9 text-emerald-400" />
        </div>
        {type === "booking" ? (
          <>
            <p className="text-white font-bold text-lg text-center">
              Booking Confirmed!
            </p>
            <p className="text-gray-400 text-sm text-center">
              The worker will contact you within 30 minutes.
            </p>
          </>
        ) : (
          <>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className="w-5 h-5 text-amber-400 fill-amber-400 animate-starPop"
                  style={{ animationDelay: `${s * 80}ms` }}
                />
              ))}
            </div>
            <p className="text-white font-bold text-lg text-center">
              Thank you for your review!
            </p>
            <p className="text-gray-400 text-sm text-center">
              Your feedback helps others find great workers.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function WorkerCardSkeleton() {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-10 h-10 bg-gray-700 rounded-lg" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-24 bg-gray-700 rounded" />
          <div className="h-3 w-16 bg-gray-700 rounded" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3 w-32 bg-gray-700 rounded" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-3 w-20 bg-gray-700 rounded" />
          <div className="h-3 w-16 bg-gray-700 rounded" />
        </div>
      </div>
      <div className="h-9 bg-gray-700 rounded-lg" />
    </div>
  );
}

function BookingSkeleton() {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-5 w-28 bg-gray-700 rounded" />
          <div className="h-4 w-20 bg-gray-700 rounded" />
          <div className="space-y-2">
            <div className="h-3 w-32 bg-gray-700 rounded" />
            <div className="h-3 w-24 bg-gray-700 rounded" />
          </div>
        </div>
        <div className="h-8 w-20 bg-gray-700 rounded-lg flex-shrink-0" />
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <div className="w-16 h-16 bg-gray-800 border border-gray-700 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-gray-400 text-sm mb-5 max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          <RefreshCw className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

const WorkerCard = ({
  worker,
  onBook,
}: {
  worker: Worker;
  onBook: () => void;
}) => {
  const score = getMatchScore(worker);
  return (
    <div className="bg-gray-800/80 border border-gray-700 hover:border-amber-500/40 rounded-xl p-4 transition-all duration-300 relative overflow-hidden animate-fadeIn hover:shadow-lg hover:shadow-amber-500/5">
      {score !== null && (
        <div className="absolute top-3 right-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <BadgePercent className="w-3 h-3" />
          {Math.round(score)}% Match
        </div>
      )}
      <div className="flex items-center gap-2.5 mb-3 pr-20">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/25 rounded-lg flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-5 h-5 text-amber-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">
            {getWorkerName(worker)}
          </p>
          <p className="text-xs text-amber-400 font-medium truncate">
            {worker.skill}
          </p>
        </div>
      </div>
      <div className="flex items-start gap-2 text-xs text-gray-400 mb-2.5">
        <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
        <span className="line-clamp-1">{getLocationLine(worker)}</span>
      </div>
      <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-500 font-medium">$</span>
          <span className="text-gray-300">{getWorkerRate(worker)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span className="text-gray-300">{worker.rating ?? "N/A"}/5</span>
        </div>
        {getExperience(worker) && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="text-gray-300">{getExperience(worker)} exp</span>
          </div>
        )}
        {getWorkerPhone(worker) && (
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="text-gray-300 truncate">
              {getWorkerPhone(worker)}
            </span>
          </div>
        )}
      </div>
      <button
        onClick={onBook}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2 focus:ring-offset-gray-800 active:scale-95"
        aria-label={`Book ${getWorkerName(worker)}`}
      >
        Book Now
      </button>
    </div>
  );
};

// ============== Main App ==============

function App() {
  const [userName, setUserName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [bookingsError, setBookingsError] = useState<ApiError | null>(null);

  const [ratingMessageId, setRatingMessageId] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [successToast, setSuccessToast] = useState<"booking" | "rating" | null>(
    null,
  );
  const [statsVisible, setStatsVisible] = useState(false);
  const [showWakingUp, setShowWakingUp] = useState(false);

  const defaultQuickActions = [
    { text: "Find a Plumber", icon: Wrench },
    { text: "Need an Electrician", icon: Zap },
    { text: "Book a Maid", icon: Home },
    { text: "Hire a Driver", icon: Car },
    { text: "Find a Cook", icon: UtensilsCrossed },
    { text: "Need a Carpenter", icon: Hammer },
    { text: "Find a Painter", icon: Paintbrush },
    { text: "Hire a Security Guard", icon: Shield },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const t = setTimeout(() => setStatsVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setShowWakingUp(false);
      return;
    }
    const t = setTimeout(() => setShowWakingUp(true), 5000);
    return () => clearTimeout(t);
  }, [isLoading]);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const parseMarkdown = useCallback((text: string) => {
    const parts: React.ReactNode[] = [];
    let key = 0;
    let remaining = text;
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const italicMatch = remaining.match(/\*(.+?)\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0)
          parts.push(
            <span key={key++}>{remaining.slice(0, boldMatch.index)}</span>,
          );
        parts.push(
          <strong key={key++} className="font-semibold">
            {boldMatch[1]}
          </strong>,
        );
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      } else if (italicMatch && italicMatch.index !== undefined) {
        if (italicMatch.index > 0)
          parts.push(
            <span key={key++}>{remaining.slice(0, italicMatch.index)}</span>,
          );
        parts.push(
          <em key={key++} className="italic">
            {italicMatch[1]}
          </em>,
        );
        remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
      } else {
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }
    }
    return parts;
  }, []);

  const fetchBookings = useCallback(async () => {
    if (!userName.trim()) return;
    setIsLoadingBookings(true);
    setBookingsError(null);
    try {
      const res = await fetchWithTimeout(
        `https://rozgarbot-api.onrender.com/bookings?user_name=${encodeURIComponent(userName.trim())}`,
      );
      if (!res.ok)
        throw {
          type: "server",
          message: "Failed to load bookings. Please try again.",
        } as ApiError;
      const data = await res.json();
      const list = data.bookings || data.data || data || [];
      setBookings(Array.isArray(list) ? list : []);
    } catch (err) {
      setBookingsError(err as ApiError);
      setBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  }, [userName]);

  const handleCancelBooking = useCallback(
    async (bookingId: string) => {
      setCancellingId(bookingId);
      try {
        await fetchWithTimeout(
          "https://rozgarbot-api.onrender.com/cancel-booking",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ booking_id: bookingId }),
          },
        );
        await fetchBookings();
      } catch {
        /* silent */
      } finally {
        setCancellingId(null);
      }
    },
    [fetchBookings],
  );

  const handleRateWorker = useCallback(
    async (workerName: string) => {
      if (selectedRating === 0 || !ratingMessageId) return;
      setIsSubmittingRating(true);
      try {
        await fetchWithTimeout(
          "https://rozgarbot-api.onrender.com/rate-worker",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              worker_name: workerName,
              user_name: userName.trim(),
              rating: selectedRating,
              review: reviewText.trim(),
            }),
          },
        );
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === ratingMessageId && msg.bookingCard
              ? { ...msg, bookingCard: { ...msg.bookingCard, rated: true } }
              : msg,
          ),
        );
        setSuccessToast("rating");
      } catch {
        /* silent */
      } finally {
        setIsSubmittingRating(false);
        setRatingMessageId(null);
        setSelectedRating(0);
        setReviewText("");
      }
    },
    [selectedRating, ratingMessageId, userName, reviewText],
  );

  const sendMessage = useCallback(
    async (text: string, retryMsgId?: string) => {
      if (!text.trim() || !userName.trim() || !isOnline) return;
      if (!retryMsgId) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            text: text.trim(),
            sender: "user",
            timestamp: new Date(),
            workers: [],
          },
        ]);
      }
      setInputMessage("");
      setIsLoading(true);
      try {
        const res = await fetchWithTimeout(
          "https://rozgarbot-api.onrender.com/chat",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: text.trim(),
              user_name: userName.trim(),
            }),
          },
        );
        if (!res.ok)
          throw {
            type: "server",
            message: "Server error. Please try again later.",
          } as ApiError;
        const data = await res.json();
        const workers = extractWorkers(data);
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            text:
              data.reply ||
              data.response ||
              data.message ||
              "Sorry, I could not process your request.",
            sender: "bot",
            timestamp: new Date(),
            quickReplies: data.quick_replies || [],
            workers,
            bookingCard: data.booking_card || data.bookingCard || undefined,
          },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            text: (err as ApiError).message,
            sender: "bot",
            timestamp: new Date(),
            workers: [],
            error: true,
            canRetry: true,
          },
        ]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [userName, isOnline],
  );

  const handleBooking = useCallback((worker: Worker) => {
    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        text: `Booking request for ${getWorkerName(worker)}!`,
        sender: "bot",
        timestamp: new Date(),
        workers: [],
        bookingCard: {
          worker: {
            name: getWorkerName(worker),
            area: worker.area || "",
            city: worker.city,
            country: worker.country,
            skill: worker.skill,
            price: worker.price || worker.rate,
            rating: worker.rating,
            phone: getWorkerPhone(worker),
          },
          status: "pending",
        },
      },
    ]);
  }, []);

  const handleBookingConfirm = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId && msg.bookingCard
          ? {
              ...msg,
              bookingCard: { ...msg.bookingCard, status: "confirmed" as const },
              text: "Booking confirmed!",
            }
          : msg,
      ),
    );
    setSuccessToast("booking");
  }, []);

  const handleQuickAction = (text: string) => sendMessage(text);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getQuickReplies = useCallback(
    (msg?: Message) =>
      msg?.quickReplies && msg.quickReplies.length > 0
        ? msg.quickReplies
        : defaultQuickActions.map((a) => a.text),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const lastBotMessage = useMemo(
    () => [...messages].reverse().find((m) => m.sender === "bot"),
    [messages],
  );
  const canSend = userName.trim().length > 0 && !isLoading && isOnline;

  const sortedWorkers = useCallback(
    (workers: Worker[]): Worker[] =>
      [...workers].sort(
        (a, b) => (getMatchScore(b) ?? 0) - (getMatchScore(a) ?? 0),
      ),
    [],
  );

  const openBookingsModal = () => {
    setShowBookingsModal(true);
    fetchBookings();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col overflow-x-hidden">
      {/* Success Toast */}
      {successToast && (
        <SuccessToast
          type={successToast}
          onDone={() => setSuccessToast(null)}
        />
      )}

      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-red-500/20 border-b border-red-500/30 px-4 py-2 text-center animate-fadeIn">
          <div className="flex items-center justify-center gap-2 text-red-400 text-sm font-medium">
            <WifiOff className="w-4 h-4" />
            You are offline. Please check your internet connection.
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-950/90 backdrop-blur-xl border-b border-amber-500/20 px-4 py-3 sm:py-4 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25 flex-shrink-0">
                <Wrench className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  RozgarBot
                </h1>
                <p className="text-gray-400 text-xs sm:text-sm tracking-wide hidden sm:block">
                  Your Global Work, Connected by AI
                </p>
              </div>
            </div>
            <button
              onClick={openBookingsModal}
              disabled={!userName.trim()}
              className="flex items-center gap-1.5 sm:gap-2 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700 hover:border-amber-500/40 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-gray-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              aria-label="View my bookings"
            >
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              <span className="text-sm font-medium hidden sm:inline">
                My Bookings
              </span>
            </button>
          </div>
          <div className="mt-3 sm:mt-4">
            <label
              htmlFor="userName"
              className="text-gray-400 text-sm mb-1 block"
            >
              Your Name
            </label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name to get started..."
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
            />
          </div>
        </div>
      </header>

      {/* Stats Banner */}
      <StatsBanner visible={statsVisible} />

      {/* My Bookings Modal */}
      {showBookingsModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bookings-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBookingsModal(false);
          }}
        >
          <div className="bg-gray-900 border-0 sm:border sm:border-gray-700 rounded-none sm:rounded-2xl w-full sm:max-w-2xl max-h-screen sm:max-h-[80vh] flex flex-col shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-800 sticky top-0 bg-gray-900 rounded-t-none sm:rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2
                    id="bookings-title"
                    className="text-lg font-bold text-white leading-tight"
                  >
                    My Bookings
                  </h2>
                  <p className="text-gray-500 text-xs">{userName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowBookingsModal(false)}
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                aria-label="Close bookings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {isLoadingBookings ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <BookingSkeleton key={i} />
                  ))}
                </div>
              ) : bookingsError ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-400 text-sm font-medium">
                        {bookingsError.message}
                      </p>
                      <button
                        onClick={fetchBookings}
                        className="mt-3 flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry
                      </button>
                    </div>
                  </div>
                </div>
              ) : bookings.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="No bookings yet"
                  description="Your confirmed bookings will appear here. Start by finding a worker!"
                  actionLabel="Find Workers"
                  onAction={() => {
                    setShowBookingsModal(false);
                    inputRef.current?.focus();
                  }}
                />
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <div
                      key={booking.booking_id}
                      className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 animate-fadeIn"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs bg-gray-700/80 text-gray-300 px-2 py-0.5 rounded font-mono">
                              {booking.booking_id}
                            </span>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                                booking.status === "confirmed"
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  : "bg-red-500/15 text-red-400 border-red-500/30"
                              }`}
                            >
                              {booking.status}
                            </span>
                          </div>
                          <p className="text-white font-semibold truncate">
                            {booking.worker_name}
                          </p>
                          {booking.skill && (
                            <p className="text-amber-400 text-sm">
                              {booking.skill}
                            </p>
                          )}
                          <div className="text-sm text-gray-400 space-y-1">
                            {(booking.city || booking.country) && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">
                                  {[booking.city, booking.country]
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                              </div>
                            )}
                            {booking.date && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{formatDate(booking.date)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {booking.status === "confirmed" && (
                          <button
                            onClick={() =>
                              handleCancelBooking(booking.booking_id)
                            }
                            disabled={cancellingId === booking.booking_id}
                            className="flex-shrink-0 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                            aria-label={`Cancel booking ${booking.booking_id}`}
                          >
                            {cancellingId === booking.booking_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-900 rounded-b-none sm:rounded-b-2xl">
              <button
                onClick={() => setShowBookingsModal(false)}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Welcome Screen */}
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-8 animate-fadeIn">
              <div className="relative inline-flex mb-6">
                <div className="w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/30">
                  <Bot className="w-10 sm:w-12 h-10 sm:h-12 text-white" />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-gray-950 flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping opacity-75" />
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Welcome to RozgarBot
              </h2>
              <p className="text-gray-400 text-sm sm:text-base mb-3 max-w-md mx-auto px-4">
                AI-powered workforce discovery. Find skilled workers in your
                city in seconds.
              </p>
              <div className="flex items-center justify-center gap-2 mb-8">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-emerald-400 text-xs font-medium">
                  Online & Ready
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto px-2">
                {defaultQuickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.text}
                      onClick={() => handleQuickAction(action.text)}
                      disabled={!canSend}
                      className="flex items-center gap-3 bg-gray-800/60 hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/10 border border-gray-700 hover:border-amber-500/40 rounded-xl px-4 py-3.5 text-gray-300 hover:text-white transition-all group disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-500/50 active:scale-98"
                    >
                      <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/20 transition-colors">
                        <Icon className="w-5 h-5 text-amber-500" />
                      </div>
                      <span className="text-sm font-medium text-left">
                        {action.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {!userName.trim() && (
                <div className="mt-6 flex items-center justify-center gap-2 text-amber-400/80 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Enter your name above to get started
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div key={message.id} className="space-y-3 animate-fadeIn">
              <div
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex items-end gap-2 max-w-[90%] sm:max-w-[80%] ${message.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                      message.sender === "user"
                        ? "bg-gradient-to-br from-amber-500 to-orange-600"
                        : "bg-gray-700 border border-gray-600"
                    }`}
                  >
                    {message.sender === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                      message.error
                        ? "bg-red-500/10 border border-red-500/30 text-red-300"
                        : message.sender === "user"
                          ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-br-md shadow-amber-500/10"
                          : "bg-gray-800 text-gray-100 border border-gray-700/60 rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {parseMarkdown(message.text)}
                    </p>
                    <p
                      className={`text-xs mt-1.5 ${
                        message.error
                          ? "text-red-400/60"
                          : message.sender === "user"
                            ? "text-white/60"
                            : "text-gray-500"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Retry on error */}
              {message.error && message.canRetry && (
                <div className="ml-10">
                  <button
                    onClick={() => {
                      const idx = messages.indexOf(message);
                      const prev = idx > 0 ? messages[idx - 1] : null;
                      if (prev?.sender === "user") {
                        setMessages((m) =>
                          m.filter((x) => x.id !== message.id),
                        );
                        sendMessage(prev.text);
                      }
                    }}
                    className="flex items-center gap-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              )}

              {/* Worker Cards */}
              {message.workers && message.workers.length > 0 && (
                <div className="ml-0 sm:ml-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sortedWorkers(message.workers).map((worker, i) => (
                    <WorkerCard
                      key={`${getWorkerName(worker)}-${i}`}
                      worker={worker}
                      onBook={() => handleBooking(worker)}
                    />
                  ))}
                </div>
              )}

              {/* No workers empty state */}
              {message.sender === "bot" &&
                !message.error &&
                message.workers?.length === 0 &&
                (message.text.toLowerCase().includes("no worker") ||
                  message.text.toLowerCase().includes("not found")) && (
                  <div className="ml-0 sm:ml-10">
                    <EmptyState
                      icon={Search}
                      title="No workers found"
                      description="Try a different skill, city, or check back soon as new workers join daily."
                      actionLabel="Try Again"
                      onAction={() => inputRef.current?.focus()}
                    />
                  </div>
                )}

              {/* Booking Card */}
              {message.sender === "bot" && message.bookingCard && (
                <div className="ml-0 sm:ml-10 space-y-3">
                  <div className="bg-gray-800/80 border border-amber-500/25 rounded-xl p-4 animate-fadeIn shadow-lg shadow-amber-500/5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Wrench className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {message.bookingCard.worker.name ||
                            message.bookingCard.worker.naam}
                        </p>
                        <p className="text-xs text-gray-400">Booking Request</p>
                      </div>
                    </div>

                    <div className="bg-gray-700/30 rounded-lg p-3 space-y-2 mb-4 text-sm">
                      {message.bookingCard.worker.skill && (
                        <div className="text-amber-400 font-medium text-xs uppercase tracking-wide">
                          {message.bookingCard.worker.skill}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span className="text-gray-300 text-xs truncate">
                          {[
                            message.bookingCard.worker.area,
                            message.bookingCard.worker.city,
                            message.bookingCard.worker.country,
                          ]
                            .filter(Boolean)
                            .join(", ") || "Location"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-500">$</span>
                          <span className="text-gray-300">
                            {message.bookingCard.worker.price ||
                              message.bookingCard.worker.rate}
                            /hr
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span className="text-gray-300">
                            {message.bookingCard.worker.rating}/5
                          </span>
                        </div>
                        {(message.bookingCard.worker.phone ||
                          message.bookingCard.worker.contact) && (
                          <div className="flex items-center gap-1.5 col-span-2">
                            <Phone className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <span className="text-gray-300 truncate">
                              {message.bookingCard.worker.phone ||
                                message.bookingCard.worker.contact}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {message.bookingCard.status === "pending" ? (
                      <button
                        onClick={() => handleBookingConfirm(message.id)}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50 active:scale-98 shadow-lg shadow-amber-500/20"
                      >
                        <Check className="w-4 h-4" />
                        Confirm Booking
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-2.5 px-4 rounded-lg text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Confirmed! Worker will contact you within 30 minutes.
                      </div>
                    )}
                  </div>

                  {/* Rate Worker */}
                  {message.bookingCard.status === "confirmed" &&
                    !message.bookingCard.rated && (
                      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 animate-fadeIn">
                        {ratingMessageId === message.id ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Star className="w-4 h-4 text-amber-500" />
                              <p className="text-sm font-semibold text-white">
                                Rate your experience
                              </p>
                            </div>
                            <div
                              className="flex items-center gap-1"
                              role="group"
                              aria-label="Select rating"
                            >
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setSelectedRating(star)}
                                  className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-500/50 rounded"
                                  aria-label={`Rate ${star} stars`}
                                >
                                  <Star
                                    className={`w-8 h-8 transition-all duration-150 ${
                                      star <= selectedRating
                                        ? "text-amber-400 fill-amber-400 scale-110"
                                        : "text-gray-600"
                                    }`}
                                  />
                                </button>
                              ))}
                              {selectedRating > 0 && (
                                <span className="ml-2 text-sm text-amber-400 font-medium">
                                  {
                                    [
                                      "",
                                      "Poor",
                                      "Fair",
                                      "Good",
                                      "Great",
                                      "Excellent",
                                    ][selectedRating]
                                  }
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={reviewText}
                              onChange={(e) => setReviewText(e.target.value)}
                              placeholder="Share your experience (optional)..."
                              className="w-full bg-gray-700/50 border border-gray-600 focus:border-amber-500/50 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setRatingMessageId(null);
                                  setSelectedRating(0);
                                  setReviewText("");
                                }}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() =>
                                  handleRateWorker(
                                    message.bookingCard!.worker.name ||
                                      message.bookingCard!.worker.naam ||
                                      "Unknown",
                                  )
                                }
                                disabled={
                                  selectedRating === 0 || isSubmittingRating
                                }
                                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                              >
                                {isSubmittingRating && (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                )}
                                Submit Review
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRatingMessageId(message.id)}
                            className="w-full bg-gray-700/40 hover:bg-gray-700/70 border border-gray-600 hover:border-amber-500/40 text-gray-300 hover:text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50 group"
                          >
                            <Star className="w-4 h-4 group-hover:text-amber-400 transition-colors" />
                            Rate this Worker
                          </button>
                        )}
                      </div>
                    )}

                  {message.bookingCard.status === "confirmed" &&
                    message.bookingCard.rated && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2 justify-center animate-fadeIn">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <p className="text-sm text-emerald-400 font-medium">
                          Review submitted. Thank you!
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && <TypingIndicator />}
          {isLoading && showWakingUp && (
            <p className="text-gray-500 text-xs text-center animate-fadeIn">
              Server is waking up, please wait a moment...
            </p>
          )}

          {/* Skeleton loaders */}
          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1]?.sender === "user" && (
              <div className="ml-0 sm:ml-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <WorkerCardSkeleton key={i} />
                ))}
              </div>
            )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Quick Replies */}
      {messages.length > 0 && !isLoading && (
        <div className="border-t border-gray-800 bg-gray-950/60 px-4 py-2.5">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {getQuickReplies(lastBotMessage).map((text, i) => (
                <button
                  key={`${text}-${i}`}
                  onClick={() => handleQuickAction(text)}
                  disabled={!canSend}
                  className="flex-shrink-0 bg-gray-800/50 hover:bg-gray-700/60 border border-gray-700 hover:border-amber-500/40 rounded-full px-3 py-1.5 text-gray-400 hover:text-white transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Footer */}
      <footer className="bg-gray-950/90 backdrop-blur-xl border-t border-gray-800 px-4 py-3 sm:py-4 safe-area-bottom">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(inputMessage);
          }}
          className="max-w-3xl mx-auto"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                canSend
                  ? "Ask me to find a worker..."
                  : isOnline
                    ? "Enter your name above to start"
                    : "You are offline"
              }
              disabled={isLoading || !canSend}
              className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/70 transition-all disabled:opacity-50 text-sm sm:text-base"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim() || !canSend}
              className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 active:scale-95"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes successPop {
          0% { opacity: 0; transform: scale(0.7); }
          60% { transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes successIcon {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes starPop {
          0% { transform: scale(0) rotate(-30deg); opacity: 0; }
          70% { transform: scale(1.3) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.3s ease-out forwards; }
        .animate-successPop { animation: successPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-successIcon { animation: successIcon 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.15s both; }
        .animate-starPop { animation: starPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
        .active\\:scale-98:active { transform: scale(0.98); }
        .active\\:scale-95:active { transform: scale(0.95); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .safe-area-bottom { padding-bottom: max(12px, env(safe-area-inset-bottom)); }
      `}</style>
    </div>
  );
}

export default App;
