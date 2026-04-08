import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, where, serverTimestamp, setDoc, doc, updateDoc } from 'firebase/firestore';
import { Send, LogOut, MessageSquare, Search, User, Check, CheckCheck, X, Smile, Sparkles, Ghost, Shield, Zap, Gamepad2, Layers, Languages } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]); 
  const [selectedUser, setSelectedUser] = useState(null); 
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [mood, setMood] = useState("🔥 hype");
  const [ghostMode, setGhostMode] = useState(false);
  const [replyTo, setReplyTo] = useState(null); 
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhoto, setNewPhoto] = useState("");
  
  const scroll = useRef();

  const moods = {
    "🔥 hype": "border-orange-500 shadow-orange-500/30",
    "😴 chill": "border-blue-400 shadow-blue-400/10",
    "😤 annoyed": "border-red-600 shadow-red-600/40",
    "🎯 gaming": "border-green-500 shadow-green-500/30"
  };

  const emojiCategories = {
    "Popular": ["❤️", "😂", "🙌", "🔥", "💯", "👍", "⚽", "🎮", "💸", "🇳🇬"],
    "Flags": ["🇲🇹", "🇲🇵", "🇲🇱", "🇹🇷", "🇺🇸", "🇬🇧", "🇳🇬", "🇫🇷", "🇩🇪", "🇧🇷"],
    "Stickers": ["https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpueXJ3bmZ4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKVUn7iM8FMEU24/giphy.gif"]
  };

  const askNexusAI = (mode) => {
    setAiLoading(true);
    setTimeout(() => {
      const suggestions = {
        savage: "Imagine losing to a 4-3-1-2 formation. Couldn't be me. 🥱",
        funny: "I'm not lazy, I'm just on energy-saving mode. 😂",
        serious: "Let's focus on the project and finalize the API integration.",
        translate: "Translated: 'I will see you soon, my love' (Turkish detected)"
      };
      setAiSuggestion(suggestions[mode]);
      setAiLoading(false);
    }, 800);
  };

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u); setNewName(u.displayName); setNewPhoto(u.photoURL);
        await setDoc(doc(db, "users", u.uid), { uid: u.uid, displayName: u.displayName, photoURL: u.photoURL, status: ghostMode ? "Offline" : "Online", currentMood: mood, lastSeen: serverTimestamp() }, { merge: true });
      } else { setUser(null); }
    });
  }, [ghostMode, mood]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "users"), (s) => setUsers(s.docs.map(d => d.data()).filter(u => u.uid !== user.uid)));
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

  const sendMessage = async (val, type = "text") => {
    if (!val.trim() || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    await addDoc(collection(db, "messages"), { 
      text: val, type, senderId: user.uid, receiverId: selectedUser.uid, chatId, 
      createdAt: serverTimestamp(), seen: false, mood: mood,
      replyTo: replyTo ? { text: replyTo.text, senderName: replyTo.senderId === user.uid ? 'You' : selectedUser.displayName } : null 
    });
    setNewMessage(""); setReplyTo(null); setAiSuggestion(""); setShowEmojiPicker(false);
  };

  if (!user) return (
    <div className="h-screen bg-[#0a0f1e] flex flex-col items-center justify-center text-white p-6">
      <Zap size={60} className="text-green-500 mb-6 animate-pulse" />
      <h1 className="text-4xl font-black mb-8 tracking-tighter italic">NexusOS</h1>
      <button onClick={() => signInWithPopup(auth, googleProvider)} className="bg-white text-black w-full max-w-xs py-4 rounded-2xl font-black active:scale-95 transition-all shadow-xl">Launch System</button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#0a0f1e] text-white overflow-hidden flex flex-col font-sans">
      
      {/* HOME / SIDEBAR */}
      <div className={`${selectedUser ? 'hidden' : 'flex'} flex-col h-full w-full z-20`}>
        <div className="p-6 flex justify-between items-center bg-[#0d1225] border-b border-white/5 shadow-2xl">
          <div className="flex items-center gap-3">
            <img src={user.photoURL} onClick={() => setShowProfileEdit(true)} className="w-12 h-12 rounded-2xl ring-2 ring-green-500/30 object-cover cursor-pointer" alt="" />
            <div>
              <p className="font-black text-[11px] uppercase tracking-widest text-slate-400">Current Vibe</p>
              <select value={mood} onChange={(e) => setMood(e.target.value)} className="bg-transparent text-sm text-green-500 outline-none font-black cursor-pointer">
                {Object.keys(moods).map(m => <option key={m} value={m} className="bg-[#0d1225]">{m.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setGhostMode(!ghostMode)} className={`p-2 rounded-xl transition-all ${ghostMode ? 'text-blue-400 bg-blue-400/10' : 'text-slate-500'}`}><Ghost size={24} /></button>
            <button onClick={() => setShowProfileEdit(true)} className="p-2 text-slate-500"><User size={24} /></button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-4 text-slate-600" size={20} />
            <input type="text" placeholder="Search decrypted chats..." className="w-full bg-[#161b2c] rounded-2xl py-4 pl-12 pr-4 outline-none border border-white/5 focus:border-green-500/50" />
          </div>
          {users.map(u => (
            <div key={u.uid} onClick={() => setSelectedUser(u)} className="flex items-center gap-4 p-5 cursor-pointer rounded-[28px] bg-[#161b2c]/40 hover:bg-green-600/10 border border-white/5 transition-all">
              <div className="relative">
                <img src={u.photoURL} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                {u.status === "Online" && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-[#0a0f1e]"></div>}
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg leading-tight">{u.displayName}</p>
                <p className="text-[10px] text-slate-500 font-black tracking-widest mt-1 uppercase">{u.currentMood || "No Signal"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT WINDOW */}
      {selectedUser && (
        <div className="fixed inset-0 flex flex-col z-30 bg-[#0a0f1e]">
          {/* ADAPTIVE WALLPAPER FIX */}
          <div className="absolute inset-0 opacity-25 blur-[120px] pointer-events-none scale-125" style={{ backgroundImage: `url(${selectedUser.photoURL})`, backgroundSize: 'cover' }}></div>

          <div className="relative z-40 flex flex-col h-full w-full">
            {/* STICKY HEADER */}
            <div className="p-4 bg-[#0a0f1e]/80 backdrop-blur-2xl flex justify-between items-center border-b border-white/5">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedUser(null)} className="text-2xl mr-2 text-white/50">←</button>
                <img src={selectedUser.photoURL} className="w-10 h-10 rounded-xl object-cover shadow-lg" alt="" />
                <div>
                  <p className="font-black text-xs uppercase tracking-tight">{selectedUser.displayName}</p>
                  <p className="text-[9px] text-green-500 font-black tracking-[0.2em]">{selectedUser.status}</p>
                </div>
              </div>
              <Shield size={20} className="text-slate-600" />
            </div>

            {/* MESSAGE AREA */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} onDoubleClick={() => setReplyTo(msg)} className={`flex flex-col ${msg.senderId === user.uid ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                  <div className={`max-w-[85%] p-4 rounded-[30px] border transition-all relative ${msg.senderId === user.uid ? `bg-green-600 border-green-400 rounded-tr-none ${moods[msg.mood]}` : 'bg-slate-800/90 backdrop-blur-md rounded-tl-none border-white/5 shadow-2xl'}`}>
                    
                    {/* Ghost/Blur Mode for incoming */}
                    <div className={msg.senderId !== user.uid ? "filter blur-sm active:blur-none hover:blur-none duration-300" : ""}>
                      {msg.replyTo && <div className="bg-black/20 p-2 rounded-xl mb-2 border-l-4 border-white/40 text-[10px]"><p className="font-black opacity-50">{msg.replyTo.senderName}</p><p className="truncate italic">"{msg.replyTo.text}"</p></div>}
                      <p className="text-[15px] font-medium tracking-tight">{msg.text}</p>
                    </div>

                    <div className="flex justify-end gap-1 mt-2 opacity-30 text-[8px] font-black uppercase">
                      {msg.createdAt?.toDate && new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      {msg.senderId === user.uid && (msg.seen ? <CheckCheck size={12} className="text-blue-300" /> : <Check size={12} />)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scroll}></div>
            </div>

            {/* NEXUS AI BAR */}
            {aiSuggestion && (
              <div className="mx-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex justify-between items-center animate-in zoom-in-95">
                <p className="text-xs font-bold text-green-400 tracking-tight italic">"{aiSuggestion}"</p>
                <button onClick={() => { setNewMessage(aiSuggestion); setAiSuggestion(""); }} className="bg-green-600 text-[10px] font-black px-4 py-2 rounded-full shadow-lg">APPLY</button>
              </div>
            )}

            {/* INPUT SECTION */}
            <div className="p-4 pb-10 space-y-3 bg-gradient-to-t from-[#0a0f1e] to-transparent">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => askNexusAI("savage")} className="whitespace-nowrap bg-slate-800/80 text-[10px] font-black px-5 py-2.5 rounded-full border border-white/5">😏 SAVAGE</button>
                <button onClick={() => askNexusAI("funny")} className="whitespace-nowrap bg-slate-800/80 text-[10px] font-black px-5 py-2.5 rounded-full border border-white/5">😂 FUNNY</button>
                <button onClick={() => askNexusAI("translate")} className="whitespace-nowrap bg-slate-800/80 text-[10px] font-black px-5 py-2.5 rounded-full border border-white/5"><Languages size={12} className="inline mr-1"/> TR-EN</button>
              </div>

              {replyTo && <div className="bg-slate-800/90 p-3 rounded-2xl flex justify-between items-center border border-white/5"><p className="text-[10px] font-bold opacity-50 italic">Replying to: {replyTo.text}</p><X size={16} onClick={() => setReplyTo(null)}/></div>}
              
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(newMessage); }} className="bg-[#161b2c] p-2 flex gap-2 items-center rounded-[32px] border border-white/10 shadow-2xl">
                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-3 transition-all ${showEmojiPicker ? 'text-green-500' : 'text-slate-500'}`}><Smile size={26} /></button>
                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={`Decrypted channel in ${mood}...`} className="flex-1 bg-transparent px-2 py-3 outline-none text-white text-[16px] placeholder:text-slate-600" />
                <button type="submit" className="bg-green-600 p-4 rounded-full shadow-xl shadow-green-600/20 active:scale-90 transition-all"><Send size={22} /></button>
              </form>

              {showEmojiPicker && (
                <div className="bg-[#161b2c] p-4 rounded-[30px] border border-white/10 grid grid-cols-6 gap-3 animate-in slide-in-from-bottom-5">
                  {emojiCategories.Popular.map(e => <button key={e} onClick={() => sendMessage(e)} className="text-2xl active:scale-125 transition-all">{e}</button>)}
                  <button onClick={() => sendMessage("🎮 FIFA?", "sticker")} className="bg-slate-800 p-2 rounded-xl flex items-center justify-center"><Gamepad2 size={20}/></button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
