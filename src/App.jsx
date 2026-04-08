import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, addDoc, query, orderBy, onSnapshot, where, 
  serverTimestamp, setDoc, doc, updateDoc 
} from 'firebase/firestore';
import { 
  Send, MessageSquare, Search, User, Check, CheckCheck, X, Smile, Sparkles, 
  Ghost, Shield, Zap, Gamepad2, Languages, Clock, Wallet, Settings, Smartphone, 
  Share2, ChevronRight, Bell, Lock, Palette, LogOut, Info, Heart, Image as ImageIcon,
  Signal, EyeOff, Radio, Phone, Wifi
} from 'lucide-react';

// --- 🔐 ENCRYPTION SETUP ---
const HUB_SECRET_KEY = "VORTEX_SECURE_SIGNAL_992"; 
const encrypt = (text) => btoa(text.split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ HUB_SECRET_KEY.charCodeAt(i % HUB_SECRET_KEY.length))).join(''));
const decrypt = (encoded) => {
  if (!encoded || typeof encoded !== 'string') return "";
  try {
    return atob(encoded).split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ HUB_SECRET_KEY.charCodeAt(i % HUB_SECRET_KEY.length))).join('');
  } catch (e) { return "🔓 [Secure Signal]"; }
};

const EMOJI_LIST = ["😂","😎","🥰","😭","🙏","😡","🤣","😌","🤷","😒","💙","😀","😃","😄","😁","😆","😅","😉","😘","😍","😏","😊","🙂","🙃","🥳","🤩","😋","😛","😜","🤪","😔","🥺","🤭","🤫","🤔","🤐","😶","😐","😑","😬","🥱","🤗","😱","🤨","🧐","🙄","😤","😥","😟","🤬","😠","🙁","😕","😰","😨","😧","😦","😮","😫","😣","😖","😳","😲","😯","😵","🥴","🥵","🤢","🥶","🤮","😴","🤑","🤠","😇","🤥","😷","🤕","🤒","🤧","🤓","🤡","💩","😈","👿","👻","💀","👾","👽","⛄","👺","👹","🤖","☠️","🌚","🌞","🌝","💫","⭐","🌟","✨","⚡","💥","💢","🤍","🖤","🤎","💜","💚","💛","🧡","❤️","💘","💝","💖","💗","💓","💞","💕","💌","🗣️","👤","👥","💋","💔","❣️","♥️","💟","👣","💦","🧠","🩸","🦠","🦷","🦴","👀","👍","👎","💪","👏","🙏","💅","🙇","🙋","💁","🙆","🙅","🤷","🤦","🙍","🧘","🛌","🛀","🧖","💇","💆","🧏","🙎","🧍","🤸","🧎","🚶","🏃","🧗","🚵","🚴","🤾","⛹️","🤹","🏌️","🏇","🤺","⛷️","🏂","🪂","🧝","🧞","🧚","🧜","🤽","🏊","🚣","🏄","🧙","🧛","🧟","🦸","🦹","🤶","💂","👸","🕵️","👮","👷","👰","🤵","👼","👶","🧒","🧑","🧓","🧔","👯‍♂️","👯","🕺","💃","🕴️","👫","👭","👬","💏","🤱","🤰","💑","🏵️","💮","🌸","🌷","🌺","🥀","🌹","💐","🌻","🌼","🍂","🍁","🍄","🌾","🌿","🌱","🔥","🌋","🌀","❄️","🌬️","🌊","🏖️","🏝️","🌄","🌅","🌪️","⚡","☔","💧","🌨️","☁️","🌧️","🌞","☀️","🌤️","⛅","🌥️","🌦️","⛈️","🌩️","🌝","🌚","🌜","🌛","🌙","🌌","🌠","🌫️","🌏","🌎","🌍","🪐"];

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [showKbd, setShowKbd] = useState(false);
  const [stealthMode, setStealthMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scroll = useRef();

  // --- 📱 1. ANDROID BACK BUTTON (STABILIZED) ---
  useEffect(() => {
    window.history.pushState(null, null, window.location.pathname);
    const handleBackButton = (e) => {
      if (selectedUser) {
        setSelectedUser(null);
        window.history.pushState(null, null, window.location.pathname);
      } else if (activeTab !== "chats") {
        setActiveTab("chats");
        window.history.pushState(null, null, window.location.pathname);
      }
    };
    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [selectedUser, activeTab]);

  // --- 🛰️ 2. AUTH & IDENTITY ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsubUser = onSnapshot(userRef, (doc) => setUserData(doc.data()));
    setDoc(userRef, { 
      status: stealthMode ? "offline" : "online", 
      signalStrength: stealthMode ? 0 : 3,
      typing: isTyping,
      lastSeen: serverTimestamp(),
      displayName: user.displayName,
      photoURL: user.photoURL,
      uid: user.uid
    }, { merge: true });
    return () => unsubUser();
  }, [user, stealthMode, isTyping]);

  useEffect(() => {
    if (!user) return;
    const qUsers = query(collection(db, "users"));
    return onSnapshot(qUsers, (s) => 
      setUsers(s.docs.map(d => d.data()).filter(u => u.uid !== user.uid))
    );
  }, [user]);

  useEffect(() => {
    if (!user || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    const qMsg = query(collection(db, "messages"), where("chatId", "==", chatId), orderBy("createdAt", "asc"));
    return onSnapshot(qMsg, (s) => {
      setMessages(s.docs.map(d => ({ id: d.id, ...d.data() })));
      scroll.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [user, selectedUser]);

  const handleSend = async (val) => {
    if (!val.trim() || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    await addDoc(collection(db, "messages"), { 
      text: encrypt(val), type: "text", encrypted: true,
      senderId: user.uid, receiverId: selectedUser.uid, chatId, 
      createdAt: serverTimestamp(), seen: false 
    });
    setNewMessage(""); setShowKbd(false); setIsTyping(false);
  };

  const savePhone = async () => {
    if (!phoneInput || !user) return;
    await updateDoc(doc(db, "users", user.uid), { phoneNumber: phoneInput });
    alert("Identity Linked!");
  };

  const formatTime = (ts) => ts ? new Date(ts.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  if (!user) return (
    <div className="h-screen bg-[#060a16] flex flex-col items-center justify-center p-10 text-white">
      <Zap size={60} className="text-green-500 mb-6 animate-pulse" />
      <h1 className="text-4xl font-black italic tracking-tighter uppercase">VORTEX</h1>
      <button onClick={() => signInWithPopup(auth, googleProvider)} className="w-full mt-10 bg-white text-black py-5 rounded-[25px] font-black uppercase tracking-widest">Connect Hub</button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#060a16] text-white flex flex-col overflow-hidden">
      
      {/* 🟢 MAIN LIST */}
      {!selectedUser && activeTab === "chats" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 flex justify-between items-center bg-[#0d1225]">
            <div>
              <h2 className="text-4xl font-black italic tracking-tighter uppercase">VORTEX</h2>
              <p className="text-[8px] font-black text-green-500 tracking-widest mt-1 uppercase">Transmission Stable</p>
            </div>
            <div className="w-14 h-14 rounded-2xl border border-white/10 bg-[#11172b] flex items-center justify-center">
               <Radio size={28} className="text-green-500 animate-pulse" />
            </div>
          </header>

          <div className="p-6">
            <div className="bg-[#11172b] rounded-3xl p-4 flex items-center gap-3 border border-white/5">
              <Search className="text-green-500/50" size={18} />
              <input placeholder="Search encrypted frequencies..." className="bg-transparent outline-none text-xs w-full" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-24">
            {users.map(u => (
              <div key={u.uid} onClick={() => setSelectedUser(u)} className="flex items-center gap-4 p-4 bg-[#11172b]/80 rounded-[28px] border border-white/5 active:scale-95 transition-all">
                <img src={u.photoURL} className="w-14 h-14 rounded-2xl object-cover" />
                <div className="flex-1">
                  <p className="font-black text-[15px]">{u.displayName}</p>
                  <p className={`text-[9px] font-black uppercase tracking-widest ${u.status === 'online' ? 'text-green-500' : 'text-slate-500'}`}>{u.status === 'online' ? 'Active' : 'Offline'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🟢 SYSTEM SETTINGS */}
      {activeTab === "settings" && !selectedUser && (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto pb-32">
           <header className="flex flex-col items-center mb-10">
              <img src={user.photoURL} className="w-24 h-24 rounded-[35px] border-4 border-green-500/20 mb-4" />
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">{user.displayName}</h2>
              <p className="text-[9px] font-black text-green-500 tracking-widest uppercase">{userData?.phoneNumber || "UNLINKED"}</p>
           </header>
           
           <div className="space-y-6">
              <div className="p-6 bg-[#11172b] rounded-[30px] border border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-4 text-center">Identity Sync</p>
                <div className="flex gap-2">
                  <input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="+234..." className="bg-[#060a16] rounded-2xl p-3 border border-white/10 text-xs flex-1 outline-none" />
                  <button onClick={savePhone} className="bg-green-600 p-3 rounded-2xl font-black text-[10px] uppercase">Link</button>
                </div>
              </div>
              <button onClick={() => setStealthMode(!stealthMode)} className="p-6 w-full rounded-[30px] border border-white/5 bg-[#11172b] flex justify-between items-center">
                 <p className="font-black text-xs uppercase">Stealth Mode</p>
                 <div className={`w-10 h-5 rounded-full ${stealthMode ? 'bg-green-500' : 'bg-slate-800'}`}></div>
              </button>
              <button onClick={() => signOut(auth)} className="w-full p-6 rounded-[30px] bg-red-500/10 text-red-500 font-black uppercase text-xs">Terminate</button>
           </div>
        </div>
      )}

      {/* 🟢 CHAT INTERFACE */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-[#060a16] flex flex-col">
          <header className="p-4 flex items-center gap-4 border-b border-white/5 bg-[#0d1225]">
            <button onClick={() => setSelectedUser(null)} className="p-2 text-green-500 font-black">←</button>
            <img src={selectedUser.photoURL} className="w-10 h-10 rounded-xl" />
            <div className="flex-1">
              <h4 className="font-black text-[13px] uppercase truncate">{selectedUser.displayName}</h4>
              <p className="text-[8px] font-black text-green-500 uppercase tracking-widest">SECURED 🔒</p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.senderId === user.uid ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-[24px] ${m.senderId === user.uid ? 'bg-green-600 rounded-tr-none' : 'bg-[#11172b] rounded-tl-none border border-white/5'}`}>
                  <p className="text-[14px] font-medium">{m.encrypted ? decrypt(m.text) : m.text}</p>
                </div>
                <span className="text-[7px] text-slate-500 font-black mt-1 uppercase">{formatTime(m.createdAt)}</span>
              </div>
            ))}
            <div ref={scroll}></div>
          </div>

          <div className="p-5 bg-[#0d1225] rounded-t-[40px]">
            <div className="bg-[#11172b] p-2 flex gap-2 items-center rounded-full border border-white/5 mb-3">
              <button onClick={() => setShowKbd(!showKbd)} className="p-2 text-slate-500"><Smile /></button>
              <input value={newMessage} onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)} onChange={(e) => setNewMessage(e.target.value)} placeholder="Send signal..." className="flex-1 bg-transparent py-3 outline-none text-sm" />
              <button onClick={() => handleSend(newMessage)} className="bg-green-600 rounded-full p-3 px-6"><Send size={18} /></button>
            </div>
            {showKbd && (
              <div className="h-64 overflow-y-auto grid grid-cols-7 gap-y-5 text-center">
                {EMOJI_LIST.map((emoji, i) => (<button key={i} onClick={() => setNewMessage(prev => prev + emoji)} className="text-3xl">{emoji}</button>))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🟢 BOTTOM NAVIGATION */}
      {!selectedUser && (
        <nav className="p-4 px-12 bg-[#0d1225] flex justify-between border-t border-white/5 pb-10">
          <button onClick={() => setActiveTab("chats")} className={`flex flex-col items-center gap-1.5 ${activeTab === 'chats' ? 'text-green-500' : 'text-slate-600'}`}>
            <MessageSquare size={24} />
            <span className="text-[9px] font-black uppercase">Signals</span>
          </button>
          <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center gap-1.5 ${activeTab === 'settings' ? 'text-green-500' : 'text-slate-600'}`}>
            <Shield size={24} />
            <span className="text-[9px] font-black uppercase">System</span>
          </button>
        </nav>
      )}
    </div>
  );
}
