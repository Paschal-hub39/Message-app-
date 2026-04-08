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
const MOODS = {
  "🔥 hype": "border-orange-500 shadow-orange-500/40 text-orange-400",
  "😴 chill": "border-blue-400 shadow-blue-400/20 text-blue-300",
  "😤 annoyed": "border-red-600 shadow-red-600/50 text-red-500",
  "🎯 gaming": "border-green-500 shadow-green-500/40 text-green-400"
};

const EMOJI_LIST = "🇲🇲🇲🇶🇲🇾🇲🇦🇳🇦🇳🇵🇲🇬🇲🇱🇲🇫🇲🇵🇲🇹😂😎😪😩🥰😭🙏😡🤣😌🤷😒🕜😓😢☹️🤯💨🚗😞💙😀😃😄😁😆😅😂🤣😭😉😗😙😚😘🥰😍😏😌☺️😊🙂🙃🥳🤩🤤😋😛😝😜🤪😔🥺🤭🤫🤔🤐😶😐😑😬🥱🤗😱🤨🧐😒🙄😤😢😥😟😓😞🤬😠☹️🙁😕😰😨😧😦😮😫😩😣😖🤯😳😲😯😵🥴🥵🤢🥶🤮😴😪🤑🤠😇🤥😷🤕🤒🤧🤓😎🤡💩😈👿👻💀👾👽⛄☃️👺👹🤖☠️🌚🌞🌝🌛🌜😺😸😹🙉🙈😾😿🙀😽😼😻🙊💫⭐🌟✨⚡💥💢🤍🖤🤎💜💙💙💚💛🧡❤️💘💝💖💗💓💞💕💌🗣️👤👥💋💔❣️♥️💟👣💦🧠🩸🦠🦷🦴👀🦵🦶🦻👍👃👂👅👄👁️🦿🦾💪👏👍👎🤚🖐️👐🙌🖐️🤞🤙🤏✌️🤘🤟🖖✋👌👉☝️👆👆👇🖕✍️✍️🖕👇👆☝️👈👉👌🤳🙏💅🤳🙇🙋💁🙆🙅🤷🤦🙍🧘🛌🛀🧖💇💆🧏🙎🧍🤸🧎👩‍🦼👩‍🦽👩‍🦯🚶🏃🤼‍♂️🤼🏋️🧗🚵🚴🤾⛹️🤼‍♀️🤹🏌️🏇🤺⛷️🏂🪂🧝🧞🧚🧜🤽🏊🚣🏄🧙🧛🧟🦸🦹🤶💂👸👩‍🔬👩‍✈️🕵️👮👷👩‍🚀👰🤵👩‍⚕️👩‍🏭👩‍🏭👩‍🚒👩‍F👩‍🏫👩‍🎓👩‍💼👲🧕👳👩‍🍳👩‍🎨👩‍🎤👩‍💻👩‍⚖️👼👶🧒🧑🧓👩‍🦳👩‍🦰👱👯‍♂️👯🕺💃🕴️🧔👩‍🦲👩‍🦱👯‍♀️🧑‍🤝‍🧑👭👬👫💏👩‍❤️‍💋‍👨👨‍❤️‍💋‍👨🤱🤰👩‍❤️‍👩👨‍❤️‍👨👩‍❤️‍👨💑👩‍❤️‍💋‍👩🏵️💮🌸🌷🌺🥀🌹💐🌻🌼🍂🍁🍄🌾🌿🌱⛰️🌲🌳🌴🌵🍀☘️☘️🍃🏔️☃️⛄🌡️🔥🌋🏜️🏞️🌀❄️❄️🌬️🌊🏖️🏝️🌄🌅🌪️⚡☔💧💧🌨️☁️🌧️🌞☀️🌤️⛅🌥️🌦️⛈️🌩️🌝🌚🌜🌛🌙⭐🌟✨🌌🌠🌫️🌏🌏🌎🌜🌚🕳️☄️🪐🕳️🌎🌍🌏🌫️🌠🌌🌗🌖🌔🌔🌓🌒🌘🙈🙉🙊🐵🦁🐯🐱🐰🐰🐭🐹🐼🐨🐻🐺🐶🦊🐮🐷🐽🐗🐴🐲🐸🐸🦈🐧🦚🦢🐤🐤🕊️🦡🐿️🦍🦅🦦🐅🐘🦏🐘🦥".split("");

const GIF_LIBRARY = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpueXJ3bmZ4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKVUn7iM8FMEU24/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpueXJ3bmZ4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/l41lTfuxz2M4V28OA/giphy.gif",
  "https://media.giphy.com/media/26FLdmIp6wJr91JAI/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOW9oZnd4Mmt5NHB6amZ5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/vfsAZNQyFEjPde789V/giphy.gif"
];

function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [showKbd, setShowKbd] = useState(false);
  const [mood, setMood] = useState("🔥 hype");
  const scroll = useRef();

  // --- PHONE BACK BUTTON ENGINE ---
  useEffect(() => {
    const handleBack = (e) => {
      if (selectedUser) { e.preventDefault(); setSelectedUser(null); }
      else if (activeTab !== "chats") { e.preventDefault(); setActiveTab("chats"); }
    };
    window.history.pushState(null, "", "/");
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, [selectedUser, activeTab]);

  // --- FIREBASE CORE ---
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

  // --- MESSAGE HANDLER ---
  const handleSend = async (val, type = "text") => {
    if (!val.trim() || !selectedUser) return;
    const isGif = val.startsWith("http");
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    
    await addDoc(collection(db, "messages"), { 
      text: val, type: isGif ? "sticker" : type,
      senderId: user.uid, receiverId: selectedUser.uid, chatId, 
      createdAt: serverTimestamp(), mood: mood
    });
    setNewMessage(""); setShowKbd(false);
  };

  // --- KEYBOARD CONTRIBUTION ---
  const insertToInput = (char) => {
    setNewMessage(prev => prev + char);
  };

  if (!user) return (
    <div className="h-screen bg-[#060a16] flex flex-col items-center justify-center p-10">
      <Zap size={60} className="text-green-500 mb-6 animate-bounce" />
      <h1 className="text-4xl font-black italic mb-10 tracking-tighter">Paschala Core</h1>
      <button onClick={() => signInWithPopup(auth, googleProvider)} className="w-full bg-white text-black py-5 rounded-[25px] font-black uppercase shadow-2xl">Initialize</button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#060a16] text-white flex flex-col overflow-hidden">
      
      {/* 🚀 SETTINGS VIEW */}
      {!selectedUser && activeTab === "settings" && (
        <div className="flex-1 p-8 overflow-y-auto animate-in slide-in-from-right-10">
          <header className="flex flex-col items-center mb-12">
            <img src={user.photoURL} className="w-24 h-24 rounded-[35px] border-4 border-green-500/20 mb-4" />
            <h2 className="text-2xl font-black">{user.displayName}</h2>
            <p className="text-[10px] font-black text-green-500 tracking-widest uppercase">System Administrator</p>
          </header>

          <div className="space-y-4">
             <div className="p-5 bg-[#11172b] rounded-[30px] border border-white/5 flex items-center gap-4">
                <Palette className="text-purple-500" />
                <div className="flex-1"><p className="font-bold text-sm">Theme Engine</p><p className="text-[9px] text-slate-500 uppercase">Current: {mood}</p></div>
                <ChevronRight size={18} />
             </div>
             <div onClick={() => signOut(auth)} className="p-5 bg-red-500/10 rounded-[30px] border border-red-500/10 flex items-center gap-4 text-red-500">
                <LogOut />
                <p className="font-black text-xs uppercase tracking-widest">Sign Out Core</p>
             </div>
          </div>
        </div>
      )}

      {/* 🚀 CHAT LIST VIEW */}
      {!selectedUser && activeTab === "chats" && (
        <div className="flex-1 flex flex-col animate-in fade-in duration-300">
          <header className="p-8 flex justify-between items-center">
            <h2 className="text-4xl font-black tracking-tighter italic">NexusOS</h2>
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center"><Zap size={24} className="text-green-500" /></div>
          </header>

          <div className="px-8 mb-6"><div className="bg-[#11172b] rounded-full p-5 flex items-center gap-4 border border-white/5"><Search className="text-slate-600" size={20} /><input placeholder="Search encrypted channels..." className="bg-transparent outline-none text-sm w-full" /></div></div>

          <div className="flex-1 overflow-y-auto px-8 space-y-4 pb-32">
            {users.map(u => (
              <div key={u.uid} onClick={() => setSelectedUser(u)} className="flex items-center gap-5 p-5 bg-[#11172b]/60 rounded-[35px] border border-white/5 active:scale-95 transition-all">
                <img src={u.photoURL} className="w-16 h-16 rounded-[25px] object-cover" />
                <div className="flex-1">
                  <p className="font-black text-lg">{u.displayName}</p>
                  <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">{u.currentMood || "🔥 Hype"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🚀 ACTIVE CHAT ENGINE */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-[#060a16] flex flex-col animate-in slide-in-from-bottom duration-500">
          <header className="p-6 flex items-center gap-4 border-b border-white/5 bg-[#0d1225]">
            <button onClick={() => setSelectedUser(null)} className="text-slate-500">←</button>
            <img src={selectedUser.photoURL} className="w-10 h-10 rounded-xl" />
            <h4 className="font-black text-xs uppercase tracking-tight">{selectedUser.displayName}</h4>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.senderId === user.uid ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] ${m.type === 'sticker' ? 'bg-transparent' : `p-4 rounded-[25px] ${m.senderId === user.uid ? 'bg-green-600 rounded-tr-none' : 'bg-[#11172b] rounded-tl-none border border-white/5 shadow-2xl'}`}`}>
                  {m.type === 'sticker' ? <img src={m.text} className="w-48 h-48 rounded-[30px] border-2 border-green-500" /> : <p className="text-[15px] font-medium">{m.text}</p>}
                </div>
              </div>
            ))}
            <div ref={scroll}></div>
          </div>

          {/* INFINITY KEYBOARD UI */}
          <div className="p-6 bg-[#0d1225] rounded-t-[40px] shadow-3xl">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(newMessage); }} className="bg-[#11172b] p-2 flex gap-3 items-center rounded-full border border-white/5 mb-4">
              <button type="button" onClick={() => setShowKbd(!showKbd)} className={`p-2 transition-colors ${showKbd ? 'text-green-500' : 'text-slate-500'}`}><Smile size={28} /></button>
              <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type Decrypted Channel..." className="flex-1 bg-transparent py-4 outline-none text-[16px]" />
              <button type="submit" className="bg-green-600 p-4 rounded-full shadow-lg"><Send size={24} /></button>
            </form>

            {showKbd && (
              <div className="h-64 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
                <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5">
                  <button className="flex-shrink-0 px-6 py-2 bg-green-600 rounded-full text-[10px] font-black uppercase">Emoji</button>
                  <button className="flex-shrink-0 px-6 py-2 bg-slate-800 rounded-full text-[10px] font-black uppercase text-slate-500">Gifs</button>
                </div>
                
                {/* EMOJI GRID */}
                <div className="flex-1 overflow-y-auto grid grid-cols-7 gap-2 p-2">
                  {EMOJI_LIST.map((e, i) => (
                    <button key={i} onClick={() => insertToInput(e)} className="text-2xl hover:scale-125 transition-transform p-1">{e}</button>
                  ))}
                </div>

                {/* GIF ROW */}
                <div className="flex gap-4 overflow-x-auto p-2">
                  {GIF_LIBRARY.map((g, i) => (
                    <img key={i} src={g} onClick={() => handleSend(g, "sticker")} className="w-32 h-32 rounded-2xl object-cover border border-white/10 active:scale-90" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🚀 NAVIGATION BAR */}
      <nav className="p-5 px-12 bg-[#0d1225] flex justify-between border-t border-white/5 pb-10">
        <button onClick={() => setActiveTab("chats")} className={`flex flex-col items-center ${activeTab === 'chats' ? 'text-green-500' : 'text-slate-600'}`}><MessageSquare size={24} /><span className="text-[8px] font-black mt-1">CHATS</span></button>
        <button onClick={() => setActiveTab("wallet")} className={`flex flex-col items-center ${activeTab === 'wallet' ? 'text-green-500' : 'text-slate-600'}`}><Wallet size={24} /><span className="text-[8px] font-black mt-1">WALLET</span></button>
        <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center ${activeTab === 'settings' ? 'text-green-500' : 'text-slate-600'}`}><Settings size={24} /><span className="text-[8px] font-black mt-1">SYSTEM</span></button>
      </nav>

    </div>
  );
}
export default App;
