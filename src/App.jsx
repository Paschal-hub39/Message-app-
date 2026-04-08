import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, addDoc, query, orderBy, onSnapshot, where, 
  serverTimestamp, setDoc, doc, updateDoc 
} from 'firebase/firestore';
import { 
  Send, MessageSquare, Search, User, Check, CheckCheck, X, Smile, Sparkles, 
  Ghost, Shield, Zap, Gamepad2, Languages, Clock, Wallet, Settings, Smartphone, Share2
} from 'lucide-react';

// --- CONFIGURATION ---
const MOODS = {
  "🔥 hype": "border-orange-500 shadow-orange-500/40 text-orange-400",
  "😴 chill": "border-blue-400 shadow-blue-400/20 text-blue-300",
  "😤 annoyed": "border-red-600 shadow-red-600/50 text-red-500",
  "🎯 gaming": "border-green-500 shadow-green-500/40 text-green-400"
};

const STICKERS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpueXJ3bmZ4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKVUn7iM8FMEU24/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpueXJ3bmZ4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/l41lTfuxz2M4V28OA/giphy.gif"
];

function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Advanced States
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [mood, setMood] = useState("🔥 hype");
  const [ghostMode, setGhostMode] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [activeTab, setActiveTab] = useState("chats");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCapsuleModal, setShowCapsuleModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [capsuleMessage, setCapsuleMessage] = useState("");
  const [capsuleDate, setCapsuleDate] = useState("");

  const scroll = useRef();

  // --- CORE ENGINE ---
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        await setDoc(doc(db, "users", u.uid), {
          uid: u.uid, displayName: u.displayName, photoURL: u.photoURL,
          status: ghostMode ? "Offline" : "Online", currentMood: mood,
          lastSeen: serverTimestamp(), walletBalance: 5000
        }, { merge: true });
      } else { setUser(null); }
    });
  }, [ghostMode, mood]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "users"), (s) => 
      setUsers(s.docs.map(d => d.data()).filter(u => u.uid !== user.uid))
    );
  }, [user]);

  useEffect(() => {
    if (!user || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    const q = query(collection(db, "messages"), where("chatId", "==", chatId), orderBy("createdAt", "asc"));
    
    return onSnapshot(q, (s) => {
      setMessages(s.docs.map(d => ({ id: d.id, ...d.data() })));
      if (!ghostMode) {
        s.docs.forEach(d => d.data().receiverId === user.uid && !d.data().seen && updateDoc(doc(db, "messages", d.id), { seen: true }));
      }
      scroll.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [user, selectedUser, ghostMode]);

  // --- ACTION HANDLERS ---
  const handleSend = async (val, type = "text") => {
    if (!val.trim() || !selectedUser) return;
    const isGif = val.includes("giphy.com") || val.includes("media.giphy");
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    
    await addDoc(collection(db, "messages"), { 
      text: val, 
      type: isGif ? "sticker" : type,
      senderId: user.uid, receiverId: selectedUser.uid, chatId, 
      createdAt: serverTimestamp(), seen: false, mood: mood,
      replyTo: replyTo ? { text: replyTo.text, senderName: replyTo.senderId === user.uid ? 'You' : selectedUser.displayName } : null 
    });
    setNewMessage(""); setReplyTo(null); setAiSuggestion(""); setShowEmojiPicker(false);
  };

  const askAI = (mode) => {
    const suggestions = {
      savage: "Imagine losing to a 4-3-1-2 formation. 🥱",
      funny: "I'm on energy-saving mode, don't stress me. 😂",
      translate: "TR -> EN: 'Seni seviyorum' means 'I love you'."
    };
    setAiSuggestion(suggestions[mode]);
  };

  // --- UI COMPONENTS ---
  if (!user) return (
    <div className="h-screen bg-[#060a16] flex flex-col items-center justify-center p-10">
      <Zap size={80} className="text-green-500 mb-8 animate-pulse" />
      <h1 className="text-5xl font-black italic tracking-tighter mb-12">Paschala</h1>
      <button onClick={() => signInWithPopup(auth, googleProvider)} className="w-full max-w-xs bg-white text-black py-5 rounded-[30px] font-black shadow-2xl">LOGIN</button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#060a16] text-white flex flex-col overflow-hidden">
      
      {/* MAIN VIEW */}
      {!selectedUser ? (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
          <header className="p-8 flex justify-between items-center bg-[#0d1225]">
            <h2 className="text-3xl font-black tracking-tighter">NexusOS</h2>
            <img src={user.photoURL} className="w-12 h-12 rounded-2xl ring-2 ring-green-500" />
          </header>
          
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-5 top-5 text-slate-600" size={20} />
              <input 
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search decrypted channels..." 
                className="w-full bg-[#11172b] rounded-3xl py-5 pl-14 outline-none border border-white/5" 
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 space-y-4">
            {users.filter(u => u.displayName.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
              <div key={u.uid} onClick={() => setSelectedUser(u)} className="flex items-center gap-5 p-5 rounded-[32px] bg-[#11172b] border border-white/5">
                <img src={u.photoURL} className="w-16 h-16 rounded-3xl object-cover" />
                <div className="flex-1">
                  <p className="font-bold text-lg">{u.displayName}</p>
                  <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">{u.currentMood || "🔥 HYPE"}</p>
                </div>
              </div>
            ))}
          </div>

          {/* NAV BAR */}
          <nav className="p-4 bg-[#0d1225] flex justify-around border-t border-white/5 pb-10">
            <button onClick={() => setActiveTab("chats")} className="flex flex-col items-center text-green-500"><MessageSquare /><span className="text-[8px] font-black mt-1">CHATS</span></button>
            <button onClick={() => setActiveTab("wallet")} className="flex flex-col items-center text-slate-500"><Wallet /><span className="text-[8px] font-black mt-1">PAY</span></button>
          </nav>
        </div>
      ) : (
        /* CHAT VIEW */
        <div className="fixed inset-0 z-50 bg-[#060a16] flex flex-col">
          <header className="p-5 flex items-center justify-between border-b border-white/5 bg-[#0d1225]">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedUser(null)} className="text-2xl text-slate-500">←</button>
              <img src={selectedUser.photoURL} className="w-10 h-10 rounded-xl" />
              <h4 className="font-black text-xs uppercase">{selectedUser.displayName}</h4>
            </div>
            <div className="flex gap-3">
              <Clock onClick={() => setShowCapsuleModal(true)} className="text-slate-500" />
              <Wallet onClick={() => setShowPaymentModal(true)} className="text-slate-500" />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-[#0d1225] to-[#060a16]">
            {messages.map((m) => (
              <div key={m.id} onDoubleClick={() => setReplyTo(m)} className={`flex flex-col ${m.senderId === user.uid ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] ${m.type === 'sticker' ? 'bg-transparent' : `p-4 rounded-[28px] ${m.senderId === user.uid ? 'bg-green-600 rounded-tr-none' : 'bg-slate-800 rounded-tl-none border border-white/5 shadow-2xl'}`}`}>
                  
                  {/* PRIVACY BLUR CHECK */}
                  <div className={m.senderId !== user.uid ? "filter blur-sm hover:blur-none active:blur-none duration-300" : ""}>
                    {m.replyTo && <div className="bg-black/20 p-2 rounded-xl mb-2 text-[10px] italic">"{m.replyTo.text}"</div>}
                    
                    {/* CRITICAL GIF FIX HERE */}
                    {m.type === 'sticker' ? (
                      <img src={m.text} className="w-44 h-44 rounded-[30px] border-2 border-green-500 shadow-2xl" alt="sticker" />
                    ) : (
                      <p className="text-[15px] font-medium leading-relaxed">{m.text}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-1 mt-2 opacity-30 text-[8px] font-black uppercase">
                    {m.senderId === user.uid && (m.seen ? <CheckCheck size={12} className="text-blue-400" /> : <Check size={12} />)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={scroll}></div>
          </div>

          {/* AI & INPUT */}
          <div className="p-6 pb-12 bg-[#0d1225] rounded-t-[40px] space-y-4 shadow-3xl">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button onClick={() => askAI("savage")} className="bg-slate-800 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400">Savage</button>
              <button onClick={() => askAI("funny")} className="bg-slate-800 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400">Funny</button>
              <button onClick={() => askAI("translate")} className="bg-slate-800 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400">TR-EN</button>
            </div>

            {aiSuggestion && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex justify-between">
                <p className="text-xs italic text-green-400">"{aiSuggestion}"</p>
                <button onClick={() => handleSend(aiSuggestion)} className="text-[10px] font-black bg-green-600 px-3 py-1 rounded-lg">USE</button>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSend(newMessage); }} className="bg-[#11172b] p-2 flex gap-3 items-center rounded-[35px] border border-white/5">
              <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-500"><Smile size={28} /></button>
              <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type Decrypted Channel..." className="flex-1 bg-transparent py-4 outline-none text-[16px]" />
              <button type="submit" className="bg-green-600 p-4 rounded-full shadow-lg active:scale-90 transition-all"><Send size={24} /></button>
            </form>

            {showEmojiPicker && (
              <div className="grid grid-cols-4 gap-4 animate-in zoom-in-95 duration-200">
                {STICKERS.map((s, i) => (
                  <img key={i} src={s} onClick={() => handleSend(s, "sticker")} className="w-full aspect-square rounded-2xl object-cover hover:scale-110 transition-transform cursor-pointer shadow-lg" />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-8">
          <div className="bg-[#11172b] w-full max-w-sm rounded-[40px] p-8 border border-white/10 shadow-3xl">
            <h3 className="text-2xl font-black mb-6">Nexus Pay</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">Transferring to {selectedUser?.displayName}</p>
            <div className="relative mb-8">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black">₦</span>
              <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0.00" className="w-full bg-white/5 py-6 pl-14 pr-8 rounded-3xl outline-none text-3xl font-black" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-5 rounded-3xl bg-white/5 font-black text-xs">CANCEL</button>
              <button className="flex-1 py-5 rounded-3xl bg-green-600 font-black text-xs">SEND NGN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
