import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, addDoc, query, orderBy, onSnapshot, where, 
  serverTimestamp, setDoc, doc, updateDoc, limit, getDocs, 
  arrayUnion, increment, deleteDoc
} from 'firebase/firestore';
import { 
  Send, MessageSquare, Search, Shield, Radio, Lock, Smile, X, Gift, Plus, 
  Bell, ChevronRight, Flame, Zap, Palette, User, Clock, Trash2, Reply, 
  Heart, Star, Crown, Sparkles, Ghost, Moon, Sun, Pin, Bookmark, Copy,
  Eye, EyeOff, Hash, Trophy, TrendingUp, Users, Type, Volume2,
  Gamepad2, Dice5, BarChart
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

// --- EMOJIS ---
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

// --- GIFS ---
const GIF_LIST = [
  "https://media.giphy.com/media/l0HlUxc2YM1NC6ny8/giphy.gif",
  "https://media.giphy.com/media/26AHONh79u4m5W98s/giphy.gif",
  "https://media.giphy.com/media/3o7TKVUn7iM8FMEU24/giphy.gif",
  "https://media.giphy.com/media/l41lTfuxV5F68S96E/giphy.gif",
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
  "https://media.giphy.com/media/3o7TKq3HJnK1Qq9iQE/giphy.gif",
  "https://media.giphy.com/media/l0HlPystfePnAI3HS/giphy.gif",
  "https://media.giphy.com/media/26ufplp8yhe3URLUQ/giphy.gif",
  "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif",
  "https://media.giphy.com/media/3o7TKTDn976rzVgky4/giphy.gif",
  "https://media.giphy.com/media/l0HlOvJ7yaacpuSas/giphy.gif",
  "https://media.giphy.com/media/26xBwdIuRJiAIqHwA/giphy.gif"
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
  // Auth & User
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Contacts & Chat
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Market
  const [marketIdeas, setMarketIdeas] = useState([]);
  const [newIdea, setNewIdea] = useState("");
  
  // Inputs
  const [newMessage, setNewMessage] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  
  // UI State
  const [activeTab, setActiveTab] = useState("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [keyboardView, setKeyboardView] = useState("none");
  const [replyingTo, setReplyingTo] = useState(null);
  const [reactionId, setReactionId] = useState(null);
  const [burnerMode, setBurnerMode] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  
  // Features
  const [leaderboard, setLeaderboard] = useState([]);
  const [xpPoints, setXpPoints] = useState(0);
  const [badges, setBadges] = useState([]);
  const [messageAnimations, setMessageAnimations] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [fontSize, setFontSize] = useState("medium");
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [polls, setPolls] = useState([]);
  const [gameScore, setGameScore] = useState(0);
  
  const scroll = useRef();
  const touchStart = useRef(0);
  
  const themeColor = userData?.theme || THEMES.vortex;
  // Auth listener
  useEffect(() => {
    if ("Notification" in window) Notification.requestPermission();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Create user doc on first login
  useEffect(() => {
    if (!user) return;
    const initUser = async () => {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
      if (snap.empty) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          phoneNumber: "",
          bio: "",
          theme: THEMES.vortex,
          status: "online",
          lastSeen: serverTimestamp(),
          xp: 0,
          badges: [],
          messagesSent: 0,
          messagesReceived: 0,
          streak: 0,
          pollsCreated: 0,
          createdAt: serverTimestamp()
        });
      } else {
        await updateDoc(userRef, { status: "online", lastSeen: serverTimestamp() });
      }
    };
    initUser();
    
    return () => {
      if (user) {
        updateDoc(doc(db, "users", user.uid), { status: "offline", lastSeen: serverTimestamp() });
      }
    };
  }, [user]);

  // Listen to user data
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setPhoneInput(data.phoneNumber || "");
        setBioInput(data.bio || "");
        setXpPoints(data.xp || 0);
        setBadges(data.badges || []);
      }
    });
  }, [user]);

  // Listen to contacts
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "myContacts"), orderBy("lastInteraction", "desc"));
    return onSnapshot(q, (s) => {
      const contacts = s.docs.map(d => ({ id: d.id, ...d.data() }));
      contacts.forEach(u => {
        if (u.hasNewMessage && selectedUser?.uid !== u.uid && document.hidden && notificationsEnabled) {
          new Notification("VORTEX", { body: `New signal from ${u.displayName}`, icon: LOGO_URL });
        }
      });
      setUsers(contacts);
    });
  }, [user, selectedUser, notificationsEnabled]);

  // Listen to messages
  useEffect(() => {
    if (!user || !selectedUser) return;
    const chatId = [user.uid, selectedUser.uid].sort().join("_");
    
    // Mark as read
    const contactRef = doc(db, "users", user.uid, "myContacts", selectedUser.uid);
    updateDoc(contactRef, { hasNewMessage: false }).catch(() => {});
    
    const qMsg = query(
      collection(db, "messages"), 
      where("chatId", "==", chatId), 
      orderBy("createdAt", "asc")
    );
    
    return onSnapshot(qMsg, (s) => {
      const msgs = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      setTimeout(() => scroll.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
  }, [user, selectedUser]);

  // Listen to market
  useEffect(() => {
    const q = query(collection(db, "market"), orderBy("votes", "desc"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setMarketIdeas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  // Listen to leaderboard
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(10));
    return onSnapshot(q, (s) => setLeaderboard(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  // Listen to polls
  useEffect(() => {
    if (!user || !selectedUser) return;
    const chatId = [user.uid, selectedUser.uid].sort().join("_");
    const q = query(collection(db, "polls"), where("chatId", "==", chatId), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setPolls(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user, selectedUser]);

  // Listen to notes
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "notes"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setNotes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);
  const addContactByNumber = async () => {
    const number = prompt("Enter VORTEX ID:");
    if (!number || !user) return;
    const q = query(collection(db, "users"), where("phoneNumber", "==", number.trim()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const contact = snap.docs[0].data();
      if (contact.uid === user.uid) return alert("Error: Self-linkage blocked.");
      
      const batch = writeBatch(db);
      const contactData = {
        uid: contact.uid,
        displayName: contact.displayName,
        photoURL: contact.photoURL,
        bio: contact.bio || "",
        status: contact.status || "offline",
        phoneNumber: contact.phoneNumber || "",
        lastInteraction: serverTimestamp(),
        hasNewMessage: false
      };
      
      batch.set(doc(db, "users", user.uid, "myContacts", contact.uid), contactData);
      batch.set(doc(db, "users", contact.uid, "myContacts", user.uid), {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        bio: userData?.bio || "",
        status: "online",
        phoneNumber: userData?.phoneNumber || "",
        lastInteraction: serverTimestamp(),
        hasNewMessage: false
      });
      
      await batch.commit();
      alert("Signal Secured.");
    } else {
      alert("ID not found.");
    }
  };

  const handleSend = async (val, type = "text") => {
    const content = val || newMessage;
    if (!content.trim() || !selectedUser || !user) return;
    
    const chatId = [user.uid, selectedUser.uid].sort().join("_");
    const isEncrypted = type === "text";

    await addDoc(collection(db, "messages"), {
      text: isEncrypted ? encrypt(content) : content,
      type,
      senderId: user.uid,
      chatId,
      createdAt: serverTimestamp(),
      encrypted: isEncrypted,
      replyTo: replyingTo ? { text: replyingTo.text, senderId: replyingTo.senderId } : null,
      reactions: [],
      isBurner: burnerMode,
      readBy: [user.uid]
    });

    const batch = writeBatch(db);
    batch.update(doc(db, "users", selectedUser.uid, "myContacts", user.uid), {
      lastInteraction: serverTimestamp(),
      hasNewMessage: true
    });
    batch.update(doc(db, "users", user.uid, "myContacts", selectedUser.uid), {
      lastInteraction: serverTimestamp()
    });
    batch.update(doc(db, "users", user.uid), {
      messagesSent: increment(1),
      xp: increment(5)
    });
    await batch.commit();

    setNewMessage("");
    setReplyingTo(null);
    setKeyboardView("none");
    setBurnerMode(false);
  };

  const handleVote = async (id, currentVotes) => {
    await updateDoc(doc(db, "market", id), { votes: (currentVotes || 0) + 1 });
    if (user) await updateDoc(doc(db, "users", user.uid), { xp: increment(2) });
  };

  const handleReaction = async (msgId, emoji) => {
    await updateDoc(doc(db, "messages", msgId), {
      reactions: arrayUnion({ emoji, userId: user.uid })
    });
    setReactionId(null);
  };

  const handleDeleteMessage = async (msgId) => {
    if (window.confirm("Delete this signal?")) {
      await deleteDoc(doc(db, "messages", msgId));
    }
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(decrypt(text));
    alert("Signal copied");
  };

  const handlePinMessage = async (msgId) => {
    await updateDoc(doc(db, "messages", msgId), { isPinned: true });
  };

  const handleBookmark = async (msgId) => {
    await updateDoc(doc(db, "messages", msgId), { isBookmarked: true });
  };

  const handleCreatePoll = async () => {
    const question = prompt("Poll question:");
    if (!question || !selectedUser || !user) return;
    const options = [];
    for (let i = 0; i < 3; i++) {
      const opt = prompt(`Option ${i + 1} (leave empty to stop):`);
      if (!opt) break;
      options.push(opt);
    }
    if (options.length < 2) return alert("Need at least 2 options");
    
    const chatId = [user.uid, selectedUser.uid].sort().join("_");
    await addDoc(collection(db, "polls"), {
      question,
      options: options.map(o => ({ text: o, votes: 0, voters: [] })),
      chatId,
      createdBy: user.uid,
      createdAt: serverTimestamp()
    });
    await updateDoc(doc(db, "users", user.uid), { pollsCreated: increment(1), xp: increment(10) });
  };

  const handlePollVote = async (pollId, optionIndex) => {
    const pollRef = doc(db, "polls", pollId);
    const pollSnap = await getDocs(query(collection(db, "polls"), where("__name__", "==", pollId)));
    // Simplified - in production use transaction
  };

  const handleDiceRoll = async () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    await handleSend(`🎲 Rolled a ${roll}!`, "game");
    setGameScore(prev => prev + roll);
  };

  const handleCoinFlip = async () => {
    const result = Math.random() > 0.5 ? "Heads" : "Tails";
    await handleSend(`🪙 Flipped: ${result}!`, "game");
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !user) return;
    await addDoc(collection(db, "users", user.uid, "notes"), {
      text: newNote,
      createdAt: serverTimestamp()
    });
    setNewNote("");
  };

  const generateDailyChallenge = () => {
    const challenges = [
      "Send 5 encrypted signals",
      "React to 3 messages with 🔥",
      "Start a poll in any chat",
      "Share a GIF with 2 contacts"
    ];
    return challenges[Math.floor(Math.random() * challenges.length)];
  };

  const getChatId = () => {
    if (!user || !selectedUser) return "";
    return [user.uid, selectedUser.uid].sort().join("_");
  };
  if (loading) return (
    <div className="h-screen bg-[#060a16] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
    </div>
  );

  if (!user) return (
    <div className="h-screen bg-[#060a16] flex flex-col items-center justify-center p-10 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-green-500 animate-pulse"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
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
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Search signals..." className="bg-transparent outline-none text-xs w-full text-white" />
            </div>
          </div>

          <div className="px-6 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
            <button onClick={() => setShowNotes(!showNotes)} 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#11172b] border border-white/5 text-[10px] font-bold uppercase whitespace-nowrap hover:border-white/20 transition-colors">
              <Bookmark size={12}/> Notes
            </button>
            <button onClick={() => setDailyChallenge(generateDailyChallenge())} 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#11172b] border border-white/5 text-[10px] font-bold uppercase whitespace-nowrap hover:border-white/20 transition-colors">
              <Trophy size={12}/> Challenge
            </button>
            <button onClick={() => setActiveTab("leaderboard")} 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#11172b] border border-white/5 text-[10px] font-bold uppercase whitespace-nowrap hover:border-white/20 transition-colors">
              <TrendingUp size={12}/> Rank
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
            {users.length === 0 && (
              <div className="text-center py-20">
                <p className="text-slate-500 text-sm">No contacts yet</p>
                <p className="text-slate-600 text-[10px] mt-2">Tap + to add a VORTEX ID</p>
              </div>
            )}
            {users.filter(u => u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())).map((u) => (
              <div key={u.uid} onClick={() => setSelectedUser(u)} 
                className={`flex items-center gap-4 p-4 rounded-[28px] bg-[#0d1225] border border-white/5 transition-all hover:border-white/10 cursor-pointer ${u.hasNewMessage ? 'notification-glow' : ''}`}>
                <div className="relative">
                  <img src={u.photoURL} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0d1225] ${u.status === 'online' ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold uppercase text-[14px] truncate">{u.displayName}</h3>
                  <p className="text-[10px] opacity-50 uppercase truncate">{u.bio || "No status set"}</p>
                </div>
                {u.hasNewMessage && <div style={{backgroundColor: themeColor}} className="w-3 h-3 rounded-full animate-pulse"></div>}
              </div>
            ))}
          </div>
        </div>
      )}
      {!selectedUser && activeTab === "market" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 pt-12 glass border-b border-white/5">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Market Hub</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1">
              <TrendingUp size={10}/> {marketIdeas.length} Ideas
            </p>
          </header>
          <div className="p-6">
            <div className="bg-[#11172b] rounded-2xl p-3 flex gap-2 border border-white/10">
              <input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} 
                placeholder="Share idea..." className="bg-transparent flex-1 outline-none text-xs px-2 text-white" />
              <button onClick={async () => { 
                if (!newIdea.trim() || !user) return; 
                await addDoc(collection(db, "market"), { 
                  text: newIdea, authorId: user.uid, authorName: user.displayName,
                  createdAt: serverTimestamp(), votes: 0
                }); 
                setNewIdea(""); 
                await updateDoc(doc(db, "users", user.uid), { xp: increment(10) });
              }} style={{backgroundColor: themeColor}} 
                className="p-2 rounded-xl h-[40px] w-[40px] flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                <Send size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-32 scrollbar-hide">
            {marketIdeas.map((idea) => (
              <div key={idea.id} className="p-6 bg-[#11172b] rounded-[35px] border border-white/5 flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm mb-2">{idea.text}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><User size={10}/> {idea.authorName}</span>
                    <span>•</span>
                    <span>{idea.votes || 0} votes</span>
                  </div>
                </div>
                <button onClick={() => handleVote(idea.id, idea.votes)} 
                  className="flex flex-col items-center gap-1 ml-4 bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-colors active:scale-90">
                  <Flame size={16} className={idea.votes > 0 ? "text-orange-500" : "text-white/20"} />
                  <span className="text-[10px] font-black">{idea.votes || 0}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!selectedUser && activeTab === "market" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 pt-12 glass border-b border-white/5">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Market Hub</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1">
              <TrendingUp size={10}/> {marketIdeas.length} Ideas
            </p>
          </header>
          <div className="p-6">
            <div className="bg-[#11172b] rounded-2xl p-3 flex gap-2 border border-white/10">
              <input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} 
                placeholder="Share idea..." className="bg-transparent flex-1 outline-none text-xs px-2 text-white" />
              <button onClick={async () => { 
                if (!newIdea.trim() || !user) return; 
                await addDoc(collection(db, "market"), { 
                  text: newIdea, authorId: user.uid, authorName: user.displayName,
                  createdAt: serverTimestamp(), votes: 0
                }); 
                setNewIdea(""); 
                await updateDoc(doc(db, "users", user.uid), { xp: increment(10) });
              }} style={{backgroundColor: themeColor}} 
                className="p-2 rounded-xl h-[40px] w-[40px] flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                <Send size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-32 scrollbar-hide">
            {marketIdeas.map((idea) => (
              <div key={idea.id} className="p-6 bg-[#11172b] rounded-[35px] border border-white/5 flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm mb-2">{idea.text}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><User size={10}/> {idea.authorName}</span>
                    <span>•</span>
                    <span>{idea.votes || 0} votes</span>
                  </div>
                </div>
                <button onClick={() => handleVote(idea.id, idea.votes)} 
                  className="flex flex-col items-center gap-1 ml-4 bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-colors active:scale-90">
                  <Flame size={16} className={idea.votes > 0 ? "text-orange-500" : "text-white/20"} />
                  <span className="text-[10px] font-black">{idea.votes || 0}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!selectedUser && activeTab === "market" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 pt-12 glass border-b border-white/5">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Market Hub</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1">
              <TrendingUp size={10}/> {marketIdeas.length} Ideas
            </p>
          </header>
          <div className="p-6">
            <div className="bg-[#11172b] rounded-2xl p-3 flex gap-2 border border-white/10">
              <input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} 
                placeholder="Share idea..." className="bg-transparent flex-1 outline-none text-xs px-2 text-white" />
              <button onClick={async () => { 
                if (!newIdea.trim() || !user) return; 
                await addDoc(collection(db, "market"), { 
                  text: newIdea, authorId: user.uid, authorName: user.displayName,
                  createdAt: serverTimestamp(), votes: 0
                }); 
                setNewIdea(""); 
                await updateDoc(doc(db, "users", user.uid), { xp: increment(10) });
              }} style={{backgroundColor: themeColor}} 
                className="p-2 rounded-xl h-[40px] w-[40px] flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                <Send size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-32 scrollbar-hide">
            {marketIdeas.map((idea) => (
              <div key={idea.id} className="p-6 bg-[#11172b] rounded-[35px] border border-white/5 flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm mb-2">{idea.text}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><User size={10}/> {idea.authorName}</span>
                    <span>•</span>
                    <span>{idea.votes || 0} votes</span>
                  </div>
                </div>
                <button onClick={() => handleVote(idea.id, idea.votes)} 
                  className="flex flex-col items-center gap-1 ml-4 bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-colors active:scale-90">
                  <Flame size={16} className={idea.votes > 0 ? "text-orange-500" : "text-white/20"} />
                  <span className="text-[10px] font-black">{idea.votes || 0}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!selectedUser && activeTab === "market" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 pt-12 glass border-b border-white/5">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Market Hub</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1">
              <TrendingUp size={10}/> {marketIdeas.length} Ideas
            </p>
          </header>
          <div className="p-6">
            <div className="bg-[#11172b] rounded-2xl p-3 flex gap-2 border border-white/10">
              <input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} 
                placeholder="Share idea..." className="bg-transparent flex-1 outline-none text-xs px-2 text-white" />
              <button onClick={async () => { 
                if (!newIdea.trim() || !user) return; 
                await addDoc(collection(db, "market"), { 
                  text: newIdea, authorId: user.uid, authorName: user.displayName,
                  createdAt: serverTimestamp(), votes: 0
                }); 
                setNewIdea(""); 
                await updateDoc(doc(db, "users", user.uid), { xp: increment(10) });
              }} style={{backgroundColor: themeColor}} 
                className="p-2 rounded-xl h-[40px] w-[40px] flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                <Send size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-32 scrollbar-hide">
            {marketIdeas.map((idea) => (
              <div key={idea.id} className="p-6 bg-[#11172b] rounded-[35px] border border-white/5 flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm mb-2">{idea.text}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><User size={10}/> {idea.authorName}</span>
                    <span>•</span>
                    <span>{idea.votes || 0} votes</span>
                  </div>
                </div>
                <button onClick={() => handleVote(idea.id, idea.votes)} 
                  className="flex flex-col items-center gap-1 ml-4 bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-colors active:scale-90">
                  <Flame size={16} className={idea.votes > 0 ? "text-orange-500" : "text-white/20"} />
                  <span className="text-[10px] font-black">{idea.votes || 0}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!selectedUser && activeTab === "market" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 pt-12 glass border-b border-white/5">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Market Hub</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1">
              <TrendingUp size={10}/> {marketIdeas.length} Ideas
            </p>
          </header>
          <div className="p-6">
            <div className="bg-[#11172b] rounded-2xl p-3 flex gap-2 border border-white/10">
              <input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} 
                placeholder="Share idea..." className="bg-transparent flex-1 outline-none text-xs px-2 text-white" />
              <button onClick={async () => { 
                if (!newIdea.trim() || !user) return; 
                await addDoc(collection(db, "market"), { 
                  text: newIdea, authorId: user.uid, authorName: user.displayName,
                  createdAt: serverTimestamp(), votes: 0
                }); 
                setNewIdea(""); 
                await updateDoc(doc(db, "users", user.uid), { xp: increment(10) });
              }} style={{backgroundColor: themeColor}} 
                className="p-2 rounded-xl h-[40px] w-[40px] flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                <Send size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-32 scrollbar-hide">
            {marketIdeas.map((idea) => (
              <div key={idea.id} className="p-6 bg-[#11172b] rounded-[35px] border border-white/5 flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm mb-2">{idea.text}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><User size={10}/> {idea.authorName}</span>
                    <span>•</span>
                    <span>{idea.votes || 0} votes</span>
                  </div>
                </div>
                <button onClick={() => handleVote(idea.id, idea.votes)} 
                  className="flex flex-col items-center gap-1 ml-4 bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-colors active:scale-90">
                  <Flame size={16} className={idea.votes > 0 ? "text-orange-500" : "text-white/20"} />
                  <span className="text-[10px] font-black">{idea.votes || 0}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!selectedUser && activeTab === "market" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 pt-12 glass border-b border-white/5">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Market Hub</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1">
              <TrendingUp size={10}/> {marketIdeas.length} Ideas
            </p>
          </header>
          <div className="p-6">
            <div className="bg-[#11172b] rounded-2xl p-3 flex gap-2 border border-white/10">
              <input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} 
                placeholder="Share idea..." className="bg-transparent flex-1 outline-none text-xs px-2 text-white" />
              <button onClick={async () => { 
                if (!newIdea.trim() || !user) return; 
                await addDoc(collection(db, "market"), { 
                  text: newIdea, authorId: user.uid, authorName: user.displayName,
                  createdAt: serverTimestamp(), votes: 0
                }); 
                setNewIdea(""); 
                await updateDoc(doc(db, "users", user.uid), { xp: increment(10) });
              }} style={{backgroundColor: themeColor}} 
                className="p-2 rounded-xl h-[40px] w-[40px] flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                <Send size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-32 scrollbar-hide">
            {marketIdeas.map((idea) => (
              <div key={idea.id} className="p-6 bg-[#11172b] rounded-[35px] border border-white/5 flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm mb-2">{idea.text}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><User size={10}/> {idea.authorName}</span>
                    <span>•</span>
                    <span>{idea.votes || 0} votes</span>
                  </div>
                </div>
                <button onClick={() => handleVote(idea.id, idea.votes)} 
                  className="flex flex-col items-center gap-1 ml-4 bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-colors active:scale-90">
                  <Flame size={16} className={idea.votes > 0 ? "text-orange-500" : "text-white/20"} />
                  <span className="text-[10px] font-black">{idea.votes || 0}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!selectedUser && activeTab === "market" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 pt-12 glass border-b border-white/5">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Market Hub</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1">
              <TrendingUp size={10}/> {marketIdeas.length} Ideas
            </p>
          </header>
          <div className="p-6">
            <div className="bg-[#11172b] rounded-2xl p-3 flex gap-2 border border-white/10">
              <input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} 
                placeholder="Share idea..." className="bg-transparent flex-1 outline-none text-xs px-2 text-white" />
              <button onClick={async () => { 
                if (!newIdea.trim() || !user) return; 
                await addDoc(collection(db, "market"), { 
                  text: newIdea, authorId: user.uid, authorName: user.displayName,
                  createdAt: serverTimestamp(), votes: 0
                }); 
                setNewIdea(""); 
                await updateDoc(doc(db, "users", user.uid), { xp: increment(10) });
              }} style={{backgroundColor: themeColor}} 
                className="p-2 rounded-xl h-[40px] w-[40px] flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                <Send size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-32 scrollbar-hide">
            {marketIdeas.map((idea) => (
              <div key={idea.id} className="p-6 bg-[#11172b] rounded-[35px] border border-white/5 flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm mb-2">{idea.text}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><User size={10}/> {idea.authorName}</span>
                    <span>•</span>
                    <span>{idea.votes || 0} votes</span>
                  </div>
                </div>
                <button onClick={() => handleVote(idea.id, idea.votes)} 
                  className="flex flex-col items-center gap-1 ml-4 bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-colors active:scale-90">
                  <Flame size={16} className={idea.votes > 0 ? "text-orange-500" : "text-white/20"} />
                  <span className="text-[10px] font-black">{idea.votes || 0}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!selectedUser && activeTab === "market" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 pt-12 glass border-b border-white/5">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Market Hub</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1">
              <TrendingUp size={10}/> {marketIdeas.length} Ideas
            </p>
          </header>
          <div className="p-6">
            <div className="bg-[#11172b] rounded-2xl p-3 flex gap-2 border border-white/10">
              <input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} 
                placeholder="Share idea..." className="bg-transparent flex-1 outline-none text-xs px-2 text-white" />
              <button onClick={async () => { 
                if (!newIdea.trim() || !user) return; 
                await addDoc(collection(db, "market"), { 
                  text: newIdea, authorId: user.uid, authorName: user.displayName,
                  createdAt: serverTimestamp(), votes: 0
                }); 
                setNewIdea(""); 
                await updateDoc(doc(db, "users", user.uid), { xp: increment(10) });
              }} style={{backgroundColor: themeColor}} 
                className="p-2 rounded-xl h-[40px] w-[40px] flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                <Send size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-32 scrollbar-hide">
            {marketIdeas.map((idea) => (
              <div key={idea.id} className="p-6 bg-[#11172b] rounded-[35px] border border-white/5 flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm mb-2">{idea.text}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><User size={10}/> {idea.authorName}</span>
                    <span>•</span>
                    <span>{idea.votes || 0} votes</span>
                  </div>
                </div>
                <button onClick={() => handleVote(idea.id, idea.votes)} 
                  className="flex flex-col items-center gap-1 ml-4 bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-colors active:scale-90">
                  <Flame size={16} className={idea.votes > 0 ? "text-orange-500" : "text-white/20"} />
                  <span className="text-[10px] font-black">{idea.votes || 0}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!selectedUser && activeTab === "market" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 pt-12 glass border-b border-white/5">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Market Hub</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1">
              <TrendingUp size={10}/> {marketIdeas.length} Ideas
            </p>
          </header>
          <div className="p-6">
            <div className="bg-[#11172b] rounded-2xl p-3 flex gap-2 border border-white/10">
              <input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} 
                placeholder="Share idea..." className="bg-transparent flex-1 outline-none text-xs px-2 text-white" />
              <button onClick={async () => { 
                if (!newIdea.trim() || !user) return; 
                await addDoc(collection(db, "market"), { 
                  text: newIdea, authorId: user.uid, authorName: user.displayName,
                  createdAt: serverTimestamp(), votes: 0
                }); 
                setNewIdea(""); 
                await updateDoc(doc(db, "users", user.uid), { xp: increment(10) });
              }} style={{backgroundColor: themeColor}} 
                className="p-2 rounded-xl h-[40px] w-[40px] flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                <Send size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-32 scrollbar-hide">
            {marketIdeas.map((idea) => (
              <div key={idea.id} className="p-6 bg-[#11172b] rounded-[35px] border border-white/5 flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm mb-2">{idea.text}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><User size={10}/> {idea.authorName}</span>
                    <span>•</span>
                    <span>{idea.votes || 0} votes</span>
                  </div>
                </div>
                <button onClick={() => handleVote(idea.id, idea.votes)} 
                  className="flex flex-col items-center gap-1 ml-4 bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-colors active:scale-90">
                  <Flame size={16} className={idea.votes > 0 ? "text-orange-500" : "text-white/20"} />
                  <span className="text-[10px] font-black">{idea.votes || 0}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!selectedUser && activeTab === "market" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 pt-12 glass border-b border-white/5">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Market Hub</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1">
              <TrendingUp size={10}/> {marketIdeas.length} Ideas
            </p>
          </header>
          <div className="p-6">
            <div className="bg-[#11172b] rounded-2xl p-3 flex gap-2 border border-white/10">
              <input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} 
                placeholder="Share idea..." className="bg-transparent flex-1 outline-none text-xs px-2 text-white" />
              <button onClick={async () => { 
                if (!newIdea.trim() || !user) return; 
                await addDoc(collection(db, "market"), { 
                  text: newIdea, authorId: user.uid, authorName: user.displayName,
                  createdAt: serverTimestamp(), votes: 0
                }); 
                setNewIdea(""); 
                await updateDoc(doc(db, "users", user.uid), { xp: increment(10) });
              }} style={{backgroundColor: themeColor}} 
                className="p-2 rounded-xl h-[40px] w-[40px] flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                <Send size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-32 scrollbar-hide">
            {marketIdeas.map((idea) => (
              <div key={idea.id} className="p-6 bg-[#11172b] rounded-[35px] border border-white/5 flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm mb-2">{idea.text}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><User size={10}/> {idea.authorName}</span>
                    <span>•</span>
                    <span>{idea.votes || 0} votes</span>
                  </div>
                </div>
                <button onClick={() => handleVote(idea.id, idea.votes)} 
                  className="flex flex-col items-center gap-1 ml-4 bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-colors active:scale-90">
                  <Flame size={16} className={idea.votes > 0 ? "text-orange-500" : "text-white/20"} />
                  <span className="text-[10px] font-black">{idea.votes || 0}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!selectedUser && activeTab === "market" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 pt-12 glass border-b border-white/5">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Market Hub</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1">
              <TrendingUp size={10}/> {marketIdeas.length} Ideas
            </p>
          </header>
          <div className="p-6">
            <div className="bg-[#11172b] rounded-2xl p-3 flex gap-2 border border-white/10">
              <input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} 
                placeholder="Share idea..." className="bg-transparent flex-1 outline-none text-xs px-2 text-white" />
              <button onClick={async () => { 
                if (!newIdea.trim() || !user) return; 
                await addDoc(collection(db, "market"), { 
                  text: newIdea, authorId: user.uid, authorName: user.displayName,
                  createdAt: serverTimestamp(), votes: 0
                }); 
                setNewIdea(""); 
                await updateDoc(doc(db, "users", user.uid), { xp: increment(10) });
              }} style={{backgroundColor: themeColor}} 
                className="p-2 rounded-xl h-[40px] w-[40px] flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                <Send size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-32 scrollbar-hide">
            {marketIdeas.map((idea) => (
              <div key={idea.id} className="p-6 bg-[#11172b] rounded-[35px] border border-white/5 flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm mb-2">{idea.text}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><User size={10}/> {idea.authorName}</span>
                    <span>•</span>
                    <span>{idea.votes || 0} votes</span>
                  </div>
                </div>
                <button onClick={() => handleVote(idea.id, idea.votes)} 
                  className="flex flex-col items-center gap-1 ml-4 bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-colors active:scale-90">
                  <Flame size={16} className={idea.votes > 0 ? "text-orange-500" : "text-white/20"} />
                  <span className="text-[10px] font-black">{idea.votes || 0}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!selectedUser && activeTab === "market" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 pt-12 glass border-b border-white/5">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Market Hub</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1">
              <TrendingUp size={10}/> {marketIdeas.length} Ideas
            </p>
          </header>
          <div className="p-6">
            <div className="bg-[#11172b] rounded-2xl p-3 flex gap-2 border border-white/10">
              <input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} 
                placeholder="Share idea..." className="bg-transparent flex-1 outline-none text-xs px-2 text-white" />
              <button onClick={async () => { 
                if (!newIdea.trim() || !user) return; 
                await addDoc(collection(db, "market"), { 
                  text: newIdea, authorId: user.uid, authorName: user.displayName,
                  createdAt: serverTimestamp(), votes: 0
                }); 
                setNewIdea(""); 
                await updateDoc(doc(db, "users", user.uid), { xp: increment(10) });
              }} style={{backgroundColor: themeColor}} 
                className="p-2 rounded-xl h-[40px] w-[40px] flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                <Send size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-32 scrollbar-hide">
            {marketIdeas.map((idea) => (
              <div key={idea.id} className="p-6 bg-[#11172b] rounded-[35px] border border-white/5 flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm mb-2">{idea.text}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><User size={10}/> {idea.authorName}</span>
                    <span>•</span>
                    <span>{idea.votes || 0} votes</span>
                  </div>
                </div>
                <button onClick={() => handleVote(idea.id, idea.votes)} 
                  className="flex flex-col items-center gap-1 ml-4 bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-colors active:scale-90">
                  <Flame size={16} className={idea.votes > 0 ? "text-orange-500" : "text-white/20"} />
                  <span className="text-[10px] font-black">{idea.votes || 0}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!selectedUser && activeTab === "market" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 pt-12 glass border-b border-white/5">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Market Hub</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1">
              <TrendingUp size={10}/> {marketIdeas.length} Ideas
            </p>
          </header>
          <div className="p-6">
            <div className="bg-[#11172b] rounded-2xl p-3 flex gap-2 border border-white/10">
              <input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} 
                placeholder="Share idea..." className="bg-transparent flex-1 outline-none text-xs px-2 text-white" />
              <button onClick={async () => { 
                if (!newIdea.trim() || !user) return; 
                await addDoc(collection(db, "market"), { 
                  text: newIdea, authorId: user.uid, authorName: user.displayName,
                  createdAt: serverTimestamp(), votes: 0
                }); 
                setNewIdea(""); 
                await updateDoc(doc(db, "users", user.uid), { xp: increment(10) });
              }} style={{backgroundColor: themeColor}} 
                className="p-2 rounded-xl h-[40px] w-[40px] flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                <Send size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-32 scrollbar-hide">
            {marketIdeas.map((idea) => (
              <div key={idea.id} className="p-6 bg-[#11172b] rounded-[35px] border border-white/5 flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm mb-2">{idea.text}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><User size={10}/> {idea.authorName}</span>
                    <span>•</span>
                    <span>{idea.votes || 0} votes</span>
                  </div>
                </div>
                <button onClick={() => handleVote(idea.id, idea.votes)} 
                  className="flex flex-col items-center gap-1 ml-4 bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-colors active:scale-90">
                  <Flame size={16} className={idea.votes > 0 ? "text-orange-500" : "text-white/20"} />
                  <span className="text-[10px] font-black">{idea.votes || 0}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!selectedUser && activeTab === "market" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 pt-12 glass border-b border-white/5">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Market Hub</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1">
              <TrendingUp size={10}/> {marketIdeas.length} Ideas
            </p>
          </header>
          <div className="p-6">
            <div className="bg-[#11172b] rounded-2xl p-3 flex gap-2 border border-white/10">
              <input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} 
                placeholder="Share idea..." className="bg-transparent flex-1 outline-none text-xs px-2 text-white" />
              <button onClick={async () => { 
                if (!newIdea.trim() || !user) return; 
                await addDoc(collection(db, "market"), { 
                  text: newIdea, authorId: user.uid, authorName: user.displayName,
                  createdAt: serverTimestamp(), votes: 0
                }); 
                setNewIdea(""); 
                await updateDoc(doc(db, "users", user.uid), { xp: increment(10) });
              }} style={{backgroundColor: themeColor}} 
                className="p-2 rounded-xl h-[40px] w-[40px] flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                <Send size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-32 scrollbar-hide">
            {marketIdeas.map((idea) => (
              <div key={idea.id} className="p-6 bg-[#11172b] rounded-[35px] border border-white/5 flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm mb-2">{idea.text}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><User size={10}/> {idea.authorName}</span>
                    <span>•</span>
                    <span>{idea.votes || 0} votes</span>
                  </div>
                </div>
                <button onClick={() => handleVote(idea.id, idea.votes)} 
                  className="flex flex-col items-center gap-1 ml-4 bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-colors active:scale-90">
                  <Flame size={16} className={idea.votes > 0 ? "text-orange-500" : "text-white/20"} />
                  <span className="text-[10px] font-black">{idea.votes || 0}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
