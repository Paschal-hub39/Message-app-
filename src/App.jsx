import React, { useState, useEffect, useRef, useCallback } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, addDoc, query, orderBy, onSnapshot, where, 
  serverTimestamp, setDoc, doc, updateDoc, limit, getDocs, 
  arrayUnion, arrayRemove, increment, deleteDoc, getDoc,
  writeBatch, Timestamp
} from 'firebase/firestore';
import { 
  Send, MessageSquare, Search, Shield, Radio, Lock, Smile, X, Gift, Plus, 
  Bell, ChevronRight, Flame, Zap, Palette, User, Clock, Trash2, Reply, 
  Heart, Star, Crown, Sparkles, Ghost, Moon, Sun, Pin, Bookmark, Copy,
  Eye, EyeOff, Hash, Trophy, TrendingUp, Users, Type, Volume2,
  Gamepad2, Dice5
} from 'lucide-react';

// --- CONFIG ---
const LOGO_URL = "WA_1775584974117.jpeg";
const HUB_SECRET_KEY = "VORTEX_SECURE_SIGNAL_992";

const encrypt = (text) => {
  if (!text) return "";
  try {
    return btoa(text.split('').map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) ^ HUB_SECRET_KEY.charCodeAt(i % HUB_SECRET_KEY.length))
    ).join(''));
  } catch (e) { return text; }
};

const decrypt = (encoded) => {
  if (!encoded || typeof encoded !== 'string') return "";
  try {
    return atob(encoded).split('').map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) ^ HUB_SECRET_KEY.charCodeAt(i % HUB_SECRET_KEY.length))
    ).join('');
  } catch (e) { return "🔓 [Secure Signal]"; }
};

// --- EMOJIS (150 curated) ---
const EMOJI_LIST = [
  "😂","😎","🥰","😭","🙏","😡","🤣","😌","🤷","😒","💙","😀","😃","😄","😁",
  "😆","😅","😉","😘","😍","😏","😊","🙂","🙃","🥳","🤩","😋","😛","😜","🤪",
  "😔","🥺","🤭","🤫","🤔","🤐","😶","😐","😑","😬","🥱","🤗","😱","🤨","🧐",
  "🙄","😤","😥","😟","🤬","😠","🙁","😕","😰","😨","😧","😦","😮","😫","😣",
  "😖","😳","😲","😯","😵","🥴","🥵","🤢","🥶","🤮","😴","🤑","🤠","😇","🤥",
  "🤒","🤧","🤓","🤡","💩","😈","👿","👻","💀","👾","👽","👺","👹","🤖","☠️",
  "🌚","🌞","🌝","💫","⭐","🌟","✨","⚡","💥","💢","🤍","🖤","🤎","💜","💚",
  "💛","🧡","❤️","💘","💝","💖","💗","💓","💞","💕","💌","🗣️","👤","👥","💋",
  "💔","❣️","💟","👣","💦","🧠","🩸","🦠","🦷","🦴","👀","👍","👎","💪","👏",
  "💅","🙇","🙋","💁","🙆","🙅","🤦","🙍","🧘","🤸","🚶","🏃","🧗","🚵","🚴",
  "🤾","⛹️","🤹","🏌️","🏇","🤺","⛷️","🏂","🪂","🧝","🧞","🧚","🧜","🤽","🏊",
  "🏄","🧙","🧛","🧟","🦸","🦹","🤶","👸","👮","👷","👰","🤵","👼","👶","🧒",
  "🧑","🧓","🧔","👯","🕺","💃","🕴️","👫","👭","👬","💏","🤱","🤰","💑"
];

// --- 25 GIFS (external URLs, no Storage needed) ---
const GIF_LIST = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlUxc2YM1NC6ny8/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26AHONh79u4m5W98s/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKVUn7iM8FMEU24/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l41lTfuxV5F68S96E/giphy.gif",
  "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif",
  "https://media.giphy.com/media/3o7TKTDn976rzVgky4/giphy.gif",
  "https://media.giphy.com/media/l0HlOvJ7yaacpuSas/giphy.gif",
  "https://media.giphy.com/media/26xBwdIuRJiAIqHwA/giphy.gif",
  "https://media.giphy.com/media/3o7TKSha51ATTx9KzC/giphy.gif",
  "https://media.giphy.com/media/l0MYGb1LuZ3n7dRnO/giphy.gif",
  "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
  "https://media.giphy.com/media/3o7TKwmnDgQb5jemjK/giphy.gif",
  "https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif",
  "https://media.giphy.com/media/26xBI73gWquCBBCDe/giphy.gif",
  "https://media.giphy.com/media/3o7TKSha51ATTx9KzC/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif",
  "https://media.giphy.com/media/3o7TKTDn976rzVgky4/giphy.gif",
  "https://media.giphy.com/media/l0HlOvJ7yaacpuSas/giphy.gif",
  "https://media.giphy.com/media/26xBwdIuRJiAIqHwA/giphy.gif",
  "https://media.giphy.com/media/3o7TKwmnDgQb5jemjK/giphy.gif",
  "https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif",
  "https://media.giphy.com/media/26xBI73gWquCBBCDe/giphy.gif"
];

// --- THEMES ---
const THEMES = {
  vortex: "#22c55e",
  cyan: "#06b6d4",
  plasma: "#a855f7",
  gold: "#eab308",
  crimson: "#ef4444",
  neon: "#ff00ff",
  ocean: "#0066ff",
  sunset: "#ff6b35"
};
export default function App() {
  // Core state
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [marketIdeas, setMarketIdeas] = useState([]);
  
  // Input state
  const [newMessage, setNewMessage] = useState("");
  const [newIdea, setNewIdea] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  
  // UI state
  const [activeTab, setActiveTab] = useState("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [keyboardView, setKeyboardView] = useState("none");
  const [replyingTo, setReplyingTo] = useState(null);
  const [reactionId, setReactionId] = useState(null);
  const [burnerMode, setBurnerMode] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // New features state
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [bookmarkedMessages, setBookmarkedMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [messageTimers, setMessageTimers] = useState({});
  const [polls, setPolls] = useState([]);
  const [activePoll, setActivePoll] = useState(null);
  const [streaks, setStreaks] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [chatThemes, setChatThemes] = useState({});
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [messageStats, setMessageStats] = useState({});
  const [chatGames, setChatGames] = useState([]);
  const [activeGame, setActiveGame] = useState(null);
  const [gameScore, setGameScore] = useState(0);
  const [messageOfTheDay, setMessageOfTheDay] = useState("");
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [userRank, setUserRank] = useState(0);
  const [xpPoints, setXpPoints] = useState(0);
  const [badges, setBadges] = useState([]);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [profileCardUser, setProfileCardUser] = useState(null);
  const [chatBackground, setChatBackground] = useState("default");
  const [fontSize, setFontSize] = useState("medium");
  const [messageAnimations, setMessageAnimations] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lastActive, setLastActive] = useState(Date.now());
  const [awayStatus, setAwayStatus] = useState(false);
  
  const scroll = useRef();
  const touchStart = useRef(0);
  const typingTimeout = useRef(null);
  const messageTimeouts = useRef({});

  const themeColor = userData?.theme || THEMES.vortex;

  // Auth effect
  useEffect(() => {
    if ("Notification" in window) Notification.requestPermission();
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // Online status
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    updateDoc(userRef, { status: "online", lastSeen: serverTimestamp() });
    return () => updateDoc(userRef, { status: "offline", lastSeen: serverTimestamp() });
  }, [user]);

  // User data
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setPhoneInput(data.phoneNumber || "");
        setBioInput(data.bio || "");
        setDarkMode(data.darkMode !== false);
        setXpPoints(data.xp || 0);
        setBadges(data.badges || []);
      }
    });
  }, [user]);

  // Market ideas
  useEffect(() => {
    const qMarket = query(collection(db, "market"), orderBy("votes", "desc"), orderBy("createdAt", "desc"));
    return onSnapshot(qMarket, (s) => setMarketIdeas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  // Contacts
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "myContacts"), orderBy("lastInteraction", "desc"));
    return onSnapshot(q, (s) => {
      const updatedUsers = s.docs.map(d => d.data());
      updatedUsers.forEach(u => {
        if (u.hasNewMessage && selectedUser?.uid !== u.uid && document.hidden && notificationsEnabled) {
           new Notification("VORTEX", { body: `New signal from ${u.displayName}`, icon: LOGO_URL });
        }
      });
      setUsers(updatedUsers);
    });
  }, [user, selectedUser, notificationsEnabled]);

  // Messages
  useEffect(() => {
    if (!user || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    updateDoc(doc(db, "users", user.uid, "myContacts", selectedUser.uid), { hasNewMessage: false });
    const qMsg = query(collection(db, "messages"), where("chatId", "==", chatId), orderBy("createdAt", "asc"));
    return onSnapshot(qMsg, (s) => {
      const msgs = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      scroll.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [user, selectedUser]);

  // Polls
  useEffect(() => {
    if (!user || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    const qPolls = query(collection(db, "polls"), where("chatId", "==", chatId), orderBy("createdAt", "desc"));
    return onSnapshot(qPolls, (s) => setPolls(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user, selectedUser]);

  // Leaderboard
  useEffect(() => {
    const qLeader = query(collection(db, "users"), orderBy("xp", "desc"), limit(10));
    return onSnapshot(qLeader, (s) => setLeaderboard(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  // Away detection
  useEffect(() => {
    const handleActivity = () => setLastActive(Date.now());
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    const interval = setInterval(() => {
      setAwayStatus(Date.now() - lastActive > 300000);
    }, 60000);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearInterval(interval);
    };
  }, [lastActive]);
  // Add contact
  const addContactByNumber = async () => {
    const number = prompt("Enter VORTEX ID:");
    if (!number) return;
    const q = query(collection(db, "users"), where("phoneNumber", "==", number.trim()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const contact = snap.docs[0].data();
      if(contact.uid === user.uid) return alert("Error: Self-linkage blocked.");
      await setDoc(doc(db, "users", user.uid, "myContacts", contact.uid), { 
        ...contact, lastInteraction: serverTimestamp(), hasNewMessage: false 
      });
      alert("Signal Secured.");
    } else { alert("ID not found."); }
  };

  // Send message
  const handleSend = async (val, type = "text") => {
    const content = val || newMessage;
    if (!content.trim() || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;

    const msgData = {
      text: type === "text" ? encrypt(content) : content,
      type, senderId: user.uid, chatId, createdAt: serverTimestamp(),
      encrypted: type === "text",
      replyTo: replyingTo ? { text: replyingTo.text, senderId: replyingTo.senderId } : null,
      reactions: [],
      isBurner: burnerMode,
      isPinned: false,
      isBookmarked: false,
      readBy: [user.uid],
      deliveryStatus: "sent",
      edited: false,
      editHistory: [],
      fontSize: fontSize,
      animation: messageAnimations ? "slide" : "none"
    };

    const docRef = await addDoc(collection(db, "messages"), msgData);

    // Burner timer
    if (burnerMode) {
      messageTimeouts.current[docRef.id] = setTimeout(async () => {
        await deleteDoc(doc(db, "messages", docRef.id));
      }, 30000);
    }

    // Update contacts
    await updateDoc(doc(db, "users", selectedUser.uid, "myContacts", user.uid), { 
      lastInteraction: serverTimestamp(), hasNewMessage: true 
    });
    await updateDoc(doc(db, "users", user.uid, "myContacts", selectedUser.uid), { 
      lastInteraction: serverTimestamp() 
    });

    // XP for messaging
    await updateDoc(doc(db, "users", user.uid), { 
      xp: increment(5),
      messagesSent: increment(1)
    });

    setNewMessage(""); 
    setReplyingTo(null); 
    setKeyboardView("none"); 
    setBurnerMode(false);
    setShowEmojiPicker(false);
  };

  // Typing indicator
  const handleTyping = () => {
    if (!selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    setDoc(doc(db, "typing", chatId), { [user.uid]: true }, { merge: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setDoc(doc(db, "typing", chatId), { [user.uid]: false }, { merge: true });
    }, 3000);
  };

  // Vote on market idea
  const handleVote = async (id, currentVotes) => {
    await updateDoc(doc(db, "market", id), { votes: (currentVotes || 0) + 1 });
    await updateDoc(doc(db, "users", user.uid), { xp: increment(2) });
  };

  // React to message
  const handleReaction = async (msgId, emoji) => {
    await updateDoc(doc(db, "messages", msgId), { 
      reactions: arrayUnion({ emoji, userId: user.uid, timestamp: Date.now() }) 
    });
    setReactionId(null);
  };

  // Pin message
  const handlePinMessage = async (msgId) => {
    await updateDoc(doc(db, "messages", msgId), { isPinned: true });
    setPinnedMessages(prev => [...prev, msgId]);
  };

  // Bookmark message
  const handleBookmark = async (msgId) => {
    await updateDoc(doc(db, "messages", msgId), { isBookmarked: true });
    setBookmarkedMessages(prev => [...prev, msgId]);
  };

  // Delete message
  const handleDeleteMessage = async (msgId) => {
    if (window.confirm("Delete this signal?")) {
      await deleteDoc(doc(db, "messages", msgId));
    }
  };

  // Create poll
  const handleCreatePoll = async (question, options) => {
    if (!selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    await addDoc(collection(db, "polls"), {
      question, options: options.map(o => ({ text: o, votes: 0, voters: [] })),
      chatId, createdBy: user.uid, createdAt: serverTimestamp(), active: true
    });
  };

  // Vote on poll
  const handlePollVote = async (pollId, optionIndex) => {
    const pollRef = doc(db, "polls", pollId);
    const pollSnap = await getDoc(pollRef);
    if (!pollSnap.exists()) return;
    const poll = pollSnap.data();
    if (poll.options[optionIndex].voters.includes(user.uid)) return;
    
    const newOptions = [...poll.options];
    newOptions[optionIndex].votes += 1;
    newOptions[optionIndex].voters.push(user.uid);
    await updateDoc(pollRef, { options: newOptions });
  };

  // Schedule message
  const handleScheduleMessage = async (content, delayMinutes) => {
    const scheduledTime = Timestamp.fromMillis(Date.now() + delayMinutes * 60000);
    await addDoc(collection(db, "scheduled"), {
      text: encrypt(content), senderId: user.uid, recipientId: selectedUser?.uid,
      scheduledFor: scheduledTime, chatId: getChatId(), sent: false
    });
    alert(`Signal scheduled for ${delayMinutes} minutes`);
  };

  const getChatId = () => {
    if (!user || !selectedUser) return "";
    return user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
  };

  // Create note
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await addDoc(collection(db, "users", user.uid, "notes"), {
      text: newNote, createdAt: serverTimestamp(), pinned: false
    });
    setNewNote("");
  };

  // Daily challenge
  const generateDailyChallenge = () => {
    const challenges = [
      "Send 5 encrypted signals",
      "React to 3 messages with 🔥",
      "Start a poll in any chat",
      "Share a GIF with 2 contacts",
      "Update your bio status",
      "Vote on 3 market ideas",
      "Use burner mode once",
      "Reply to a pinned message"
    ];
    return challenges[Math.floor(Math.random() * challenges.length)];
  };

  // Game: Dice Roll
  const handleDiceRoll = async () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    await handleSend(`🎲 Rolled a ${roll}!`, "game");
    setGameScore(prev => prev + roll);
  };

  // Game: Coin Flip
  const handleCoinFlip = async () => {
    const result = Math.random() > 0.5 ? "Heads" : "Tails";
    await handleSend(`🪙 Flipped: ${result}!`, "game");
  };

  // Copy message
  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(decrypt(text));
    alert("Signal copied to clipboard");
  };

  // Mark as read
  const handleMarkRead = async (msgId) => {
    await updateDoc(doc(db, "messages", msgId), { 
      readBy: arrayUnion(user.uid),
      deliveryStatus: "read"
    });
  };

  // Edit message
  const handleEditMessage = async (msgId, newText) => {
    const msgRef = doc(db, "messages", msgId);
    const msgSnap = await getDoc(msgRef);
    if (!msgSnap.exists()) return;
    const msg = msgSnap.data();
    await updateDoc(msgRef, {
      text: encrypt(newText),
      edited: true,
      editHistory: arrayUnion({ text: msg.text, editedAt: serverTimestamp() })
    });
  };

  // Toggle message animation
  const toggleAnimation = () => setMessageAnimations(!messageAnimations);

  // Change font size
  const cycleFontSize = () => {
    const sizes = ["small", "medium", "large"];
    const next = sizes[(sizes.indexOf(fontSize) + 1) % sizes.length];
    setFontSize(next);
  };

  // Sound toggle
  const toggleSound = () => setSoundEnabled(!soundEnabled);

  // Notification toggle
  const toggleNotifications = () => setNotificationsEnabled(!notificationsEnabled);

  // Show profile card
  const showProfile = (u) => {
    setProfileCardUser(u);
    setShowProfileCard(true);
  };
  if (!user) return (
    <div className="h-screen bg-[#060a16] flex flex-col items-center justify-center p-10 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-green-500 animate-pulse"
            style={{
              width: Math.random() * 4 + 'px',
              height: Math.random() * 4 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's'
            }}
          />
        ))}
      </div>
      <img src={LOGO_URL} className="w-24 h-24 rounded-3xl mb-8 animate-bounce" alt="VORTEX" />
      <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">
        VORTEX
      </h1>
      <p className="text-xs text-slate-500 uppercase tracking-[0.3em] mb-12">Secure Signal Protocol</p>
      <button onClick={() => signInWithPopup(auth, googleProvider)} 
        className="bg-white text-black px-12 py-5 rounded-full font-black uppercase hover:scale-105 transition-transform shadow-lg shadow-green-500/20">
        Connect Hub
      </button>
      <div className="mt-8 flex gap-4 text-[10px] text-slate-600 uppercase tracking-widest">
        <span className="flex items-center gap-1"><Lock size={10}/> E2E Encrypted</span>
        <span className="flex items-center gap-1"><Shield size={10}/> Zero Knowledge</span>
        <span className="flex items-center gap-1"><Zap size={10}/> Quantum Safe</span>
      </div>
    </div>
  );
  return (
    <div className={`fixed inset-0 ${darkMode ? 'bg-[#060a16]' : 'bg-gray-100'} text-white flex flex-col overflow-hidden font-sans`}>
      <style>{`
        .glass { background: rgba(13, 18, 37, 0.7); backdrop-filter: blur(20px); }
        .reply-card { border-left: 4px solid ${themeColor}; background: rgba(255,255,255,0.05); }
        .notification-glow { border: 1px solid ${themeColor} !important; box-shadow: 0 0 15px ${themeColor}4d; }
        @keyframes pop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-pop { animation: pop 0.2s ease-out forwards; }
        .burner-glow { box-shadow: 0 0 10px #ef4444; border: 1px solid #ef4444 !important; }
        @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide { animation: slideIn 0.3s ease-out forwards; }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 5px ${themeColor}40; } 50% { box-shadow: 0 0 20px ${themeColor}80; } }
        .pulse-glow { animation: pulse-glow 2s infinite; }
        .typing-dot { animation: typing 1.4s infinite ease-in-out both; }
        @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {!selectedUser && activeTab === "chats" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 pt-12 flex justify-between items-center glass border-b border-white/5">
            <div>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase">VORTEX</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1 mt-1">
                <Users size={10}/> {users.length} Active Nodes
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDarkMode(!darkMode)} 
                className="p-3 rounded-2xl bg-[#11172b] text-slate-400 hover:text-white transition-colors">
                {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
              </button>
              <button onClick={addContactByNumber} 
                style={{backgroundColor: `${themeColor}1a`, color: themeColor}} 
                className="p-3 rounded-2xl active:scale-90 transition-transform">
                <Plus size={24} />
              </button>
            </div>
          </header>
          
          <div className="p-6">
            <div className="bg-[#11172b] rounded-2xl p-4 flex items-center gap-3 border border-white/5">
              <Search size={18} style={{color: themeColor}} />
              <input value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} 
                placeholder="Search signals..." className="bg-transparent outline-none text-xs w-full text-white" />
            </div>
          </div>

          <div className="px-6 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
            <button onClick={() => setShowNotes(true)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#11172b] border border-white/5 text-[10px] font-bold uppercase whitespace-nowrap hover:border-white/20 transition-colors">
              <Bookmark size={12}/> Notes
            </button>
            <button onClick={() => setDailyChallenge(generateDailyChallenge())} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#11172b] border border-white/5 text-[10px] font-bold uppercase whitespace-nowrap hover:border-white/20 transition-colors">
              <Trophy size={12}/> Challenge
            </button>
            <button onClick={() => setActiveTab("leaderboard")} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#11172b] border border-white/5 text-[10px] font-bold uppercase whitespace-nowrap hover:border-white/20 transition-colors">
              <TrendingUp size={12}/> Rank #{userRank}
            </button>
          </div>

          {dailyChallenge && (
            <div className="mx-6 mb-4 p-3 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center gap-3 animate-pop">
              <Flame size={16} className="text-orange-400"/>
              <div className="flex-1">
                <p className="text-[10px] text-orange-400 font-bold uppercase">Daily Challenge</p>
                <p className="text-xs">{dailyChallenge}</p>
              </div>
              <button onClick={() => setDailyChallenge(null)} className="text-slate-500"><X size={14}/></button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-32 scrollbar-hide">
            {users.filter(u => u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())).map((u, idx) => (
              <div key={u.uid} onClick={() => setSelectedUser(u)} 
                className={`flex items-center gap-4 p-4 rounded-[28px] bg-[#0d1225] border border-white/5 transition-all hover:border-white/10 cursor-pointer ${u.hasNewMessage ? 'notification-glow' : ''}`}>
                <div className="relative">
                  <img src={u.photoURL} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0d1225] ${u.status === 'online' ? 'bg-green-500' : awayStatus ? 'bg-yellow-500' : 'bg-gray-600'}`}></div>
                  {u.isTyping && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold uppercase text-[14px] truncate">{u.displayName}</h3>
                    {u.verified && <Crown size={12} className="text-yellow-400"/>}
                  </div>
                  <p className="text-[10px] opacity-50 uppercase truncate">{u.bio || "No status set"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {streaks[u.uid] > 0 && (
                      <span className="text-[8px] flex items-center gap-1 text-orange-400">
                        <Flame size={8}/> {streaks[u.uid]}d
                      </span>
                    )}
                    <span className="text-[8px] text-slate-600">{u.messagesSent || 0} signals</span>
                  </div>
                </div>
                {u.hasNewMessage && <div style={{backgroundColor: themeColor}} className="w-3 h-3 rounded-full animate-pulse"></div>}
                {u.isPinned && <Pin size={14} style={{color: themeColor}}/>}
              </div>
            ))}
          </div>
        </div>
      )}
      {!selectedUser && activeTab === "leaderboard" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 pt-12 glass border-b border-white/5">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Leaderboard</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1">
              <Trophy size={10}/> Top Signal Operators
            </p>
          </header>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-32 scrollbar-hide pt-6">
            {leaderboard.map((u, idx) => (
              <div key={u.id} className={`flex items-center gap-4 p-4 rounded-[28px] border ${idx < 3 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/5 bg-[#0d1225]'}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm"
                  style={{backgroundColor: idx === 0 ? '#eab308' : idx === 1 ? '#94a3b8' : idx === 2 ? '#cd7f32' : '#1e293b'}}>
                  {idx + 1}
                </div>
                <img src={u.photoURL} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                <div className="flex-1">
                  <h3 className="font-bold text-[14px]">{u.displayName}</h3>
                  <p className="text-[10px] text-slate-500">Level {Math.floor((u.xp || 0) / 100) + 1}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black" style={{color: themeColor}}>{u.xp || 0}</p>
                  <p className="text-[8px] text-slate-500 uppercase">XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {!selectedUser && activeTab === "settings" && (
        <div className="flex-1 flex flex-col p-8 pt-12 overflow-y-auto pb-32 scrollbar-hide">
          <header className="flex flex-col items-center mb-8">
            <div className="relative">
              <img src={user?.photoURL} style={{borderColor: `${themeColor}33`}} 
                className="w-24 h-24 rounded-[35px] border-4 mb-4 object-cover" alt="" />
              <div className="absolute -bottom-2 -right-2 bg-[#11172b] rounded-full p-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                  style={{backgroundColor: themeColor}}>
                  {Math.floor((xpPoints || 0) / 100) + 1}
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-black italic uppercase">{user?.displayName}</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{xpPoints || 0} XP • {(badges || []).length} Badges</p>
            
            <div className="flex gap-2 mt-3 flex-wrap justify-center">
              {(badges || []).map((badge, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-[8px] font-black uppercase border"
                  style={{borderColor: themeColor, color: themeColor}}>
                  {badge}
                </span>
              ))}
              {(badges || []).length === 0 && <span className="text-[10px] text-slate-600">No badges yet</span>}
            </div>
          </header>
          
          <div className="space-y-4">
            <div className="bg-[#11172b] p-6 rounded-[35px] border border-white/10 shadow-2xl">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <User size={12}/> Profile Signal
              </p>
              <input value={bioInput} onChange={(e) => setBioInput(e.target.value)} 
                placeholder="Enter bio status..." className="bg-[#060a16] p-4 rounded-2xl w-full outline-none text-xs font-bold mb-3 text-white" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Shield size={12}/> VORTEX ID
              </p>
              <div className="flex gap-2 items-center">
                <input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} 
                  className="bg-[#060a16] p-4 rounded-2xl flex-1 outline-none text-xs font-bold h-[48px] text-white" />
                <button onClick={async () => { 
                  await updateDoc(doc(db, "users", user.uid), { 
                    phoneNumber: phoneInput, bio: bioInput 
                  }); 
                  alert("System Updated."); 
                }} style={{backgroundColor: themeColor}} 
                  className="px-6 h-[48px] rounded-2xl font-black text-[10px] uppercase shrink-0 active:scale-90 transition-transform">
                  Sync
                </button>
              </div>
            </div>

            <div className="bg-[#11172b] p-6 rounded-[35px] border border-white/10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Palette size={12}/> UI Frequency
              </p>
              <div className="flex justify-between flex-wrap gap-2">
                {Object.entries(THEMES).map(([name, hex]) => (
                  <button key={name} onClick={async () => await updateDoc(doc(db, "users", user.uid), { theme: hex })} 
                    style={{backgroundColor: hex}} 
                    className={`w-10 h-10 rounded-full border-4 ${themeColor === hex ? 'border-white pulse-glow' : 'border-transparent'} transition-all hover:scale-110`}>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#11172b] p-6 rounded-[35px] border border-white/10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Preferences</p>
              <div className="space-y-3">
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#060a16]">
                  <span className="text-xs flex items-center gap-2"><Volume2 size={14}/> Sound Effects</span>
                  <div className={`w-10 h-5 rounded-full transition-colors ${soundEnabled ? 'bg-green-500' : 'bg-slate-700'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`}/>
                  </div>
                </button>
                <button onClick={() => setNotificationsEnabled(!notificationsEnabled)} className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#060a16]">
                  <span className="text-xs flex items-center gap-2"><Bell size={14}/> Notifications</span>
                  <div className={`w-10 h-5 rounded-full transition-colors ${notificationsEnabled ? 'bg-green-500' : 'bg-slate-700'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`}/>
                  </div>
                </button>
                <button onClick={() => setMessageAnimations(!messageAnimations)} className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#060a16]">
                  <span className="text-xs flex items-center gap-2"><Sparkles size={14}/> Animations</span>
                  <div className={`w-10 h-5 rounded-full transition-colors ${messageAnimations ? 'bg-green-500' : 'bg-slate-700'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${messageAnimations ? 'translate-x-5' : 'translate-x-0'}`}/>
                  </div>
                </button>
                <button onClick={() => {
                  const sizes = ["small", "medium", "large"];
                  setFontSize(sizes[(sizes.indexOf(fontSize) + 1) % sizes.length]);
                }} className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#060a16]">
                  <span className="text-xs flex items-center gap-2"><Type size={14}/> Font Size: {fontSize}</span>
                  <ChevronRight size={14} className="text-slate-500"/>
                </button>
              </div>
            </div>

            <div className="bg-[#11172b] p-6 rounded-[35px] border border-white/10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingUp size={12}/> Signal Analytics
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-[#060a16] text-center">
                  <p className="text-2xl font-black" style={{color: themeColor}}>{userData?.messagesSent || 0}</p>
                  <p className="text-[8px] text-slate-500 uppercase">Sent</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#060a16] text-center">
                  <p className="text-2xl font-black" style={{color: themeColor}}>{userData?.messagesReceived || 0}</p>
                  <p className="text-[8px] text-slate-500 uppercase">Received</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#060a16] text-center">
                  <p className="text-2xl font-black" style={{color: themeColor}}>{userData?.streak || 0}</p>
                  <p className="text-[8px] text-slate-500 uppercase">Day Streak</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#060a16] text-center">
                  <p className="text-2xl font-black" style={{color: themeColor}}>{userData?.pollsCreated || 0}</p>
                  <p className="text-[8px] text-slate-500 uppercase">Polls</p>
                </div>
              </div>
            </div>
          </div>
          
          <button onClick={() => signOut(auth)} 
            className="p-6 w-full rounded-[30px] border border-red-500/20 bg-[#11172b] text-red-500 font-black text-xs uppercase tracking-widest mt-10 hover:bg-red-500/10 transition-colors">
            Logout System
          </button>
        </div>
      )}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-[#060a16] flex flex-col">
          {/* Chat Header */}
          <header className="p-4 pt-10 glass border-b border-white/5 flex items-center gap-4">
            <button onClick={() => setSelectedUser(null)} style={{color: themeColor}} className="font-bold p-2 hover:bg-white/5 rounded-xl transition-colors">
              ←
            </button>
            <div onClick={() => showProfile(selectedUser)} className="relative cursor-pointer">
              <img src={selectedUser.photoURL} className="w-10 h-10 rounded-xl object-cover" alt="" />
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#060a16] ${selectedUser.status === 'online' ? 'bg-green-500' : 'bg-gray-600'}`}></div>
            </div>
            <div className="flex-1 cursor-pointer" onClick={() => showProfile(selectedUser)}>
              <h4 className="text-[12px] font-black uppercase">{selectedUser.displayName}</h4>
              <p style={{color: themeColor}} className="text-[7px] font-black tracking-widest uppercase">
                {typingUsers[selectedUser.uid] ? 'TYPING...' : 'ENCRYPTED SIGNAL'}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNotes(!showNotes)} className="p-2 rounded-xl bg-[#11172b] text-slate-400 hover:text-white transition-colors">
                <Bookmark size={16}/>
              </button>
              <button onClick={() => setActivePoll(polls[0] || null)} className="p-2 rounded-xl bg-[#11172b] text-slate-400 hover:text-white transition-colors">
                <BarChart3 size={16}/>
              </button>
              <button onClick={handleDiceRoll} className="p-2 rounded-xl bg-[#11172b] text-slate-400 hover:text-white transition-colors">
                <Dice5 size={16}/>
              </button>
            </div>
          </header>

          {/* Notes Panel */}
          {showNotes && (
            <div className="bg-[#11172b] border-b border-white/5 p-4 animate-pop">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase flex items-center gap-2"><Bookmark size={12}/> Shared Notes</h3>
                <button onClick={() => setShowNotes(false)}><X size={14}/></button>
              </div>
              <div className="flex gap-2 mb-3">
                <input value={newNote} onChange={(e) => setNewNote(e.target.value)} 
                  placeholder="Add note..." className="flex-1 bg-[#060a16] p-2 rounded-xl text-xs outline-none text-white" />
                <button onClick={handleAddNote} style={{backgroundColor: themeColor}} className="px-3 rounded-xl text-xs font-bold">Add</button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-hide">
                {notes.map((note, i) => (
                  <div key={i} className="p-2 rounded-xl bg-[#060a16] text-[10px]">{note.text}</div>
                ))}
              </div>
            </div>
          )}

          {/* Active Poll */}
          {activePoll && (
            <div className="bg-[#11172b] border-b border-white/5 p-4 animate-pop">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase flex items-center gap-2"><BarChart3 size={12}/> Active Poll</h3>
                <button onClick={() => setActivePoll(null)}><X size={14}/></button>
              </div>
              <p className="text-sm mb-3">{activePoll.question}</p>
              <div className="space-y-2">
                {activePoll.options.map((opt, i) => (
                  <button key={i} onClick={() => handlePollVote(activePoll.id, i)} 
                    className="w-full p-2 rounded-xl bg-[#060a16] text-left text-xs hover:bg-white/5 transition-colors flex justify-between">
                    <span>{opt.text}</span>
                    <span className="text-slate-500">{opt.votes} votes</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
            {/* Pinned Messages */}
            {messages.filter(m => m.isPinned).length > 0 && (
              <div className="mb-4 p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-[8px] text-yellow-400 font-bold uppercase mb-2 flex items-center gap-1"><Pin size={8}/> Pinned</p>
                {messages.filter(m => m.isPinned).map(m => (
                  <p key={m.id} className="text-xs truncate">{decrypt(m.text)}</p>
                ))}
              </div>
            )}

            {messages.map((m, idx) => {
              const isMe = m.senderId === user.uid;
              const showAnimation = messageAnimations && idx === messages.length - 1;
              return (
                <div key={m.id} 
                  onTouchStart={(e) => touchStart.current = e.targetTouches[0].clientX} 
                  onTouchEnd={(e) => { if (e.changedTouches[0].clientX - touchStart.current > 70) setReplyingTo(m); }} 
                  onContextMenu={(e) => { e.preventDefault(); setReactionId(m.id); }}
                  className={`flex flex-col relative ${isMe ? 'items-end' : 'items-start'} ${showAnimation ? 'animate-slide' : ''}`}>
                  
                  {/* Reaction Picker */}
                  {reactionId === m.id && (
                    <div className="absolute -top-10 z-50 flex gap-2 bg-[#1a2238] p-2 rounded-full border border-white/20 animate-pop">
                      {["🔥", "❤️", "😂", "👍", "🙏", "💯", "👀", "🎯"].map(e => (
                        <button key={e} onClick={() => handleReaction(m.id, e)} 
                          className="text-xl hover:scale-125 transition-transform">{e}</button>
                      ))}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`max-w-[80%] px-4 py-3 rounded-[24px] shadow-xl relative group ${m.isBurner ? 'burner-glow' : ''} ${isMe ? `bg-opacity-90 rounded-tr-none` : 'bg-[#11172b] rounded-tl-none'}`} 
                    style={{backgroundColor: isMe ? themeColor : '#11172b'}}>
                    
                    {/* Burner Badge */}
                    {m.isBurner && (
                      <p className="text-[8px] font-black text-red-400 mb-1 flex items-center gap-1">
                        <Zap size={8}/> BURNER SIGNAL • 30s
                      </p>
                    )}

                    {/* Reply Preview */}
                    {m.replyTo && (
                      <div className="mb-2 p-2 rounded-lg reply-card text-[10px] opacity-70">
                        <p className="font-bold" style={{color: themeColor}}>
                          {m.replyTo.senderId === user.uid ? 'You' : selectedUser.displayName}
                        </p>
                        <p className="truncate">{decrypt(m.replyTo.text)}</p>
                      </div>
                    )}

                    {/* Content */}
                    {m.type === "gif" ? (
                      <img src={m.text} className="w-44 rounded-xl" alt="gif" />
                    ) : m.type === "game" ? (
                      <p className="text-sm font-bold flex items-center gap-2">
                        <Gamepad2 size={14}/> {decrypt(m.text)}
                      </p>
                    ) : (
                      <p className="text-sm" style={{fontSize: fontSize === 'small' ? '12px' : fontSize === 'large' ? '16px' : '14px'}}>
                        {decrypt(m.text)}
                      </p>
                    )}

                    {/* Edited Badge */}
                    {m.edited && <span className="text-[7px] opacity-50 ml-1">(edited)</span>}

                    {/* Message Actions (hover) */}
                    <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button onClick={() => handlePinMessage(m.id)} className="p-1 bg-[#1a2238] rounded-full"><Pin size={10}/></button>
                      <button onClick={() => handleBookmark(m.id)} className="p-1 bg-[#1a2238] rounded-full"><Bookmark size={10}/></button>
                      <button onClick={() => handleCopyMessage(m.text)} className="p-1 bg-[#1a2238] rounded-full"><Copy size={10}/></button>
                      {isMe && <button onClick={() => handleDeleteMessage(m.id)} className="p-1 bg-[#1a2238] rounded-full text-red-400"><Trash2 size={10}/></button>}
                    </div>
                  </div>

                  {/* Reactions */}
                  {m.reactions?.length > 0 && (
                    <div className="flex -mt-2 bg-[#1a2238] px-2 py-0.5 rounded-full border border-white/10 text-[10px]">
                      {m.reactions.map((r, i) => <span key={i} className="mr-1">{r.emoji}</span>)}
                    </div>
                  )}

                  {/* Timestamp & Status */}
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[8px] text-slate-600">
                      {m.createdAt?.toDate?.() ? m.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                    </span>
                    {isMe && (
                      <span className="text-[8px]" style={{color: m.deliveryStatus === 'read' ? themeColor : '#64748b'}}>
                        {m.deliveryStatus === 'read' ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={scroll}></div>
          </div>

          {/* Input Area */}
          <div className="p-4 glass rounded-t-[40px]">
            {/* Reply Preview */}
            {replyingTo && (
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl mb-2 animate-pop border-l-4" style={{borderColor: themeColor}}>
                <div className="text-[10px] truncate flex-1">
                  <p className="font-bold">Replying to Signal</p>
                  <p className="opacity-60">{decrypt(replyingTo.text)}</p>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-1"><X size={16}/></button>
              </div>
            )}

            {/* Input Row */}
            <div className="flex items-center gap-3">
              {/* Burner Mode */}
              <button onClick={() => setBurnerMode(!burnerMode)} 
                className={`p-3 rounded-2xl transition-all h-[52px] w-[52px] flex items-center justify-center shrink-0 ${burnerMode ? 'bg-red-500 text-white burner-glow' : 'bg-[#11172b] text-slate-400'}`}>
                <Zap size={20}/>
              </button>

              {/* Emoji Toggle */}
              <button onClick={() => setKeyboardView(keyboardView === 'emoji' ? 'none' : 'emoji')} 
                className="p-3 bg-[#11172b] rounded-2xl text-slate-400 h-[52px] w-[52px] flex items-center justify-center shrink-0 hover:text-white transition-colors">
                <Smile size={20}/>
              </button>

              {/* GIF Toggle */}
              <button onClick={() => setKeyboardView(keyboardView === 'gif' ? 'none' : 'gif')} 
                className="p-3 bg-[#11172b] rounded-2xl text-slate-400 h-[52px] w-[52px] flex items-center justify-center shrink-0 hover:text-white transition-colors">
                <Gift size={20}/>
              </button>

              {/* Text Input */}
              <div className="flex-1 bg-[#11172b] p-3 rounded-2xl border border-white/5 flex items-center h-[52px]">
                <input value={newMessage} onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={burnerMode ? "Burner Signal..." : "Type signal..."} 
                  className="flex-1 bg-transparent outline-none text-sm text-white" />
              </div>

              {/* Send */}
              <button onClick={() => handleSend()} style={{backgroundColor: themeColor}} 
                className="rounded-2xl active:scale-90 shadow-lg shadow-black/20 h-[52px] w-[52px] flex items-center justify-center shrink-0 transition-transform">
                <Send size={20} className="text-[#060a16]"/>
              </button>
            </div>

            {/* Keyboard Panel */}
            {keyboardView !== 'none' && (
              <div className="h-64 mt-4 overflow-y-auto grid grid-cols-8 gap-2 p-4 bg-[#0d1225] rounded-3xl border border-white/5 scrollbar-hide">
                {keyboardView === 'emoji' ? (
                  EMOJI_LIST.map((e, i) => (
                    <button key={i} onClick={() => { setNewMessage(p => p + e); }} 
                      className="text-2xl hover:scale-125 transition-transform p-1">{e}</button>
                  ))
                ) : (
                  GIF_LIST.map((g, i) => (
                    <img key={i} src={g} onClick={() => handleSend(g, 'gif')} 
                      className="h-24 w-full object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity" alt="gif" />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Profile Card Modal */}
      {showProfileCard && profileCardUser && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-6 animate-pop" onClick={() => setShowProfileCard(false)}>
          <div className="bg-[#11172b] rounded-[35px] p-8 max-w-sm w-full border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center">
              <img src={profileCardUser.photoURL} className="w-24 h-24 rounded-[30px] mb-4 object-cover" alt="" />
              <h3 className="text-xl font-black uppercase">{profileCardUser.displayName}</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{profileCardUser.bio || "No status"}</p>
              
              <div className="flex gap-4 mt-4">
                <div className="text-center">
                  <p className="text-lg font-black" style={{color: themeColor}}>{profileCardUser.messagesSent || 0}</p>
                  <p className="text-[8px] text-slate-500 uppercase">Signals</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black" style={{color: themeColor}}>{profileCardUser.xp || 0}</p>
                  <p className="text-[8px] text-slate-500 uppercase">XP</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black" style={{color: themeColor}}>{profileCardUser.streak || 0}</p>
                  <p className="text-[8px] text-slate-500 uppercase">Streak</p>
                </div>
              </div>

              <div className="flex gap-2 mt-6 w-full">
                <button onClick={() => { setSelectedUser(profileCardUser); setShowProfileCard(false); }} 
                  style={{backgroundColor: themeColor}} className="flex-1 py-3 rounded-2xl font-black text-xs uppercase">
                  Message
                </button>
                <button onClick={() => setShowProfileCard(false)} 
                  className="flex-1 py-3 rounded-2xl bg-[#060a16] font-black text-xs uppercase">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER NAV */}
      {!selectedUser && (
        <nav className="p-6 px-10 glass flex justify-between items-center pb-12 border-t border-white/5">
          <button onClick={() => setActiveTab("chats")} 
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'chats' ? '' : 'text-slate-600'}`} 
            style={{color: activeTab === 'chats' ? themeColor : ''}}>
            <MessageSquare size={22} />
            <span className="text-[8px] font-black uppercase">Signals</span>
            {users.filter(u => u.hasNewMessage).length > 0 && (
              <span className="absolute top-4 bg-red-500 w-2 h-2 rounded-full"></span>
            )}
          </button>
          <button onClick={() => setActiveTab("market")} 
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'market' ? '' : 'text-slate-600'}`} 
            style={{color: activeTab === 'market' ? themeColor : ''}}>
            <Radio size={22} />
            <span className="text-[8px] font-black uppercase">Market</span>
          </button>
          <button onClick={() => setActiveTab("leaderboard")} 
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'leaderboard' ? '' : 'text-slate-600'}`} 
            style={{color: activeTab === 'leaderboard' ? themeColor : ''}}>
            <Trophy size={22} />
            <span className="text-[8px] font-black uppercase">Rank</span>
          </button>
          <button onClick={() => setActiveTab("settings")} 
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'settings' ? '' : 'text-slate-600'}`} 
            style={{color: activeTab === 'settings' ? themeColor : ''}}>
            <Shield size={22} />
            <span className="text-[8px] font-black uppercase">System</span>
          </button>
        </nav>
      )}
    </div>
  );
}
