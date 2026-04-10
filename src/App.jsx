import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, addDoc, query, orderBy, onSnapshot, where, 
  serverTimestamp, setDoc, doc, updateDoc, limit 
} from 'firebase/firestore';
import { 
  Send, MessageSquare, Search, Shield, Zap, Radio, Lock, Smile, Check, CheckCheck, 
  Image as ImageIcon, Phone, Globe, TrendingUp, DollarSign, EyeOff, X, Gift
} from 'lucide-react';

// --- 💎 CONFIG & ENCRYPTION ---
const LOGO_URL = "WA_1775584974117.jpeg";
const HUB_SECRET_KEY = "VORTEX_SECURE_SIGNAL_992"; 
const PAYSTACK_PUBLIC_KEY = "Pk_test_184b624c480ab512a8ca799ea92fad48d6342b9a";

const encrypt = (text) => btoa(text.split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ HUB_SECRET_KEY.charCodeAt(i % HUB_SECRET_KEY.length))).join(''));
const decrypt = (encoded) => {
  if (!encoded || typeof encoded !== 'string') return "";
  try {
    return atob(encoded).split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ HUB_SECRET_KEY.charCodeAt(i % HUB_SECRET_KEY.length))).join('');
  } catch (e) { return "🔓 [Secure Signal]"; }
};

const EMOJI_LIST = ["😂","😎","🥰","😭","🙏","😡","🤣","😌","🤷","😒","💙","😀","😃","😄","😁","😆","😅","😉","😘","😍","😏","😊","🙂","🙃","🥳","🤩","😋","😛","😜","🤪","😔","🥺","🤭","🤫","🤔","🤐","😶","😐","😑","😬","🥱","🤗","😱","🤨","🧐","🙄","😤","😥","😟","🤬","😠","🙁","😕","😰","😨","😧","😦","😮","😫","😣","😖","😳","😲","😯","😵","🥴","🥵","🤢","🥶","🤮","😴","🤑","🤠","😇","🤥","😷","🤕","🤒","🤧","🤓","🤡","💩","😈","👿","👻","💀","👾","👽","⛄","👺","👹","🤖","☠️","🌚","🌞","🌝","💫","⭐","🌟","✨","⚡","💥","💢","🤍","🖤","🤎","💜","💚","💛","🧡","❤️","💘","💝","💖","💗","💓","💞","💕","💌","🗣️","👤","👥","💋","💔","❣️","❤️","💟","👣","💦","🧠","🩸","🦠","🦷","🦴","👀","👍","👎","💪","👏","🙏","💅","🙇","🙋","💁","🙆","🙅","🤷","🤦","🙍","🧘","🤸","🚶","🏃","🧗","🚵","🚴","🤾","⛹️","🤹","🏌️","🏇","🤺","⛷️","🏂","🪂","🧝","🧞","🧚","🧜","🤽","🏊","🚣","🏄","🧙","🧛","🧟","🦸","🦹","🤶","💂","👸","🕵️","👮","👷","👰","🤵","👼","👶","🧒","🧑","🧓","🧔","👯‍♂️","👯","🕺","💃","🕴️","👫","👭","👬","💏","🤱","🤰","💑","🏵️","💮","🌸","🌷","🌺","🥀","🌹","💐","🌻","🌼","🍂","🍁","🍄","🌾","🌿","🌱","🔥","🌀","❄️","🌬️","🌊","🏖️","🏝️","🌄","🌅","🌪️","⚡","☔","💧","🌨️","☁️","🌧️","🌞","☀️","🌤️","⛅","🌥️","🌦️","⛈️","🌩️","🌝","🌚","🌜","🌛","🌙","🌌","🌠","🌫️","🌏","🌎","🌍","🪐"];

const GIF_LIST = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlUxc2YM1NC6ny8/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26AHONh79u4m5W98s/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKVUn7iM8FMEU24/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l41lTfuxV5F68S96E/giphy.gif"
];

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [marketIdeas, setMarketIdeas] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [newIdea, setNewIdea] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [keyboardView, setKeyboardView] = useState("none"); 
  const [stealthMode, setStealthMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scroll = useRef();

  useEffect(() => {
    const handleBack = (event) => {
      if (selectedUser) {
        event.preventDefault();
        setSelectedUser(null);
        window.history.pushState(null, null, window.location.pathname);
      } else if (activeTab !== "chats") {
        event.preventDefault();
        setActiveTab("chats");
        window.history.pushState(null, null, window.location.pathname);
      }
    };
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', handleBack);
    return () => window.removeEventListener('popstate', handleBack);
  }, [selectedUser, activeTab]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      if (!u) setIsLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        if (data?.phoneNumber && !phoneInput) setPhoneInput(data.phoneNumber);
      }
      setIsLoading(false);
    });
    
    setDoc(userRef, { 
      status: stealthMode ? "offline" : "online", 
      typing: isTyping,
      lastSeen: serverTimestamp(),
      displayName: user?.displayName || "Anonymous",
      photoURL: user?.photoURL || "",
      uid: user.uid
    }, { merge: true });

    return () => unsub();
  }, [user, stealthMode, isTyping]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "users"), (s) => 
      setUsers(s.docs.map(d => d.data()).filter(u => u.uid !== user.uid))
    );
  }, [user]);

  useEffect(() => {
    if (!user || activeTab !== "market") return;
    const qMarket = query(collection(db, "market"), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(qMarket, (s) => setMarketIdeas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user, activeTab]);

  useEffect(() => {
    if (!user || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    const qMsg = query(collection(db, "messages"), where("chatId", "==", chatId), orderBy("createdAt", "asc"));
    return onSnapshot(qMsg, (s) => {
      setMessages(s.docs.map(d => ({ id: d.id, ...d.data() })));
      scroll.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [user, selectedUser]);

  const handleSend = async (val, type = "text") => {
    const content = val || newMessage;
    if (!content.trim() || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    await addDoc(collection(db, "messages"), { 
      text: type === "text" ? encrypt(content) : content, 
      type, encrypted: type === "text",
      senderId: user.uid, receiverId: selectedUser.uid, chatId, 
      createdAt: serverTimestamp(), seen: false 
    });
    setNewMessage(""); setKeyboardView("none");
  };

  if (isLoading) return (
    <div className="h-screen bg-[#060a16] flex flex-col items-center justify-center text-white">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Establishing Signal...</p>
    </div>
  );

  if (!user) return (
    <div className="h-screen bg-[#060a16] flex flex-col items-center justify-center p-10 text-white text-center">
      <img src={LOGO_URL} className="w-32 h-32 rounded-[40px] mb-8 shadow-2xl shadow-green-500/20" alt="Logo" />
      <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-2">VORTEX</h1>
      <button onClick={() => signInWithPopup(auth, googleProvider)} className="w-full mt-12 bg-white text-black py-5 rounded-[25px] font-black uppercase tracking-widest">Connect Hub</button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#060a16] text-white flex flex-col overflow-hidden font-sans">
      
      {!selectedUser && activeTab === "chats" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 flex justify-between items-center bg-[#0d1225]">
            <div>
              <h2 className="text-4xl font-black italic tracking-tighter uppercase">VORTEX</h2>
              <p className="text-[8px] font-black text-green-500 tracking-widest mt-1 uppercase">Signal Active</p>
            </div>
            <Radio size={28} className="text-green-500 animate-pulse" />
          </header>
          <div className="p-6">
            <div className="bg-[#11172b] rounded-3xl p-4 flex items-center gap-3 border border-white/5">
              <Search className="text-green-500" size={18} />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search name or ID..." className="bg-transparent outline-none text-xs w-full" />
              {searchQuery && <X size={16} onClick={() => setSearchQuery("")} className="text-slate-500" />}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-24">
            {users.filter(u => u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || u.phoneNumber?.includes(searchQuery)).map(u => (
              <div key={u.uid} onClick={() => setSelectedUser(u)} className="flex items-center gap-4 p-4 bg-[#11172b]/80 rounded-[28px] border border-white/5 active:scale-95 transition-all">
                <div className="relative">
                  <img src={u.photoURL || ""} className="w-14 h-14 rounded-2xl object-cover bg-slate-800" />
                  {u.status === 'online' && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-[#11172b]"></div>}
                </div>
                <div className="flex-1">
                  <p className="font-black text-[15px]">{u.displayName || "Unknown Signal"}</p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{u.phoneNumber ? `ID: ${u.phoneNumber}` : "VORTEX ID ACTIVE"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedUser && activeTab === "market" && (
         <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 bg-[#0d1225]">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Market Hub</h2>
            <p className="text-[8px] font-black text-green-500 tracking-widest uppercase">Global Money Ideas</p>
          </header>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-24">
             {marketIdeas.map(idea => (
              <div key={idea.id} className="p-6 bg-[#11172b] rounded-[35px] border border-white/5 shadow-xl">
                <p className="text-sm font-medium leading-relaxed">{idea.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedUser && activeTab === "settings" && (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto pb-32">
           <header className="flex flex-col items-center mb-8 text-center">
              <img src={user?.photoURL || ""} className="w-24 h-24 rounded-[35px] border-4 border-green-500/20 mb-4 shadow-2xl bg-slate-800" />
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">{user?.displayName || "Signal User"}</h2>
           </header>
           <div className="bg-gradient-to-br from-[#1a2238] to-[#0d1225] p-6 rounded-[35px] border border-white/10 shadow-2xl mb-8 relative">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Wallet Balance</p>
                <h3 className="text-3xl font-black text-white mt-1">₦{(userData?.walletBalance || 0).toLocaleString()}</h3>
                <button className="w-full mt-4 bg-green-600 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest">Add Funds +</button>
           </div>
           <button onClick={() => setStealthMode(!stealthMode)} className="p-6 w-full rounded-[30px] border border-white/5 bg-[#11172b] flex justify-between items-center transition-all">
               <div className="flex items-center gap-3"><Lock size={18}/><p className="font-black text-xs uppercase">Stealth Mode</p></div>
               <div className={`w-12 h-6 rounded-full transition-colors ${stealthMode ? 'bg-green-500' : 'bg-slate-800'}`}></div>
           </button>
           <button onClick={() => signOut(auth)} className="mt-6 p-6 w-full rounded-[30px] border border-red-500/20 bg-[#11172b] text-red-500 font-black text-xs uppercase tracking-widest">Logout System</button>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-[#060a16] flex flex-col">
          <header className="p-4 flex items-center gap-4 border-b border-white/5 bg-[#0d1225]">
            <button onClick={() => setSelectedUser(null)} className="p-2 text-green-500 font-black text-xl">←</button>
            <img src={selectedUser.photoURL || ""} className="w-10 h-10 rounded-xl bg-slate-800" />
            <h4 className="font-black text-[13px] uppercase truncate">{selectedUser.displayName || "Unknown"}</h4>
          </header>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.senderId === user.uid ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-[24px] ${m.senderId === user.uid ? 'bg-green-600' : 'bg-[#11172b]'}`}>
                  {m.type === "gif" ? <img src={m.text} className="w-40 rounded-xl" /> : <p className="text-[14px]">{m.encrypted ? decrypt(m.text) : m.text}</p>}
                </div>
              </div>
            ))}
            <div ref={scroll}></div>
          </div>
          <div className="p-5 bg-[#0d1225] rounded-t-[40px] shadow-2xl">
            <div className="bg-[#11172b] p-2 flex gap-2 items-center rounded-full border border-white/5 mb-3">
              <button onClick={() => setKeyboardView(keyboardView === 'emoji' ? 'none' : 'emoji')} className="p-2 text-slate-500"><Smile size={22} /></button>
              <button onClick={() => setKeyboardView(keyboardView === 'gif' ? 'none' : 'gif')} className="p-2 text-slate-500"><Gift size={22} /></button>
              <input value={newMessage} onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)} onChange={(e) => setNewMessage(e.target.value)} placeholder="Send signal..." className="flex-1 bg-transparent py-3 px-2 outline-none text-sm" />
              <button onClick={() => handleSend(newMessage)} className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center"><Send size={20} /></button>
            </div>
            {keyboardView === 'emoji' && (
              <div className="h-48 overflow-y-auto grid grid-cols-8 gap-2 p-4">{EMOJI_LIST.map((e,i)=><button key={i} onClick={()=>setNewMessage(p=>p+e)} className="text-2xl">{e}</button>)}</div>
            )}
            {keyboardView === 'gif' && (
              <div className="h-48 overflow-y-auto flex gap-4 p-4">{GIF_LIST.map((g,i)=><img key={i} src={g} onClick={()=>handleSend(g, 'gif')} className="h-40 rounded-xl cursor-pointer" />)}</div>
            )}
          </div>
        </div>
      )}

      {!selectedUser && (
        <nav className="p-4 px-8 bg-[#0d1225] flex justify-between border-t border-white/5 pb-10">
          <button onClick={() => setActiveTab("chats")} className={`flex flex-col items-center gap-1.5 ${activeTab === 'chats' ? 'text-green-500' : 'text-slate-600'}`}>
            <MessageSquare size={22} /><span className="text-[8px] font-black uppercase tracking-widest">Signals</span>
          </button>
          <button onClick={() => setActiveTab("market")} className={`flex flex-col items-center gap-1.5 ${activeTab === 'market' ? 'text-green-500' : 'text-slate-600'}`}>
            <Globe size={22} /><span className="text-[8px] font-black uppercase tracking-widest">Market</span>
          </button>
          <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center gap-1.5 ${activeTab === 'settings' ? 'text-green-500' : 'text-slate-600'}`}>
            <Shield size={22} /><span className="text-[8px] font-black uppercase tracking-widest">System</span>
          </button>
        </nav>
      )}
    </div>
  );
}
