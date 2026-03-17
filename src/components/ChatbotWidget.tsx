import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
    id: string;
    role: 'bot' | 'user';
    text: string;
    choices?: string[];
    profiles?: MatchedProfile[];
    timestamp: Date;
}

interface Preferences {
    gender?: string;
    minAge?: number;
    maxAge?: number;
    location?: string;
    education?: string;
    familyValues?: string;
}

interface MatchedProfile {
    _id: string;
    id?: string;
    fullName: string;
    age: number;
    photos: string[];
    profession: string;
    location?: { city: string; state: string };
    education: string;
    isVerified: boolean;
}

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
    {
        key: 'gender',
        question: "I'm **Shubh Vivah AI** — your personal matchmaking guide.\n\nWho are you looking for today?",
        icon: '💑',
        choices: ['👨 Groom', '👰 Bride', '🌈 Any Gender'],
        extract: (ans: string) => {
            if (ans.includes('Groom')) return { gender: 'Male' };
            if (ans.includes('Bride')) return { gender: 'Female' };
            return { gender: undefined };
        },
    },
    {
        key: 'ageRange',
        question: 'What age range are you looking for?',
        icon: '🎂',
        choices: ['18 – 25 yrs', '26 – 30 yrs', '31 – 35 yrs', '36 – 40 yrs', '40+ yrs', 'Any Age'],
        extract: (ans: string) => {
            if (ans.includes('18')) return { minAge: 18, maxAge: 25 };
            if (ans.includes('26')) return { minAge: 26, maxAge: 30 };
            if (ans.includes('31')) return { minAge: 31, maxAge: 35 };
            if (ans.includes('36')) return { minAge: 36, maxAge: 40 };
            if (ans.includes('40+')) return { minAge: 40, maxAge: 99 };
            return { minAge: 18, maxAge: 99 };
        },
    },
    {
        key: 'location',
        question: 'Any preferred city or location?',
        icon: '📍',
        choices: ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Any City'],
        extract: (ans: string) => {
            if (ans === 'Any City') return { location: undefined };
            return { location: ans };
        },
    },
    {
        key: 'education',
        question: 'Preferred education level?',
        icon: '🎓',
        choices: ['Graduate', 'Post Graduate', 'Doctorate', 'Professional Degree', 'Any Level'],
        extract: (ans: string) => {
            if (ans === 'Any Level') return { education: undefined };
            return { education: ans };
        },
    },
    {
        key: 'familyValues',
        question: 'What family values matter most to you?',
        icon: '🏡',
        choices: ['Traditional', 'Moderate', 'Liberal', 'No Preference'],
        extract: (ans: string) => {
            if (ans === 'No Preference') return { familyValues: undefined };
            return { familyValues: ans };
        },
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2);

const formatMessage = (text: string) =>
    text.split('**').map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
    );

// ─── Component ────────────────────────────────────────────────────────────────
export const ChatbotWidget = () => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [step, setStep] = useState(0);
    const [prefs, setPrefs] = useState<Preferences>({});
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [showLabel, setShowLabel] = useState(true);
    const [entered, setEntered] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Hide FAB label after 6s
    useEffect(() => {
        const t = setTimeout(() => setShowLabel(false), 6000);
        return () => clearTimeout(t);
    }, []);

    // Scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Entrance animation
    useEffect(() => {
        if (open) setTimeout(() => setEntered(true), 30);
        else setEntered(false);
    }, [open]);

    // Initialize chat
    useEffect(() => {
        if (open && messages.length === 0) {
            setTimeout(() => {
                setMessages([{
                    id: uid(),
                    role: 'bot',
                    text: STEPS[0].question,
                    choices: STEPS[0].choices,
                    timestamp: new Date(),
                }]);
            }, 350);
        }
    }, [open]);

    const pushBot = (text: string, choices?: string[], profiles?: MatchedProfile[]) =>
        setMessages(prev => [...prev, { id: uid(), role: 'bot', text, choices, profiles, timestamp: new Date() }]);

    const pushUser = (text: string) =>
        setMessages(prev => [...prev, { id: uid(), role: 'user', text, timestamp: new Date() }]);

    const killChoices = () =>
        setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, choices: undefined } : m));

    const handleChoice = async (choice: string) => {
        if (loading || done) return;
        killChoices();
        pushUser(choice);

        const extracted = STEPS[step].extract(choice);
        const newPrefs = { ...prefs, ...extracted };
        setPrefs(newPrefs);
        const next = step + 1;

        if (next < STEPS.length) {
            setStep(next);
            setTimeout(() => pushBot(STEPS[next].question, STEPS[next].choices), 520);
        } else {
            setStep(next);
            setLoading(true);
            setTimeout(() => pushBot('Searching for your ideal matches…'), 520);

            try {
                const params: Record<string, unknown> = {};
                if (newPrefs.gender) params.gender = newPrefs.gender;
                if (newPrefs.minAge) params.minAge = newPrefs.minAge;
                if (newPrefs.maxAge) params.maxAge = newPrefs.maxAge;
                if (newPrefs.location) params.location = newPrefs.location;
                if (newPrefs.education) params.education = newPrefs.education;
                if (newPrefs.familyValues) params.familyValues = newPrefs.familyValues;

                const data = await profileService.getProfiles(params);
                const profiles: MatchedProfile[] = Array.isArray(data) ? data : data.profiles ?? [];
                setLoading(false);
                setDone(true);

                if (profiles.length === 0) {
                    setTimeout(() => pushBot("No exact matches found — showing you profiles you might love!"), 700);
                    const fallbackData = await profileService.getProfiles({ limit: 6 });
                    const fallback: MatchedProfile[] = (Array.isArray(fallbackData) ? fallbackData : fallbackData.profiles ?? []).slice(0, 6);
                    setTimeout(() => {
                        pushBot(`Here are **${fallback.length} handpicked profiles** for you:`, undefined, fallback);
                        setTimeout(() => pushBot('Want to refine your search?', ['🔄 Start Over', '🔍 Browse Search']), 700);
                    }, 800);
                } else {
                    const shown = profiles.slice(0, 6);
                    setTimeout(() => {
                        pushBot(`Found **${profiles.length} compatible matches**! Here are the top picks:`, undefined, shown);
                        setTimeout(() => pushBot('Would you like to do anything else?', ['🔄 Start Over', '🔍 Browse Search']), 700);
                    }, 700);
                }
            } catch {
                setLoading(false);
                setDone(true);
                setTimeout(() => pushBot('Something went wrong. Please try again.', ['🔄 Try Again']), 700);
            }
        }
    };

    const handleAction = (choice: string) => {
        killChoices();
        pushUser(choice);
        if (choice.includes('Start Over') || choice.includes('Try Again')) {
            setTimeout(() => {
                setStep(0); setPrefs({}); setDone(false); setMessages([]);
                setTimeout(() => setMessages([{
                    id: uid(), role: 'bot',
                    text: STEPS[0].question, choices: STEPS[0].choices,
                    timestamp: new Date(),
                }]), 320);
            }, 420);
        } else if (choice.includes('Browse Search')) {
            setTimeout(() => { setOpen(false); navigate('/search'); }, 420);
        }
    };

    const isActionMsg = (m: Message) =>
        done && m.choices?.some(c => ['🔄 Start Over', '🔍 Browse Search', '🔄 Try Again'].includes(c));

    const progressPct = Math.min((step / STEPS.length) * 100, 100);
    const currentStepIcon = step < STEPS.length ? STEPS[step].icon : '✨';

    return (
        <>
            {/* ── FAB ── */}
            <div className="cb-fab-wrap">
                {showLabel && !open && (
                    <div className="cb-fab-label">Find your perfect match ✨</div>
                )}
                <button
                    id="chatbot-toggle-btn"
                    className={`cb-fab ${open ? 'cb-fab--open' : ''}`}
                    onClick={() => setOpen(o => !o)}
                    aria-label="Open Shubh Vivah AI matchmaking chatbot"
                >
                    <span className={`cb-fab-inner ${open ? 'cb-fab-inner--open' : ''}`}>
                        {open ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        ) : (
                            <span className="cb-fab-emoji">💘</span>
                        )}
                    </span>
                    {!open && <span className="cb-fab-ring" />}
                    {!open && <span className="cb-fab-ring cb-fab-ring--2" />}
                </button>
            </div>

            {/* ── Chat window ── */}
            {open && (
                <div className={`cb-window ${entered ? 'cb-window--in' : ''}`} id="chatbot-window">

                    {/* Header */}
                    <div className="cb-header">
                        <div className="cb-header-glow" />
                        <div className="cb-header-left">
                            <div className="cb-header-avatar">
                                <span className="cb-header-avatar-emoji">💖</span>
                                <span className="cb-header-dot" />
                            </div>
                            <div>
                                <p className="cb-header-name">Shubh Vivah <span className="cb-header-ai-tag">AI</span></p>
                                <p className="cb-header-sub">
                                    <span className="cb-header-dot-inline" />
                                    Matchmaking Assistant
                                </p>
                            </div>
                        </div>
                        <div className="cb-header-right">
                            <button onClick={() => {
                                setStep(0); setPrefs({}); setDone(false); setMessages([]);
                                setTimeout(() => setMessages([{ id: uid(), role: 'bot', text: STEPS[0].question, choices: STEPS[0].choices, timestamp: new Date() }]), 320);
                            }} className="cb-hdr-btn" title="Restart">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.35" />
                                </svg>
                            </button>
                            <button onClick={() => setOpen(false)} className="cb-hdr-btn" title="Close">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Step progress dots */}
                    {!done && (
                        <div className="cb-steps">
                            {STEPS.map((s, i) => (
                                <div key={s.key} className="cb-step-item">
                                    <div className={`cb-step-dot ${i < step ? 'cb-step-dot--done' : i === step ? 'cb-step-dot--active' : ''}`}>
                                        {i < step ? '✓' : i === step ? currentStepIcon : ''}
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <div className={`cb-step-line ${i < step ? 'cb-step-line--done' : ''}`} />
                                    )}
                                </div>
                            ))}
                            <div className="cb-step-pct">{Math.round(progressPct)}%</div>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="cb-messages">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`cb-row cb-row--${msg.role}`}>
                                {msg.role === 'bot' && (
                                    <div className="cb-bot-ava">💖</div>
                                )}
                                <div className="cb-msg-body">
                                    <div className={`cb-bubble cb-bubble--${msg.role}`}>
                                        {formatMessage(msg.text)}
                                    </div>

                                    {/* Profile grid */}
                                    {msg.profiles && msg.profiles.length > 0 && (
                                        <div className="cb-profiles">
                                            {msg.profiles.map(p => (
                                                <button
                                                    key={p._id || p.id}
                                                    className="cb-pcard"
                                                    onClick={() => { setOpen(false); navigate(`/profile/${p._id || p.id}`); }}
                                                >
                                                    <div className="cb-pcard-photo">
                                                        {p.photos?.[0]
                                                            ? <img src={p.photos[0]} alt={p.fullName} />
                                                            : <span className="cb-pcard-initial">{p.fullName?.charAt(0) ?? '?'}</span>
                                                        }
                                                        <div className="cb-pcard-overlay" />
                                                        {p.isVerified && <span className="cb-pcard-verified">✓</span>}
                                                    </div>
                                                    <div className="cb-pcard-info">
                                                        <p className="cb-pcard-name">{p.fullName}</p>
                                                        <p className="cb-pcard-meta">{p.age} · {p.profession}</p>
                                                        {p.location && <p className="cb-pcard-city">📍 {p.location.city}</p>}
                                                    </div>
                                                    <div className="cb-pcard-arrow">→</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Choices */}
                                    {msg.choices && (
                                        <div className="cb-choices">
                                            {msg.choices.map(c => (
                                                <button
                                                    key={c}
                                                    className="cb-chip"
                                                    onClick={() => isActionMsg(msg) ? handleAction(c) : handleChoice(c)}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Typing */}
                        {loading && (
                            <div className="cb-row cb-row--bot">
                                <div className="cb-bot-ava">💖</div>
                                <div className="cb-msg-body">
                                    <div className="cb-bubble cb-bubble--bot cb-typing">
                                        <span /><span /><span />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Footer */}
                    <div className="cb-footer">
                        <div className="cb-footer-inner">
                            <span className="cb-footer-logo">💖 Shubh Vivah AI</span>
                            <span className="cb-footer-sep">·</span>
                            <span>Tap a choice to continue</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
