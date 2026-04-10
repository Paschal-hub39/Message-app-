import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, addDoc, query, orderBy, onSnapshot, where, 
  serverTimestamp, setDoc, doc, updateDoc 
} from 'firebase/firestore';
import { 
  Send, MessageSquare, Search, Shield, Zap, Radio, Lock, Smile, Check, CheckCheck, Image as ImageIcon 
} from 'lucide-react';

// --- 💎 CONFIG & ENCRYPTION ---
const LOGO_URL = "WA_1775584974117.jpeg";
const HUB_SECRET_KEY = "VORTEX_SECURE_SIGNAL_992"; 

const encrypt = (text) => btoa(text.split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ HUB_SECRET_KEY.charCodeAt(i % HUB_SECRET_KEY.length))).join(''));
const decrypt = (encoded) => {
  if (!encoded || typeof encoded !== 'string') return "";
  try {
    return atob(encoded).split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ HUB_SECRET_KEY.charCodeAt(i % HUB_SECRET_KEY.length))).join('');
  } catch (e) { return "🔓 [Secure Signal]"; }
};

const EMOJI_LIST = ["😂","😎","🥰","😭","🙏","😡","🤣","😌","🤷","😒","💙","😀","😃","😄","😁","😆","😅","😉","😘","😍","😏","😊","🙂","🙃","🥳","🤩","😋","😛","😜","🤪","😔","🥺","🤭","🤫","🤔","🤐","😶","😐","😑","😬","🥱","🤗","😱","🤨","🧐","🙄","😤","😥","😟","🤬","😠","🙁","😕","😰","😨","😧","😦","😮","😫","😣","😖","😳","😲","😯","😵","🥴","🥵","🤢","🥶","🤮","😴","🤑","🤠","😇","🤥","😷","🤕","🤒","🤧","🤓","🤡","💩","😈","👿","👻","💀","👾","👽","⛄","👺","👹","🤖","☠️","🌚","🌞","🌝","💫","⭐","🌟","✨","⚡","💥","💢","🤍","🖤","🤎","💜","💚","💛","🧡","❤️","💘","💝","💖","💗","💓","💞","💕","💌","🗣️","👤","👥","💋","💔","❣️","♥️","💟","👣","💦","🧠","🩸","🦠","🦷","🦴","👀","👍","👎","💪","👏","🙏","💅","🙇","🙋","💁","🙆","🙅","🤷","🤦","🙍","🧘","🛌","🛀","🧖","💇","💆","🧏","🙎","🧍","🤸","🧎","🚶","🏃","🧗","🚵","🚴","🤾","⛹️","🤹","🏌️","🏇","🤺","⛷️","🏂","🪂","🧝","🧞","🧚","🧜","🤽","🏊","🚣","🏄","🧙","🧛","🧟","🦸","🦹","🤶","💂","👸","🕵️","👮","👷","👰","🤵","👼","👶","🧒","🧑","🧓","🧔","👯‍♂️","👯","🕺","💃","🕴️","👫","👭","👬","💏","🤱","🤰","💑","🏵️","💮","🌸","🌷","🌺","🥀","🌹","💐","🌻","🌼","🍂","🍁","🍄","🌾","🌿","🌱","🔥","🌋","🌀","❄️","🌬️","🌊","🏖️","🏝️","🌄","🌅","🌪️","⚡","☔","💧","🌨️","☁️","🌧️","🌞","☀️","🌤️","⛅","🌥️","🌦️","⛈️","🌩️","🌝","🌚","🌜","🌛","🌙","🌌","🌠","🌫️","🌏","🌎","🌍","🪐"];

const GIF_LIST = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlUxc2YM1NC6ny8/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26AHONh79u4m5W98s/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKVUn7iM8FMEU24/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l41lTfuxV5F68S96E/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0MYEqEzwMWFCg8rm/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKMGpx4gM58u77O/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlK9A7uJAXuB_v2/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3vRhaxSAsPMEe8yA/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKDkDbIDJieKbVm/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlS7e4zM0s102wE/giphy.gif"
];

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [keyboardView, setKeyboardView] = useState("none"); 
  const [stealthMode, setStealthMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scroll = useRef();

  useEffect(() => {
    window.history.pushState(null, null, window.location.pathname);
    const handleBack = () => {
      if (selectedUser) { setSelectedUser(null); window.history.pushState(null, null, window.location.pathname); }
      else if (activeTab !== "chats") { setActiveTab("chats"); window.history.pushState(null, null, window.location.pathname); }
    };
    window.addEventListener('popstate', handleBack);
    return () => window.removeEventListener('popstate', handleBack);
  }, [selectedUser, activeTab]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    onSnapshot(userRef, (doc) => setUserData(doc.data()));
    setDoc(userRef, { 
      status: stealthMode ? "offline" : "online", 
      typing: isTyping,
      lastSeen: serverTimestamp(),
      displayName: user.displayName,
      photoURL: user.photoURL,
      uid: user.uid
    }, { merge: true });
  }, [user, stealthMode, isTyping]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "users"), (s) => 
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

  const handleSend = async (val, type = "text") => {
    const messageContent = val || newMessage;
    if (!messageContent.trim() || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    await addDoc(collection(db, "messages"), { 
      text: type === "text" ? encrypt(messageContent) : messageContent, 
      type, 
      encrypted: type === "text",
      senderId: user.uid, receiverId: selectedUser.uid, chatId, 
      createdAt: serverTimestamp(), seen: false 
    });
    setNewMessage(""); setKeyboardView("none"); setIsTyping(false);
  };

  const formatTime = (ts) => ts ? new Date(ts.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  if (!user) return (
    <div className="h-screen bg-[#060a16] flex flex-col items-center justify-center p-10 text-white text-center">
      <img src={LOGO_URL} className="w-32 h-32 rounded-[40px] mb-8 shadow-2xl shadow-green-500/20" alt="Logo" />
      <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-2">VORTEX</h1>
      <p className="text-[10px] font-black text-green-500 tracking-[4px] uppercase opacity-60">Transmission Stable</p>
      <button onClick={() => signInWithPopup(auth, googleProvider)} className="w-full mt-12 bg-white text-black py-5 rounded-[25px] font-black uppercase tracking-widest shadow-xl">Connect Hub</button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#060a16] text-white flex flex-col overflow-hidden">
      
      {!selectedUser && activeTab === "chats" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 flex justify-between items-center bg-[#0d1225]">
            <div>
              <h2 className="text-4xl font-black italic tracking-tighter uppercase">VORTEX</h2>
              <p className="text-[8px] font-black text-green-500 tracking-widest mt-1 uppercase">Signal Active</p>
            </div>
            <div className="w-14 h-14 rounded-2xl border border-white/10 bg-[#11172b] flex items-center justify-center relative">
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
                  <p className={`text-[9px] font-black uppercase tracking-widest ${u.status === 'online' ? 'text-green-500' : 'text-slate-500'}`}>
                    {u.status === 'online' ? 'Active' : `Last seen: ${formatTime(u.lastSeen)}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "settings" && !selectedUser && (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto pb-32">
           <header className="flex flex-col items-center mb-10 text-center">
              <img src={user.photoURL} className="w-24 h-24 rounded-[35px] border-4 border-green-500/20 mb-4" />
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">{user.displayName}</h2>
              <p className="text-[9px] font-black text-green-500 tracking-widest uppercase">{userData?.phoneNumber || "NO IDENTITY LINKED"}</p>
           </header>
           <div className="space-y-6">
              <div className="p-6 bg-[#11172b] rounded-[30px] border border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-4 text-center tracking-[2px]">Identity Link</p>
                <div className="flex gap-2">
                  <input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="+234..." className="bg-[#060a16] rounded-2xl p-3 border border-white/10 text-xs flex-1 outline-none" />
                  <button onClick={() => updateDoc(doc(db, "users", user.uid), { phoneNumber: phoneInput })} className="bg-green-600 p-3 rounded-2xl font-black text-[10px] uppercase">Link</button>
                </div>
              </div>
              <button onClick={() => setStealthMode(!stealthMode)} className="p-6 w-full rounded-[30px] border border-white/5 bg-[#11172b] flex justify-between items-center">
                 <p className="font-black text-xs uppercase">Stealth Mode</p>
                 <div className={`w-10 h-5 rounded-full relative ${stealthMode ? 'bg-green-500' : 'bg-slate-800'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${stealthMode ? 'right-0.5' : 'left-0.5'}`}></div>
                 </div>
              </button>
              <button onClick={() => signOut(auth)} className="w-full p-6 rounded-[30px] bg-red-500/10 text-red-500 font-black uppercase text-xs border border-red-500/10">Terminate Signal</button>
           </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-[#060a16] flex flex-col">
          <header className="p-4 flex items-center gap-4 border-b border-white/5 bg-[#0d1225]">
            <button onClick={() => setSelectedUser(null)} className="p-2 text-green-500 font-black text-xl">←</button>
            <img src={selectedUser.photoURL} className="w-10 h-10 rounded-xl" />
            <div className="flex-1">
              <h4 className="font-black text-[13px] uppercase truncate">{selectedUser.displayName}</h4>
              <p className="text-[8px] font-black text-green-500 uppercase tracking-widest">
                {selectedUser.typing ? 'Typing Signal...' : 'ENCRYPTED SIGNAL 🔒'}
              </p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.senderId === user.uid ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-[24px] ${m.senderId === user.uid ? 'bg-green-600 rounded-tr-none' : 'bg-[#11172b] rounded-tl-none border border-white/5'}`}>
                  {m.type === "gif" ? <img src={m.text} className="w-40 rounded-xl" /> : <p className="text-[14px] font-medium leading-relaxed">{m.encrypted ? decrypt(m.text) : m.text}</p>}
                </div>
                <div className="flex items-center gap-1 mt-1">
                   <span className="text-[7px] text-slate-500 font-black uppercase">{formatTime(m.createdAt)}</span>
                   {m.senderId === user.uid && (
                     m.seen ? <CheckCheck size={10} className="text-green-500" /> : <Check size={10} className="text-slate-500" />
                   )}
                </div>
              </div>
            ))}
            <div ref={scroll}></div>
          </div>

          <div className="p-5 bg-[#0d1225] rounded-t-[40px] shadow-[0_-10px_50px_rgba(0,0,0,0.8)]">
            <div className="bg-[#11172b] p-2 flex gap-2 items-center rounded-full border border-white/5 mb-3 transition-all duration-300">
              <button onClick={() => setKeyboardView(keyboardView === 'emoji' ? 'none' : 'emoji')} className="p-2 text-slate-500"><Smile size={22} /></button>
              <button onClick={() => setKeyboardView(keyboardView === 'gif' ? 'none' : 'gif')} className="p-2 text-slate-500"><ImageIcon size={22} /></button>
              <input value={newMessage} onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)} onChange={(e) => setNewMessage(e.target.value)} placeholder="Send signal..." className="flex-1 bg-transparent py-3 px-2 outline-none text-sm placeholder:text-slate-600" />
              <button 
                onClick={() => handleSend(newMessage)} 
                disabled={!newMessage.trim()}
                className={`
                  flex items-center justify-center transition-all duration-500 ease-out rounded-full
                  ${newMessage.trim().length > 0 
                    ? 'w-28 h-12 bg-green-600 shadow-[0_0_25px_rgba(34,197,94,0.6)]' 
                    : 'w-12 h-12 bg-[#1a2238] shadow-none'
                  }
                `}
              >
                <Send size={20} className={`transition-transform duration-300 ${newMessage.trim().length > 0 ? 'mr-2 rotate-12' : 'rotate-0 text-slate-500'}`} />
                {newMessage.trim().length > 0 && <span className="text-[11px] font-black uppercase tracking-tighter">Send</span>}
              </button>
            </div>
            {keyboardView === 'emoji' && (
              <div className="h-64 overflow-y-auto grid grid-cols-7 gap-y-5 text-center bg-[#0d1225] p-4 rounded-3xl border border-white/5">
                {EMOJI_LIST.map((emoji, i) => (<button key={i} onClick={() => setNewMessage(prev => prev + emoji)} className="text-3xl active:scale-125 transition-transform">{emoji}</button>))}
              </div>
            )}
            {keyboardView === 'gif' && (
              <div className="h-64 overflow-y-auto grid grid-cols-2 gap-3 bg-[#0d1225] p-4 rounded-3xl border border-white/5">
                {GIF_LIST.map((gif, i) => (<img key={i} src={gif} onClick={() => handleSend(gif, "gif")} className="w-full h-24 object-cover rounded-xl active:scale-95 transition-all" />))}
              </div>
            )}
          </div>
        </div>
      )}

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
