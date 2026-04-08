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
  Share2, ChevronRight, Bell, Lock, Palette, LogOut, Info, Heart, Image as ImageIcon
} from 'lucide-react';

// --- CONFIG & ASSETS ---
// I am using a more robust string for emojis to prevent the "Question Mark" boxes
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
  "🏇"," fencing","⛷️","🏂","🪂","🧝","🧞","🧚","🧜","🤽","🏊","🚣","🏄","🧙","🧛","🧟","🦸","🦹","🤶","💂",
  "👸","🕵️","👮","👷","👰","🤵","👼","👶","🧒","🧑","🧓","🧔","👯‍♂️","👯","🕺","💃","🕴️","👫","👭","👬","💏",
  "🤱","🤰","💑","🏵️","💮","🌸","🌷","🌺","🥀","🌹","💐","🌻","🌼","🍂","🍁","🍄","🌾","🌿","🌱","⛰️","🌲",
  "🌳","🌴","🌵","🍀","☘️","🍃","🏔️","🌡️","🔥","🌋","🏜️","🏞️","🌀","❄️","🌬️","🌊","🏖️","🏝️","🌄","🌅","🌪️",
  "⚡","☔","💧","🌨️","☁️","🌧️","🌞","☀️","🌤️","⛅","🌥️","🌦️","⛈️","🌩️","🌝","🌚","🌜","🌛","🌙","🌌","🌠",
  "🌫️","🌏","🌎","🕳️","☄️","🪐","🌍","🌗","🌖","🌔","🌓","🌒","🌘","🙈","🙉","🙊","🐵","🦁","🐯","🐱","🐰",
  "🐭","🐹","🐼","🐨","🐻","🐺","🐶","🦊","🐮","🐷","🐽","🐗","🐴","🐲","🐸","🦈","🐧","🦚","🦢","🐤","🕊️",
  "🦡","🐿️","🦍","🦅","🦦","🐅","Elephant","🦏","🦥"
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
  const [kbdTab, setKbdTab] = useState("emoji"); // emoji or gifs
  const scroll = useRef();

  // --- 1. SCROLL FIX: History API for Back Button ---
  useEffect(() => {
    const handleBack = (e) => {
      if (selectedUser) { e.preventDefault(); setSelectedUser(null); }
      else if (activeTab !== "chats") { e.preventDefault(); setActiveTab("chats"); }
    };
    window.history.pushState(null, "", "/");
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, [selectedUser, activeTab]);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u || null));
  }, []);

  // --- 2. CONTACT SCROLL FIX: Load users ---
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
      createdAt: serverTimestamp()
    });
    setNewMessage(""); setShowKbd(false);
  };

  const insertEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
  };

  if (!user) return (
    <div className="h-screen bg-[#060a16] flex flex-col items-center justify-center p-10">
      <Zap size={60} className="text-green-500 mb-6 animate-pulse" />
      <button onClick={() => signInWithPopup(auth, googleProvider)} className="w-full bg-white text-black py-5 rounded-[25px] font-black uppercase">Initialize</button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#060a16] text-white flex flex-col overflow-hidden">
      
      {/* 🟢 CONTACT LIST VIEW (Fixed Scroll) */}
      {!selectedUser && activeTab === "chats" && (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in">
          <header className="p-8 flex justify-between items-center bg-[#0d1225]">
            <h2 className="text-4xl font-black italic tracking-tighter italic">NexusOS</h2>
            <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center"><Zap size={20} className="text-green-500" /></div>
          </header>

          <div className="p-6">
            <div className="bg-[#11172b] rounded-3xl p-4 flex items-center gap-3 border border-white/5">
              <Search className="text-slate-600" size={18} />
              <input placeholder="Search encrypted..." className="bg-transparent outline-none text-xs w-full" />
            </div>
          </div>

          {/* CRITICAL: Added overflow-y-auto to allow scrolling contacts */}
          <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-24">
            {users.map(u => (
              <div key={u.uid} onClick={() => setSelectedUser(u)} className="flex items-center gap-4 p-4 bg-[#11172b]/50 rounded-[28px] border border-white/5 active:bg-green-600/10">
                <img src={u.photoURL} className="w-14 h-14 rounded-2xl object-cover shadow-xl" />
                <div className="flex-1">
                  <p className="font-black text-[15px]">{u.displayName}</p>
                  <p className="text-[9px] text-green-500 font-black uppercase tracking-widest">Active Signal</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🟢 CHAT ENGINE (Minimized Bubbles) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-[#060a16] flex flex-col animate-in slide-in-from-bottom">
          <header className="p-4 flex items-center gap-4 border-b border-white/5 bg-[#0d1225]">
            <button onClick={() => setSelectedUser(null)} className="p-2">←</button>
            <img src={selectedUser.photoURL} className="w-9 h-9 rounded-lg" />
            <h4 className="font-black text-xs uppercase">{selectedUser.displayName}</h4>
          </header>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.senderId === user.uid ? 'items-end' : 'items-start'}`}>
                {/* 3. BUBBLE MINIMIZER: Reduced padding and max-width */}
                <div className={`max-w-[75%] ${m.type === 'sticker' ? 'bg-transparent' : `px-4 py-2.5 rounded-[22px] ${m.senderId === user.uid ? 'bg-green-600 rounded-tr-none' : 'bg-[#11172b] rounded-tl-none border border-white/5 shadow-lg'}`}`}>
                  {m.type === 'sticker' ? (
                    <img src={m.text} className="w-36 h-36 rounded-2xl border border-green-500" />
                  ) : (
                    <p className="text-[13px] font-medium leading-snug">{m.text}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={scroll}></div>
          </div>

          {/* 🟢 KEYBOARD SYSTEM (Fixed Emojis) */}
          <div className="p-5 bg-[#0d1225] rounded-t-[35px] shadow-2xl">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(newMessage); }} className="bg-[#11172b] p-1.5 flex gap-2 items-center rounded-full border border-white/5 mb-3">
              <button type="button" onClick={() => setShowKbd(!showKbd)} className={`p-2 ${showKbd ? 'text-green-500' : 'text-slate-500'}`}><Smile size={24} /></button>
              <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type Decrypted..." className="flex-1 bg-transparent py-3 outline-none text-sm" />
              <button type="submit" className="bg-green-600 p-3 rounded-full"><Send size={18} /></button>
            </form>

            {showKbd && (
              <div className="h-60 flex flex-col animate-in zoom-in-95">
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setKbdTab("emoji")} className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase ${kbdTab === 'emoji' ? 'bg-green-600' : 'bg-slate-800 text-slate-500'}`}>Emoji</button>
                  <button onClick={() => setKbdTab("gifs")} className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase ${kbdTab === 'gifs' ? 'bg-green-600' : 'bg-slate-800 text-slate-500'}`}>Gifs</button>
                </div>
                
                {/* 4. FIXED EMOJI GRID: Map individual strings to prevent encoding errors */}
                <div className="flex-1 overflow-y-auto">
                  {kbdTab === "emoji" ? (
                    <div className="grid grid-cols-7 gap-y-4 text-center">
                      {EMOJI_LIST.map((emoji, i) => (
                        <button key={i} onClick={() => insertEmoji(emoji)} className="text-2xl active:scale-150 transition-transform">{emoji}</button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-4">
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

      {/* 🟢 BOTTOM NAVIGATION */}
      <nav className="p-4 px-10 bg-[#0d1225] flex justify-between border-t border-white/5 pb-8">
        <button onClick={() => setActiveTab("chats")} className={`flex flex-col items-center ${activeTab === 'chats' ? 'text-green-500' : 'text-slate-600'}`}><MessageSquare size={22} /><span className="text-[8px] font-black mt-1">CHATS</span></button>
        <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center ${activeTab === 'settings' ? 'text-green-500' : 'text-slate-600'}`}><Settings size={22} /><span className="text-[8px] font-black mt-1">SYSTEM</span></button>
      </nav>
    </div>
  );
}
export default App;
