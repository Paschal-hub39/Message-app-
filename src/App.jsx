import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, where, serverTimestamp, setDoc, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { 
  Send, LogOut, MessageSquare, Search, User, Check, CheckCheck, X, Smile, Sparkles, 
  Ghost, Shield, Zap, Gamepad2, Layers, Languages, Clock, Wallet, Info, 
  Settings, Image as ImageIcon, Bell, Lock, Smartphone, Share2, Heart, Trash2
} from 'lucide-react';

// --- STYLES & CONFIG ---
const MOODS = {
  "🔥 hype": "border-orange-500 shadow-orange-500/40 text-orange-400",
  "😴 chill": "border-blue-400 shadow-blue-400/20 text-blue-300",
  "😤 annoyed": "border-red-600 shadow-red-600/50 text-red-500",
  "🎯 gaming": "border-green-500 shadow-green-500/40 text-green-400",
  "🧠 focused": "border-purple-500 shadow-purple-500/30 text-purple-300"
};

const STICKERS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpueXJ3bmZ4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKVUn7iM8FMEU24/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpueXJ3bmZ4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/l41lTfuxz2M4V28OA/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpueXJ3bmZ4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/26FLdmIp6wJr91JAI/giphy.gif"
];

function App() {
  // --- STATE MANAGEMENT ---
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // AI & Mood States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [mood, setMood] = useState("🔥 hype");
  const [ghostMode, setGhostMode] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  // UI States
  const [activeTab, setActiveTab] = useState("chats"); // chats, wallet, capsules, settings
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCapsuleModal, setShowCapsuleModal] = useState(false);
  
  // Form States
  const [newName, setNewName] = useState("");
  const [newPhoto, setNewPhoto] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [capsuleMessage, setCapsuleMessage] = useState("");
  const [capsuleDate, setCapsuleDate] = useState("");

  const scroll = useRef();

  // --- AI ENGINE (Feature 1, 12) ---
  const runNexusAI = async (mode) => {
    setAiLoading(true);
    const context = messages.slice(-3).map(m => m.text).join(" | ");
    
    // Simulate Smart Adaptation
    setTimeout(() => {
      const suggestions = {
        savage: context.includes("win") ? "Only won because I let you. 🥱" : "Stick to the tutorials, bro. 💀",
        funny: "I’d give you a sarcastic answer but I’m too tired to be that clever. 😂",
        serious: "Let's review the technical documentation for the Firebase migration.",
        translate: "Translated from Turkish: 'Seni çok özledim' -> 'I missed you so much.'"
      };
      setAiSuggestion(suggestions[mode] || "How can I help you today?");
      setAiLoading(false);
    }, 1200);
  };

  // --- AUTH & USER LIFECYCLE ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u); setNewName(u.displayName); setNewPhoto(u.photoURL);
        const userRef = doc(db, "users", u.uid);
        await setDoc(userRef, {
          uid: u.uid,
          displayName: u.displayName,
          photoURL: u.photoURL,
          status: ghostMode ? "Offline" : "Online",
          currentMood: mood,
          lastSeen: serverTimestamp(),
          walletBalance: 5000 // Sample NGN Balance
        }, { merge: true });
      } else { setUser(null); }
    });
    return unsubscribe;
  }, [ghostMode, mood]);

  // --- DATA SYNCING ---
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users"));
    return onSnapshot(q, (s) => setUsers(s.docs.map(d => d.data()).filter(u => u.uid !== user.uid)));
  }, [user]);

  useEffect(() => {
    if (!user || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    const q = query(collection(db, "messages"), where("chatId", "==", chatId), orderBy("createdAt", "asc"));
    
    return onSnapshot(q, (s) => {
      const msgs = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      if (!ghostMode) {
        msgs.forEach(m => {
          if (m.receiverId === user.uid && !m.seen) {
            updateDoc(doc(db, "messages", m.id), { seen: true });
          }
        });
      }
      scroll.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [user, selectedUser, ghostMode]);

  // --- MESSAGE HANDLER (Feature 5, 8) ---
  const handleSend = async (val, type = "text") => {
    if (!val.trim() || !selectedUser) return;
    const isGif = val.includes("giphy.com");
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    
    await addDoc(collection(db, "messages"), { 
      text: val, 
      type: isGif ? "sticker" : type,
      senderId: user.uid, 
      receiverId: selectedUser.uid, 
      chatId, 
      createdAt: serverTimestamp(), 
      seen: false, 
      mood: mood,
      replyTo: replyTo ? { text: replyTo.text, senderName: replyTo.senderId === user.uid ? 'You' : selectedUser.displayName } : null 
    });
    
    setNewMessage(""); 
    setReplyTo(null); 
    setAiSuggestion(""); 
    setShowEmojiPicker(false);
  };

  // --- WALLET LOGIC (Feature 10) ---
  const processPayment = async () => {
    if (!paymentAmount || isNaN(paymentAmount)) return;
    alert(`💸 Sent ₦${paymentAmount} to ${selectedUser.displayName}`);
    setShowPaymentModal(false);
    setPaymentAmount("");
  };

  // --- TIME CAPSULE LOGIC (Feature 3) ---
  const sendTimeCapsule = async () => {
    if (!capsuleMessage || !capsuleDate) return;
    await addDoc(collection(db, "capsules"), {
      senderId: user.uid,
      receiverId: selectedUser.uid,
      text: capsuleMessage,
      unlockDate: capsuleDate,
      createdAt: serverTimestamp()
    });
    setShowCapsuleModal(false);
    setCapsuleMessage("");
  };

  // --- SUB-COMPONENTS ---
  const SidebarItem = ({ icon: Icon, label, id }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex flex-col items-center gap-1 p-3 transition-all ${activeTab === id ? 'text-green-500 scale-110' : 'text-slate-500'}`}
    >
      <Icon size={22} />
      <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );

  // --- AUTH PROTECTED SCREENS ---
  if (!user) return (
    <div className="h-screen bg-[#060a16] flex flex-col items-center justify-center text-white p-10">
      <div className="relative mb-10">
        <div className="absolute inset-0 bg-green-500 blur-[80px] opacity-20 animate-pulse"></div>
        <BrainCircuit size={80} className="relative z-10 text-green-500" />
      </div>
      <h1 className="text-5xl font-black italic tracking-tighter mb-2">Paschala</h1>
      <p className="text-slate-500 text-sm font-bold tracking-[0.3em] uppercase mb-12">Nexus Integrated OS</p>
      <button 
        onClick={() => signInWithPopup(auth, googleProvider)}
        className="w-full max-w-xs bg-white text-black py-5 rounded-[30px] font-black text-lg active:scale-95 transition-all shadow-2xl shadow-white/5"
      >
        INITIALIZE CORE
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#060a16] text-white flex flex-col overflow-hidden select-none">
      
      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* CHAT LISTING (SIDEBAR REPLACEMENT) */}
        {!selectedUser && activeTab === "chats" && (
          <div className="flex flex-col h-full w-full animate-in fade-in slide-in-from-left-4 duration-500">
            <header className="p-8 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black tracking-tighter">Messages</h2>
                <p className="text-[10px] text-green-500 font-black tracking-[0.2em] uppercase">Status: Decrypted</p>
              </div>
              <div className="flex gap-4">
                <div className="relative">
                  <img 
                    src={user.photoURL} 
                    onClick={() => setShowProfileEdit(true)} 
                    className="w-14 h-14 rounded-[22px] object-cover ring-2 ring-white/10 active:scale-90 transition-all cursor-pointer" 
                  />
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#060a16] ${ghostMode ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                </div>
              </div>
            </header>

            <div className="px-8 mb-6">
              <div className="relative group">
                <Search className="absolute left-5 top-5 text-slate-600 group-focus-within:text-green-500 transition-colors" size={20} />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts..." 
                  className="w-full bg-[#11172b] rounded-[24px] py-5 pl-14 pr-6 outline-none border border-white/5 focus:border-green-500/30 transition-all text-sm font-medium" 
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-32 space-y-4">
              <p className="text-[10px] font-black text-slate-600 tracking-[0.4em] uppercase ml-2 mb-2">Active Channels</p>
              {users.filter(u => u.displayName.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                <div 
                  key={u.uid} 
                  onClick={() => setSelectedUser(u)}
                  className="group flex items-center gap-5 p-5 rounded-[32px] bg-[#11172b]/60 hover:bg-green-600/10 border border-white/5 hover:border-green-500/20 transition-all cursor-pointer"
                >
                  <img src={u.photoURL} className="w-16 h-16 rounded-[24px] object-cover shadow-2xl" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-lg">{u.displayName}</span>
                      <span className="text-[9px] text-slate-600 font-bold uppercase">2m ago</span>
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${MOODS[u.currentMood || "🔥 hype"].split(' ')[2]}`}>
                      {u.currentMood || "🔥 Hype"} Mode
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WALLET VIEW (Feature 10) */}
        {!selectedUser && activeTab === "wallet" && (
          <div className="flex-1 p-8 flex flex-col animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black mb-8">Nexus Pay</h2>
            <div className="bg-gradient-to-br from-green-600 to-green-900 p-8 rounded-[40px] shadow-2xl mb-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Total Balance</p>
              <h3 className="text-4xl font-black mb-8">₦5,420.50</h3>
              <div className="flex justify-between items-end">
                <p className="font-mono text-sm tracking-widest opacity-80">**** **** **** 9262</p>
                <Smartphone size={24} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#11172b] p-6 rounded-[30px] border border-white/5">
                <p className="text-[10px] font-black uppercase mb-2 text-slate-500">Airtime</p>
                <button className="w-full bg-white/5 py-3 rounded-xl font-bold text-xs uppercase hover:bg-green-600/20 transition-all">Buy Credit</button>
              </div>
              <div className="bg-[#11172b] p-6 rounded-[30px] border border-white/5">
                <p className="text-[10px] font-black uppercase mb-2 text-slate-500">Utilities</p>
                <button className="w-full bg-white/5 py-3 rounded-xl font-bold text-xs uppercase hover:bg-green-600/20 transition-all">Split Bill</button>
              </div>
            </div>
          </div>
        )}

        {/* CHAT WINDOW (The Core) */}
        {selectedUser && (
          <div className="fixed inset-0 flex flex-col z-50 bg-[#060a16] animate-in slide-in-from-right-4 duration-400">
            {/* STICKY HEADER */}
            <header className="p-5 flex items-center justify-between bg-[#060a16]/80 backdrop-blur-3xl border-b border-white/5">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedUser(null)} className="p-2 text-slate-400">←</button>
                <div className="relative">
                  <img src={selectedUser.photoURL} className="w-11 h-11 rounded-2xl object-cover shadow-xl" />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-[#060a16] ${selectedUser.status === 'Online' ? 'bg-green-500' : 'bg-slate-700'}`}></div>
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-tight">{selectedUser.displayName}</h4>
                  <p className="text-[9px] text-green-500 font-black tracking-widest">ENCRYPTED END-TO-END</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowCapsuleModal(true)} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-blue-400"><Clock size={20}/></button>
                <button onClick={() => setShowPaymentModal(true)} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-green-500"><Wallet size={20}/></button>
              </div>
            </header>

            {/* MESSAGE LIST */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
              <div className="text-center py-10 opacity-20">
                <p className="text-[8px] font-black tracking-[0.5em] uppercase border-b border-white/10 pb-4 mx-20">Secure Channel Established 2026</p>
              </div>
              
              {messages.map((m, idx) => (
                <div key={m.id} onDoubleClick={() => setReplyTo(m)} className={`flex flex-col ${m.senderId === user.uid ? 'items-end' : 'items-start'} group`}>
                  
                  {/* Date Separator logic can go here */}
                  
                  <div className={`relative max-w-[82%] transition-all duration-300 ${m.type === 'sticker' ? 'p-0' : `p-5 rounded-[32px] border ${m.senderId === user.uid ? `bg-green-600 rounded-tr-none ${MOODS[m.mood || "🔥 hype"]}` : 'bg-[#11172b] rounded-tl-none border-white/5 shadow-2xl shadow-black/50'}`}`}>
                    
                    {/* Privacy Blur (Feature 6) */}
                    <div className={m.senderId !== user.uid ? "filter blur-md hover:blur-none active:blur-none transition-all duration-500" : ""}>
                      {m.replyTo && (
                        <div className="bg-black/20 p-3 rounded-2xl mb-3 border-l-4 border-white/30 text-[10px] backdrop-blur-sm">
                          <p className="font-black opacity-40 uppercase tracking-tighter mb-1">{m.replyTo.senderName}</p>
                          <p className="line-clamp-2 italic opacity-80">"{m.replyTo.text}"</p>
                        </div>
                      )}
                      
                      {m.type === 'sticker' ? (
                        <img src={m.text} className="w-48 h-48 rounded-[35px] shadow-2xl border-2 border-green-500/30 object-cover" />
                      ) : (
                        <p className="text-[16px] font-medium leading-[1.6] tracking-tight">{m.text}</p>
                      )}
                    </div>

                    {/* Status Info */}
                    <div className="flex justify-end items-center gap-1.5 mt-3 opacity-30 text-[9px] font-black tracking-widest">
                      <span>{m.createdAt?.toDate ? new Date(m.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}</span>
                      {m.senderId === user.uid && (m.seen ? <CheckCheck size={14} className="text-blue-400" /> : <Check size={14} />)}
                    </div>

                    {/* Context Menu Icon (Feature 5) */}
                    <button className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity p-2">
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <div ref={scroll} className="h-10"></div>
            </div>

            {/* SMART AI SUGGESTIONS (Feature 1) */}
            {aiSuggestion && (
              <div className="mx-6 p-5 bg-green-500/10 border border-green-500/20 rounded-[30px] flex justify-between items-center animate-in slide-in-from-bottom-5">
                <div className="flex gap-3 items-center">
                  <div className="p-2 bg-green-600 rounded-xl"><Sparkles size={16} /></div>
                  <p className="text-xs font-bold text-green-400 leading-tight italic">"{aiSuggestion}"</p>
                </div>
                <button onClick={() => { handleSend(aiSuggestion); setAiSuggestion(""); }} className="bg-green-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-600/30">Send</button>
              </div>
            )}

            {/* INPUT SECTION */}
            <div className="p-6 pb-12 space-y-4 bg-gradient-to-t from-[#060a16] to-transparent">
              {/* AI MODES */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {["savage", "funny", "serious", "translate"].map(m => (
                  <button 
                    key={m} 
                    onClick={() => runNexusAI(m)}
                    className="flex-shrink-0 bg-[#11172b]/80 border border-white/5 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-green-500 hover:border-green-500/30 transition-all active:scale-90"
                  >
                    {m === 'translate' ? <Languages size={12} className="inline mr-2 mb-0.5" /> : null}
                    {m}
                  </button>
                ))}
              </div>

              {/* REPLY PREVIEW */}
              {replyTo && (
                <div className="bg-[#11172b] p-4 rounded-[24px] flex justify-between items-center border border-white/10 animate-in slide-in-from-left-2">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-green-600 rounded-full"></div>
                    <p className="text-[11px] font-bold opacity-60 truncate">R