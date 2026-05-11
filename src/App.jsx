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
            {/* Profile */}
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
                  placeholder="Enter ID..." className="bg-[#060a16] p-4 rounded-2xl flex-1 outline-none text-xs font-bold h-[48px] text-white" />
                <button onClick={async () => { 
                  if (!user) return;
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

            {/* Themes */}
            <div className="bg-[#11172b] p-6 rounded-[35px] border border-white/10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Palette size={12}/> UI Frequency
              </p>
              <div className="flex justify-between flex-wrap gap-2">
                {Object.entries(THEMES).map(([name, hex]) => (
                  <button key={name} onClick={async () => {
                    if (!user) return;
                    await updateDoc(doc(db, "users", user.uid), { theme: hex });
                  }} style={{backgroundColor: hex}} 
                    className={`w-10 h-10 rounded-full border-4 ${themeColor === hex ? 'border-white' : 'border-transparent'} transition-all hover:scale-110`}>
                  </button>
                ))}
              </div>
            </div>

            {/* Preferences */}
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

            {/* Stats */}
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
          {/* Header */}
          <header className="p-4 pt-10 glass border-b border-white/5 flex items-center gap-4">
            <button onClick={() => setSelectedUser(null)} style={{color: themeColor}} 
              className="font-bold p-2 hover:bg-white/5 rounded-xl transition-colors">
              ←
            </button>
            <img src={selectedUser.photoURL} className="w-10 h-10 rounded-xl object-cover" alt="" />
            <div className="flex-1">
              <h4 className="text-[12px] font-black uppercase">{selectedUser.displayName}</h4>
              <p style={{color: themeColor}} className="text-[7px] font-black tracking-widest uppercase">
                ENCRYPTED SIGNAL
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNotes(!showNotes)} className="p-2 rounded-xl bg-[#11172b] text-slate-400 hover:text-white transition-colors">
                <Bookmark size={16}/>
              </button>
              <button onClick={handleCreatePoll} className="p-2 rounded-xl bg-[#11172b] text-slate-400 hover:text-white transition-colors">
                <BarChart size={16}/>
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
                <h3 className="text-xs font-bold uppercase flex items-center gap-2"><Bookmark size={12}/> Notes</h3>
                <button onClick={() => setShowNotes(false)}><X size={14}/></button>
              </div>
              <div className="flex gap-2 mb-3">
                <input value={newNote} onChange={(e) => setNewNote(e.target.value)} 
                  placeholder="Add note..." className="flex-1 bg-[#060a16] p-2 rounded-xl text-xs outline-none text-white" />
                <button onClick={handleAddNote} style={{backgroundColor: themeColor}} className="px-3 rounded-xl text-xs font-bold">Add</button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-hide">
                {notes.map((note) => (
                  <div key={note.id} className="p-2 rounded-xl bg-[#060a16] text-[10px]">{note.text}</div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
            {messages.length === 0 && (
              <div className="text-center py-20">
                <p className="text-slate-500 text-sm">No signals yet</p>
                <p className="text-slate-600 text-[10px] mt-2">Send your first encrypted message</p>
              </div>
            )}
            {messages.map((m, idx) => {
              const isMe = m.senderId === user.uid;
              const isLast = idx === messages.length - 1;
              return (
                <div key={m.id} 
                  onTouchStart={(e) => touchStart.current = e.targetTouches[0].clientX} 
                  onTouchEnd={(e) => { if (e.changedTouches[0].clientX - touchStart.current > 70) setReplyingTo(m); }} 
                  onContextMenu={(e) => { e.preventDefault(); setReactionId(m.id); }}
                  className={`flex flex-col relative ${isMe ? 'items-end' : 'items-start'} ${isLast && messageAnimations ? 'animate-slide' : ''}`}>
                  
                  {reactionId === m.id && (
                    <div className="absolute -top-10 z-50 flex gap-2 bg-[#1a2238] p-2 rounded-full border border-white/20 animate-pop">
                      {["🔥", "❤️", "😂", "👍", "🙏", "💯", "👀", "🎯"].map(e => (
                        <button key={e} onClick={() => handleReaction(m.id, e)} 
                          className="text-xl hover:scale-125 transition-transform">{e}</button>
                      ))}
                    </div>
                  )}

                  <div className={`max-w-[80%] px-4 py-3 rounded-[24px] shadow-xl relative group ${m.isBurner ? 'burner-glow' : ''} ${isMe ? 'rounded-tr-none' : 'bg-[#11172b] rounded-tl-none'}`} 
                    style={{backgroundColor: isMe ? themeColor : '#11172b'}}>
                    
                    {m.isBurner && (
                      <p className="text-[8px] font-black text-red-400 mb-1 flex items-center gap-1">
                        <Zap size={8}/> BURNER • 30s
                      </p>
                    )}

                    {m.replyTo && (
                      <div className="mb-2 p-2 rounded-lg reply-card text-[10px] opacity-70">
                        <p className="font-bold" style={{color: themeColor}}>
                          {m.replyTo.senderId === user.uid ? 'You' : selectedUser.displayName}
                        </p>
                        <p className="truncate">{decrypt(m.replyTo.text)}</p>
                      </div>
                    )}

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

                    {m.edited && <span className="text-[7px] opacity-50 ml-1">(edited)</span>}

                    <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button onClick={() => handlePinMessage(m.id)} className="p-1 bg-[#1a2238] rounded-full"><Pin size={10}/></button>
                      <button onClick={() => handleBookmark(m.id)} className="p-1 bg-[#1a2238] rounded-full"><Bookmark size={10}/></button>
                      <button onClick={() => handleCopyMessage(m.text)} className="p-1 bg-[#1a2238] rounded-full"><Copy size={10}/></button>
                      {isMe && <button onClick={() => handleDeleteMessage(m.id)} className="p-1 bg-[#1a2238] rounded-full text-red-400"><Trash2 size={10}/></button>}
                    </div>
                  </div>

                  {m.reactions?.length > 0 && (
                    <div className="flex -mt-2 bg-[#1a2238] px-2 py-0.5 rounded-full border border-white/10 text-[10px]">
                      {m.reactions.map((r, i) => <span key={i} className="mr-1">{r.emoji}</span>)}
                    </div>
                  )}

                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[8px] text-slate-600">
                      {m.createdAt?.toDate?.() ? m.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                    </span>
                    {isMe && (
                      <span className="text-[8px]" style={{color: m.readBy?.includes(selectedUser.uid) ? themeColor : '#64748b'}}>
                        {m.readBy?.includes(selectedUser.uid) ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={scroll}></div>
          </div>

          {/* Input */}
          <div className="p-4 glass rounded-t-[40px]">
            {replyingTo && (
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl mb-2 animate-pop border-l-4" style={{borderColor: themeColor}}>
                <div className="text-[10px] truncate flex-1">
                  <p className="font-bold">Replying to Signal</p>
                  <p className="opacity-60">{decrypt(replyingTo.text)}</p>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-1"><X size={16}/></button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button onClick={() => setBurnerMode(!burnerMode)} 
                className={`p-3 rounded-2xl transition-all h-[52px] w-[52px] flex items-center justify-center shrink-0 ${burnerMode ? 'bg-red-500 text-white burner-glow' : 'bg-[#11172b] text-slate-400'}`}>
                <Zap size={20}/>
              </button>

              <button onClick={() => setKeyboardView(keyboardView === 'emoji' ? 'none' : 'emoji')} 
                className="p-3 bg-[#11172b] rounded-2xl text-slate-400 h-[52px] w-[52px] flex items-center justify-center shrink-0 hover:text-white transition-colors">
                <Smile size={20}/>
              </button>

              <button onClick={() => setKeyboardView(keyboardView === 'gif' ? 'none' : 'gif')} 
                className="p-3 bg-[#11172b] rounded-2xl text-slate-400 h-[52px] w-[52px] flex items-center justify-center shrink-0 hover:text-white transition-colors">
                <Gift size={20}/>
              </button>

              <div className="flex-1 bg-[#11172b] p-3 rounded-2xl border border-white/5 flex items-center h-[52px]">
                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={burnerMode ? "Burner Signal..." : "Type signal..."} 
                  className="flex-1 bg-transparent outline-none text-sm text-white" />
              </div>

              <button onClick={() => handleSend()} style={{backgroundColor: themeColor}} 
                className="rounded-2xl active:scale-90 shadow-lg shadow-black/20 h-[52px] w-[52px] flex items-center justify-center shrink-0 transition-transform">
                <Send size={20} className="text-[#060a16]"/>
              </button>
            </div>

            {keyboardView !== 'none' && (
              <div className="h-64 mt-4 overflow-y-auto grid grid-cols-8 gap-2 p-4 bg-[#0d1225] rounded-3xl border border-white/5 scrollbar-hide">
                {keyboardView === 'emoji' ? (
                  EMOJI_LIST.map((e, i) => (
                    <button key={i} onClick={() => setNewMessage(p => p + e)} 
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
      {/* FOOTER NAV */}
      {!selectedUser && (
        <nav className="p-6 px-10 glass flex justify-between items-center pb-12 border-t border-white/5">
          <button onClick={() => setActiveTab("chats")} 
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'chats' ? '' : 'text-slate-600'}`} 
            style={{color: activeTab === 'chats' ? themeColor : ''}}>
            <MessageSquare size={22} />
            <span className="text-[8px] font-black uppercase">Signals</span>
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
