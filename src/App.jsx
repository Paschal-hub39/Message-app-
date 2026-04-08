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
  Signal, EyeOff, Radio
} from 'lucide-react';

// --- 💎 FULL EMOJI & GIF RESTORED (ABSOLUTELY NO REMOVALS) ---
const EMOJI_LIST = [
  "🇲🇲","🇲🇶","🇲🇾","🇲🇦","🇳🇦","🇳🇵","🇲🇬","🇲🇱","🇲🇫","🇲🇵","🇲🇹",
  "😂","😎","😪","😩","🥰","😭","🙏","😡","🤣","😌","🤷","😒","🕜","😓","😢","☹️","🤯","💨","🚗","😞","💙",
  "😀","😃","😄","😁","😆","😅","😉","😗","😙","😚","😘","😍","😏","☺️","😊","🙂","🙃","🥳","🤩","🤤","😋",
  "😛","😝","😜","🤪","😔","🥺","🤭","🤫","🤔","🤐","😶","😐","😑","😬","🥱","🤗","😱","🤨","🧐","🙄","😤",
  "😥","😟","🤬","😠","🙁","😕","😰","😨","😧","😦","😮","😫","😣","😖","😳","😲","😯","😵","🥴","🥵","🤢",
  "🥶","🤮","😴","🤑","🤠","😇","🤥","😷","🤕","🤒","🤧","🤓","🤡","💩","😈","👿","👻","💀","👾","👽","⛄",
  "☃️","👺","👹","🤖","☠️","🌚","🌞","🌝","🌛","🌜","😺","😸","😹","🙉","🙈","😾","😿","🙀","😽","😼","😻",
  "🙊","💫","⭐","🌟","✨","⚡","💥","💢","🤍","🖤","🤎","💜","💚","💛","🧡","❤️","💘","💝","💖","💗","💓",
  "💞","💕","💌","🗣️","👤","👥","💋","💔","❣️","♥️","💟","👣","💦","🧠","🩸","🦠","🦷","🦴","👀","🦵","🦶",
  "🦻","👍","👃","👂","👅","👄","👁️","🦿","🦾","💪","👏","👎","🤚","🖐️","👐","🙌","🤞","🤙","🤏","✌️","🤘",
  "🤟","🖖","✋","👌","👉","☝️","👆","👇","🖕","✍️","👈","🤳","🙏","💅","🙇","🙋","💁","🙆","🙅","🤷","🤦",
  "🙍","🧘","🛌","🛀","🧖","💇","💆","🧏","🙎","🧍","🤸","🧎","🚶","🏃","🧗","🚵","🚴","🤾","⛹️","🤹","🏌️",
  "🏇","🤺","⛷️","🏂","🪂","🧝","🧞","🧚","🧜","🤽","🏊","🚣","🏄","🧙","🧛","🧟","🦸","🦹","🤶","💂",
  "👸","🕵️","👮","👷","👰","🤵","👼","👶","🧒","🧑","🧓","🧔","👯‍♂️","👯","🕺","💃","🕴️","👫","👭","👬","💏",
  "🤱","🤰","💑","🏵️","💮","🌸","🌷","🌺","🥀","🌹","💐","🌻","🌼","🍂","🍁","🍄","🌾","🌿","🌱","⛰️","🌲",
  "🌳","🌴","🌵","🍀","☘️","🍃","🏔️","🌡️","🔥","🌋","🏜️","🏞️","🌀","❄️","🌬️","🌊","🏖️","🏝️","🌄","🌅","🌪️",
  "⚡","☔","💧","🌨️","☁️","🌧️","🌞","☀️","🌤️","⛅","🌥️","🌦️","⛈️","🌩️","🌝","🌚","🌜","🌛","🌙","🌌","🌠",
  "🌫️","🌏","🌎","🕳️","☄️","🪐","🌍","🌗","🌖","🌔","🌓","🌒","🌘","🙈","🙉","🙊","🐵","🦁","🐯","🐱","🐰",
  "🐭","🐹","🐼","🐨","🐻","🐺","🐶","🦊","🐮","🐷","🐽","🐗","🐴","🐲","🐸","🦈","🐧","🦚","🦢","🐤","🕊️",
  "🦡","🐿️","🦍","🦅","🦦","🐅","🐘","🦏","🦥"
];

const GIF_LIBRARY = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpueXJ3bmZ4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKVUn7iM8FMEU24/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpueXJ3bmZ4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/l41lTfuxz2M4V28OA/giphy.gif",
  "https://media.giphy.com/media/26FLdmIp6wJr91JAI/giphy.gif"
];

function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [showKbd, setShowKbd] = useState(false);
  const [kbdTab, setKbdTab] = useState("emoji");
  const [isScanning, setIsScanning] = useState(false);
  const [stealthMode, setStealthMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scroll = useRef();

  // --- 🕒 1. STEALTH & SIGNAL LOGIC ---
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    
    // Stealth Mode determines if you show "Online" or "Offline" (Signal Lost)
    const updateStatus = { 
      status: stealthMode ? "offline" : "online", 
      signalStrength: stealthMode ? 0 : 3,
      typing: isTyping,
      lastSeen: serverTimestamp() 
    };

    setDoc(userRef, updateStatus, { merge: true });

    // Handle abrupt disconnects (Signal Lost)
    const handleOffline = () => updateDoc(userRef, { status: "offline", signalStrength: 0 });
    window.addEventListener("beforeunload", handleOffline);
    return () => { 
        handleOffline(); 
        window.removeEventListener("beforeunload", handleOffline); 
    };
  }, [user, stealthMode, isTyping]);

  // --- ✔️ 2. READ RECEIPTS LOGIC ---
  useEffect(() => {
    if (!user || !selectedUser || messages.length === 0) return;
    messages.forEach(m => {
      if (m.receiverId === user.uid && !m.seen) {
        updateDoc(doc(db, "messages", m.id), { seen: true });
      }
    });
  }, [messages, user, selectedUser]);

  // --- 🛰️ 3. NETWORK SCAN ---
  const runNetworkScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 2500);
  };

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u || null));
  }, []);

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
      scroll.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [user, selectedUser]);

  const handleSend = async (val, type = "text") => {
    if (!val.trim() || !selectedUser) return;
    const isGif = val.startsWith("http");
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    await addDoc(collection(db, "messages"), { 
      text: val, type: isGif ? "sticker" : type,
      senderId: user.uid, receiverId: selectedUser.uid, chatId, 
      createdAt: serverTimestamp(), seen: false 
    });
    setNewMessage(""); setShowKbd(false); setIsTyping(false);
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) return (
    <div className="h-screen bg-[#060a16] flex flex-col items-center justify-center p-10 text-white">
      <Zap size={60} className="text-green-500 mb-6 animate-pulse" />
      <h1 className="text-4xl font-black italic mb-10 tracking-tighter">Paschala Hub</h1>
      <button onClick={() => signInWithPopup(auth, googleProvider)} className="w-full bg-white text-black py-5 rounded-[25px] font-black uppercase">Initialize Hub</button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#060a16] text-white flex flex-col overflow-hidden font-sans">
      
      {/* 🟢 CHAT LIST VIEW */}
      {!selectedUser && activeTab === "chats" && (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in">
          <header className="p-8 flex justify-between items-center bg-[#0d1225]">
            <div>
              <h2 className="text-4xl font-black italic tracking-tighter">Paschala Hub</h2>
              <p className="text-[8px] font-black text-green-500 tracking-widest mt-1 uppercase">Satellite Hub Active</p>
            </div>
            <button onClick={runNetworkScan} className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${isScanning ? 'border-green-500 bg-green-500/20 animate-spin' : 'border-white/10 bg-white/5'}`}>
              <Zap size={24} className={isScanning ? "text-green-500" : "text-slate-500"} />
            </button>
          </header>

          <div className="p-6">
            <div className="bg-[#11172b] rounded-3xl p-4 flex items-center gap-3 border border-white/5">
              <Search className="text-green-500" size={18} />
              <input placeholder="Search encrypted frequencies..." className="bg-transparent outline-none text-xs w-full" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-24 mt-4">
            {isScanning && <div className="text-center py-2 text-[10px] font-black text-green-500 animate-pulse tracking-widest uppercase">Scanning for Satellites...</div>}
            
            {users.map(u => (
              <div key={u.uid} onClick={() => setSelectedUser(u)} className="flex items-center gap-4 p-4 bg-[#11172b]/50 rounded-[28px] border border-white/5 active:scale-95 transition-all">
                <div className="relative">
                  <img src={u.photoURL} className="w-14 h-14 rounded-2xl object-cover" />
                  {u.status === 'online' && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-[#0d1225] animate-pulse"></div>}
                </div>
                <div className="flex-1">
                  <p className="font-black text-[15px]">{u.displayName}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5 items-end h-2.5">
                       {[1,2,3].map(b => <div key={b} className={`w-0.5 rounded-full ${u.signalStrength >= b ? 'bg-green-500' : 'bg-white/10'}`} style={{height: `${b * 33}%`}}></div>)}
                    </div>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${u.status === 'online' ? 'text-green-500' : 'text-slate-500'}`}>
                      {u.typing ? '⚡ Typing...' : u.status === 'online' ? 'Signal Regained' : 'Signal Lost'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🟢 SYSTEM & STEALTH MODE VIEW */}
      {activeTab === "settings" && !selectedUser && (
        <div className="flex-1 flex flex-col bg-[#060a16] p-8 overflow-y-auto pb-32">
           <header className="flex flex-col items-center mb-10">
              <div className="relative">
                <img src={user.photoURL} className="w-24 h-24 rounded-[35px] border-4 border-green-500/20 mb-4" />
                <div className={`absolute bottom-3 right-0 w-6 h-6 rounded-full border-4 border-[#0d1225] ${stealthMode ? 'bg-slate-500' : 'bg-green-500 shadow-[0_0_10px_#22c55e]'}`}></div>
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">{user.displayName}</h2>
              <p className="text-[9px] font-black text-green-500 tracking-widest">PASCHALA ADMIN</p>
           </header>
           
           <div className="space-y-4">
              <button onClick={() => setStealthMode(!stealthMode)} className={`p-6 w-full rounded-[30px] border flex justify-between items-center transition-all ${stealthMode ? 'border-green-500 bg-green-500/10' : 'border-white/5 bg-[#11172b]'}`}>
                 <div className="flex items-center gap-4">
                    <EyeOff className={stealthMode ? "text-green-500" : "text-slate-500"} />
                    <p className="font-black text-xs uppercase">Stealth Mode</p>
                 </div>
                 <div className={`w-10 h-5 rounded-full relative ${stealthMode ? 'bg-green-500' : 'bg-slate-800'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${stealthMode ? 'right-0.5' : 'left-0.5'}`}></div>
                 </div>
              </button>
              
              <button onClick={() => signOut(auth)} className="w-full p-6 rounded-[30px] bg-red-500/10 text-red-500 border border-red-500/20 font-black uppercase text-xs">Terminate Session</button>
           </div>
        </div>
      )}

      {/* 🟢 ACTIVE CHAT VIEW */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-[#060a16] flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="p-4 flex items-center gap-4 border-b border-white/5 bg-[#0d1225]">
            <button onClick={() => setSelectedUser(null)} className="p-2 text-green-500">←</button>
            <div className="relative">
               <img src={selectedUser.photoURL} className="w-9 h-9 rounded-lg" />
               <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#0d1225] ${selectedUser.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`}></div>
            </div>
            <div className="flex-1">
              <h4 className="font-black text-xs uppercase">{selectedUser.displayName}</h4>
              <p className="text-[8px] font-black text-green-500 uppercase tracking-widest">
                {selectedUser.typing ? '⚡ Typing...' : selectedUser.status === 'online' ? 'Signal Regained' : 'Signal Lost'}
              </p>
            </div>
            <div className="flex gap-0.5 items-end h-3 pr-2">
                {[1,2,3].map(b => <div key={b} className={`w-1 rounded-full ${selectedUser.signalStrength >= b ? 'bg-green-500' : 'bg-white/10'}`} style={{height: `${b * 30}%`}}></div>)}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col animate-in slide-in-from-bottom-2 duration-300 ${m.senderId === user.uid ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[75%] relative ${m.type === 'sticker' ? 'bg-transparent' : `px-4 py-2.5 rounded-[22px] ${m.senderId === user.uid ? 'bg-green-600 rounded-tr-none' : 'bg-[#11172b] rounded-tl-none border border-white/5'}`}`}>
                  {m.type === 'sticker' ? <img src={m.text} className="w-36 h-36 rounded-2xl border border-green-500" /> : <p className="text-[13px] font-medium leading-snug">{m.text}</p>}
                </div>
                <div className={`flex items-center gap-1 mt-1 ${m.senderId === user.uid ? 'flex-row-reverse' : 'flex-row'}`}>
                   <span className="text-[7px] text-slate-500 font-black">{formatTime(m.createdAt)}</span>
                   {m.senderId === user.uid && (m.seen ? <CheckCheck size={10} className="text-green-400" /> : <Check size={10} className="text-slate-600" />)}
                </div>
              </div>
            ))}
            <div ref={scroll}></div>
          </div>

          <div className="p-5 bg-[#0d1225] rounded-t-[35px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(newMessage); }} className="bg-[#11172b] p-1.5 flex gap-2 items-center rounded-full border border-white/5 mb-3">
              <button type="button" onClick={() => setShowKbd(!showKbd)} className={`p-2 transition-all ${showKbd ? 'text-green-500 rotate-12' : 'text-slate-500'}`}><Smile size={24} /></button>
              <input 
                value={newMessage} 
                onFocus={() => setIsTyping(true)} 
                onBlur={() => setIsTyping(false)}
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Type encrypted signal..." className="flex-1 bg-transparent py-3 outline-none text-sm" />
              <button type="submit" className={`bg-green-600 rounded-full transition-all duration-300 transform ${newMessage.length > 0 ? 'p-3 px-5 scale-110 shadow-[0_0_15px_#22c55e]' : 'p-3 opacity-40'}`}>
                <Send size={18} className="animate-pulse" />
              </button>
            </form>

            {showKbd && (
              <div className="h-64 flex flex-col animate-in slide-in-from-bottom duration-300">
                <div className="flex gap-2 mb-3 px-2">
                  <button onClick={() => setKbdTab("emoji")} className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase ${kbdTab === 'emoji' ? 'bg-green-600' : 'bg-slate-800'}`}>Emoji</button>
                  <button onClick={() => setKbdTab("gifs")} className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase ${kbdTab === 'gifs' ? 'bg-green-600' : 'bg-slate-800'}`}>Gifs</button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scroll">
                  {kbdTab === "emoji" ? (
                    <div className="grid grid-cols-7 gap-y-4 text-center">
                      {EMOJI_LIST.map((emoji, i) => (
                        <button key={i} onClick={() => setNewMessage(prev => prev + emoji)} className="text-2xl active:scale-150 transition-transform">{emoji}</button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-4 px-2">
                      {GIF_LIBRARY.map((gif, i) => (
                        <img key={i} src={gif} onClick={() => handleSend(gif, "sticker")} className="w-28 h-28 rounded-xl object-cover border border-white/10" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🟢 NAVIGATION */}
      <nav className="p-4 px-10 bg-[#0d1225] flex justify-between border-t border-white/5 pb-8">
        <button onClick={() => setActiveTab("chats")} className={`flex flex-col items-center transition-all ${activeTab === 'chats' ? 'text-green-500 scale-110' : 'text-slate-600'}`}><MessageSquare size={22} /><span className="text-[8px] font-black mt-1 uppercase">Signals</span></button>
        <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center transition-all ${activeTab === 'settings' ? 'text-green-500 scale-110' : 'text-slate-600'}`}><Shield size={22} /><span className="text-[8px] font-black mt-1 uppercase">System</span></button>
      </nav>
    </div>
  );
}
export default App;
