import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, addDoc, query, orderBy, onSnapshot, where, 
  serverTimestamp, setDoc, doc, updateDoc, limit, getDocs, arrayUnion, arrayRemove, increment
} from 'firebase/firestore';
import { 
  Send, MessageSquare, Search, Shield, Radio, Lock, Smile, X, Gift, Plus, Bell, ChevronRight, Flame, Zap, Palette, User
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

const EMOJI_LIST = ["😂","😎","🥰","😭","🙏","😡","🤣","😌","🤷","😒","💙","😀","😃","😄","😁","😆","😅","😉","😘","😍","😏","😊","🙂","🙃","🥳","🤩","😋","😛","😜","🤪","😔","🥺","🤭","🤫","🤔","🤐","😶","😐","😑","😬","🥱","🤗","😱","🤨","🧐","🙄","😤","😥","😟","🤬","😠","🙁","😕","😰","😨","😧","😦","😮","😫","😣","😖","😳","😲","😯","😵","🥴","🥵","🤢","🥶","🤮","😴","🤑","🤠","😇","🤥","🏽","🤒","🤧","🤓","🤡","💩","😈","👿","👻","💀","👾","👽","⛄","👺","👹","🤖","☠️","🌚","🌞","🌝","💫","⭐","🌟","✨","⚡","💥","💢","🤍","🖤","🤎","💜","💚","💛","🧡","❤️","💘","💝","💖","💗","💓","💞","💕","💌","🗣️","👤","👥","💋","💔","❣️","❤️","💟","👣","💦","🧠","🩸","🦠","🦷","🦴","👀","👍","👎","💪","👏","🙏","💅","🙇","🙋","💁","🙆","🙅","🤷","🤦","🙍","🧘","🤸","🚶","🏃","🧗","🚵","🚴","🤾","⛹️","🤹","🏌️","🏇","🤺","⛷️","🏂","🪂","🧝","🧞","🧚","🧜","🤽","🏊","學","🏄","🧙","🧛","🧟","🦸","🦹","🤶","衛","👸","偵","👮","👷","👰","🤵","👼","👶","🧒","🧑","🧓","🧔","👯‍♂️","👯","🕺","💃","🕴️","👫","👭","👬","💏","🤱","🤰","💑","🏵️","💮","🌸","🌷","🌺","🥀","🌹","💐","🌻","🌼","🍂","🍁","🍄","🌾","🌿","🌱","🔥","🌀","❄️","🌬️","🌊","🏖️","🏝️","🌄","🌅","🌪️","⚡","☔","💧","🌨️","☁️","🌧️","🌞","☀️","🌤️","⛅","🌥️","🌦️","⛈️","🌩️","🌝","🌚","🌜","🌛","🌙","🌌","🌠","🌫️","🌏","🌎","🌍","🪐"];

const GIF_LIST = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlUxc2YM1NC6ny8/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26AHONh79u4m5W98s/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKVUn7iM8FMEU24/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l41lTfuxV5F68S96E/giphy.gif"
];

const THEMES = {
  vortex: "#22c55e",
  cyan: "#06b6d4",
  plasma: "#a855f7",
  gold: "#eab308",
  crimson: "#ef4444"
};

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [marketIdeas, setMarketIdeas] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [newIdea, setNewIdea] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [keyboardView, setKeyboardView] = useState("none"); 
  const [replyingTo, setReplyingTo] = useState(null);
  const [reactionId, setReactionId] = useState(null);
  const [burnerMode, setBurnerMode] = useState(false);
  const scroll = useRef();
  const touchStart = useRef(0);

  const themeColor = userData?.theme || THEMES.vortex;

  useEffect(() => {
    if ("Notification" in window) Notification.requestPermission();
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    updateDoc(userRef, { status: "online", lastSeen: serverTimestamp() });
    return () => updateDoc(userRef, { status: "offline", lastSeen: serverTimestamp() });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setPhoneInput(data.phoneNumber || "");
        setBioInput(data.bio || "");
      }
    });
  }, [user]);

  useEffect(() => {
    const qMarket = query(collection(db, "market"), orderBy("votes", "desc"), orderBy("createdAt", "desc"));
    return onSnapshot(qMarket, (s) => setMarketIdeas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "myContacts"), orderBy("lastInteraction", "desc"));
    return onSnapshot(q, (s) => {
      const updatedUsers = s.docs.map(d => d.data());
      updatedUsers.forEach(u => {
        if (u.hasNewMessage && selectedUser?.uid !== u.uid && document.hidden) {
           new Notification("VORTEX", { body: `New signal from ${u.displayName}`, icon: LOGO_URL });
        }
      });
      setUsers(updatedUsers);
    });
  }, [user, selectedUser]);

  useEffect(() => {
    if (!user || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    updateDoc(doc(db, "users", user.uid, "myContacts", selectedUser.uid), { hasNewMessage: false });
    const qMsg = query(collection(db, "messages"), where("chatId", "==", chatId), orderBy("createdAt", "asc"));
    
    return onSnapshot(qMsg, (s) => {
      const msgs = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      scroll.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [user, selectedUser]);

  const addContactByNumber = async () => {
    const number = prompt("Enter VORTEX ID:");
    if (!number) return;
    const q = query(collection(db, "users"), where("phoneNumber", "==", number.trim()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const contact = snap.docs[0].data();
      if(contact.uid === user.uid) return alert("Error: Self-linkage blocked.");
      await setDoc(doc(db, "users", user.uid, "myContacts", contact.uid), { ...contact, lastInteraction: serverTimestamp(), hasNewMessage: false });
      alert("Signal Secured.");
    } else { alert("ID not found."); }
  };

  const handleSend = async (val, type = "text") => {
    const content = val || newMessage;
    if (!content.trim() || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    
    await addDoc(collection(db, "messages"), { 
      text: type === "text" ? encrypt(content) : content, 
      type, senderId: user.uid, chatId, createdAt: serverTimestamp(), 
      encrypted: type === "text",
      replyTo: replyingTo ? { text: replyingTo.text, senderId: replyingTo.senderId } : null,
      reactions: [],
      isBurner: burnerMode
    });

    await updateDoc(doc(db, "users", selectedUser.uid, "myContacts", user.uid), { lastInteraction: serverTimestamp(), hasNewMessage: true });
    await updateDoc(doc(db, "users", user.uid, "myContacts", selectedUser.uid), { lastInteraction: serverTimestamp() });
    setNewMessage(""); setReplyingTo(null); setKeyboardView("none"); setBurnerMode(false);
  };

  const handleVote = async (id, currentVotes) => {
    await updateDoc(doc(db, "market", id), { votes: (currentVotes || 0) + 1 });
  };

  const handleReaction = async (msgId, emoji) => {
    await updateDoc(doc(db, "messages", msgId), { reactions: arrayUnion({ emoji, userId: user.uid }) });
    setReactionId(null);
  };

  if (!user) return <div className="h-screen bg-[#060a16] flex flex-col items-center justify-center p-10"><img src={LOGO_URL} className="w-24 h-24 rounded-3xl mb-8" /><button onClick={() => signInWithPopup(auth, googleProvider)} className="bg-white text-black px-12 py-5 rounded-full font-black uppercase">Connect Hub</button></div>;

  return (
    <div className="fixed inset-0 bg-[#060a16] text-white flex flex-col overflow-hidden font-sans">
      <style>{`
        .glass { background: rgba(13, 18, 37, 0.7); backdrop-filter: blur(20px); }
        .reply-card { border-left: 4px solid ${themeColor}; background: rgba(255,255,255,0.05); }
        .notification-glow { border: 1px solid ${themeColor} !important; box-shadow: 0 0 15px ${themeColor}4d; }
        @keyframes pop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-pop { animation: pop 0.2s ease-out forwards; }
        .burner-glow { box-shadow: 0 0 10px #ef4444; border: 1px solid #ef4444 !important; }
      `}</style>

      {!selectedUser && activeTab === "chats" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 pt-12 flex justify-between items-center glass border-b border-white/5">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">VORTEX</h2>
            <button onClick={addContactByNumber} style={{backgroundColor: `${themeColor}1a`, color: themeColor}} className="p-3 rounded-2xl active:scale-90"><Plus size={24} /></button>
          </header>
          <div className="p-6"><div className="bg-[#11172b] rounded-2xl p-4 flex items-center gap-3 border border-white/5"><Search size={18} style={{color: themeColor}} /><input value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Search signals..." className="bg-transparent outline-none text-xs w-full" /></div></div>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-32">
            {users.filter(u => u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
              <div key={u.uid} onClick={() => setSelectedUser(u)} className={`flex items-center gap-4 p-4 rounded-[28px] bg-[#0d1225] border border-white/5 transition-all ${u.hasNewMessage ? 'notification-glow' : ''}`}>
                <div className="relative">
                  <img src={u.photoURL} className="w-14 h-14 rounded-2xl object-cover" />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0d1225] ${u.status === 'online' ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold uppercase text-[14px]">{u.displayName}</h3>
                  <p className="text-[7px] opacity-50 uppercase truncate max-w-[150px]">{u.bio || "No status set"}</p>
                </div>
                {u.hasNewMessage && <div style={{backgroundColor: themeColor}} className="w-3 h-3 rounded-full animate-pulse"></div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedUser && activeTab === "market" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 pt-12 glass border-b border-white/5"><h2 className="text-3xl font-black italic tracking-tighter uppercase">Market Hub</h2></header>
          <div className="p-6"><div className="bg-[#11172b] rounded-2xl p-3 flex gap-2 border border-white/10"><input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} placeholder="Share idea..." className="bg-transparent flex-1 outline-none text-xs px-2" /><button onClick={async () => { if (!newIdea.trim()) return; await addDoc(collection(db, "market"), { text: newIdea, authorId: user.uid, createdAt: serverTimestamp(), votes: 0 }); setNewIdea(""); }} style={{backgroundColor: themeColor}} className="p-2 rounded-xl h-[40px] w-[40px] flex items-center justify-center shrink-0"><Send size={16} /></button></div></div>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-32">{marketIdeas.map(idea => (
            <div key={idea.id} className="p-6 bg-[#11172b] rounded-[35px] border border-white/5 flex justify-between items-center">
              <p className="text-sm flex-1">{idea.text}</p>
              <button onClick={() => handleVote(idea.id, idea.votes)} className="flex flex-col items-center gap-1 ml-4 bg-white/5 p-3 rounded-2xl">
                <Flame size={16} className={idea.votes > 0 ? "text-orange-500" : "text-white/20"} />
                <span className="text-[10px] font-black">{idea.votes || 0}</span>
              </button>
            </div>
          ))}</div>
        </div>
      )}

      {!selectedUser && activeTab === "settings" && (
        <div className="flex-1 flex flex-col p-8 pt-12 overflow-y-auto pb-32">
           <header className="flex flex-col items-center mb-8"><img src={user?.photoURL} style={{borderColor: `${themeColor}33`}} className="w-24 h-24 rounded-[35px] border-4 mb-4" /><h2 className="text-2xl font-black italic uppercase">{user?.displayName}</h2></header>
           <div className="space-y-4">
             <div className="bg-[#11172b] p-6 rounded-[35px] border border-white/10 shadow-2xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><User size={12}/> Profile Signal</p>
                <input value={bioInput} onChange={(e) => setBioInput(e.target.value)} placeholder="Enter bio status..." className="bg-[#060a16] p-4 rounded-2xl w-full outline-none text-xs font-bold mb-3" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Shield size={12}/> VORTEX ID</p>
                <div className="flex gap-2 items-center"><input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} className="bg-[#060a16] p-4 rounded-2xl flex-1 outline-none text-xs font-bold h-[48px]" /><button onClick={async () => { await updateDoc(doc(db, "users", user.uid), { phoneNumber: phoneInput, bio: bioInput }); alert("System Updated."); }} style={{backgroundColor: themeColor}} className="px-6 h-[48px] rounded-2xl font-black text-[10px] uppercase shrink-0">Sync</button></div>
             </div>
             <div className="bg-[#11172b] p-6 rounded-[35px] border border-white/10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Palette size={12}/> UI Frequency</p>
                <div className="flex justify-between">
                  {Object.entries(THEMES).map(([name, hex]) => (
                    <button key={name} onClick={async () => await updateDoc(doc(db, "users", user.uid), { theme: hex })} style={{backgroundColor: hex}} className={`w-10 h-10 rounded-full border-4 ${themeColor === hex ? 'border-white' : 'border-transparent'}`}></button>
                  ))}
                </div>
             </div>
           </div>
           <button onClick={() => signOut(auth)} className="p-6 w-full rounded-[30px] border border-red-500/20 bg-[#11172b] text-red-500 font-black text-xs uppercase tracking-widest mt-10">Logout System</button>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-[#060a16] flex flex-col">
          <header className="p-4 pt-10 glass border-b border-white/5 flex items-center gap-4"><button onClick={() => setSelectedUser(null)} style={{color: themeColor}} className="font-bold p-2">←</button><img src={selectedUser.photoURL} className="w-10 h-10 rounded-xl" /><div><h4 className="text-[12px] font-black uppercase">{selectedUser.displayName}</h4><p style={{color: themeColor}} className="text-[7px] font-black tracking-widest uppercase">ENCRYPTED SIGNAL</p></div></header>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((m) => {
              const isMe = m.senderId === user.uid;
              return (
                <div key={m.id} onTouchStart={(e) => touchStart.current = e.targetTouches[0].clientX} onTouchEnd={(e) => { if (e.changedTouches[0].clientX - touchStart.current > 70) setReplyingTo(m); }} onContextMenu={(e) => { e.preventDefault(); setReactionId(m.id); }} className={`flex flex-col relative ${isMe ? 'items-end' : 'items-start'}`}>
                  {reactionId === m.id && <div className="absolute -top-10 z-50 flex gap-2 bg-[#1a2238] p-2 rounded-full border border-white/20 animate-pop">{["🔥", "❤️", "😂", "👍", "🙏"].map(e => <button key={e} onClick={() => handleReaction(m.id, e)} className="text-xl hover:scale-125 transition-transform">{e}</button>)}</div>}
                  <div className={`max-w-[80%] px-4 py-3 rounded-[24px] shadow-xl ${m.isBurner ? 'burner-glow' : ''} ${isMe ? `bg-opacity-90 rounded-tr-none` : 'bg-[#11172b] rounded-tl-none'}`} style={{backgroundColor: isMe ? themeColor : '#11172b'}}>
                    {m.replyTo && <div className="mb-2 p-2 rounded-lg reply-card text-[10px] opacity-70"><p className="font-bold" style={{color: themeColor}}>{m.replyTo.senderId === user.uid ? 'You' : selectedUser.displayName}</p><p className="truncate">{decrypt(m.replyTo.text)}</p></div>}
                    {m.isBurner && <p className="text-[8px] font-black text-red-400 mb-1 flex items-center gap-1"><Zap size={8}/> BURNER SIGNAL</p>}
                    {m.type === "gif" ? <img src={m.text} className="w-44 rounded-xl" /> : <p className="text-sm">{decrypt(m.text)}</p>}
                  </div>
                  {m.reactions?.length > 0 && <div className="flex -mt-2 bg-[#1a2238] px-2 py-0.5 rounded-full border border-white/10 text-[10px]">{m.reactions.map((r, i) => <span key={i}>{r.emoji}</span>)}</div>}
                </div>
              );
            })}
            <div ref={scroll}></div>
          </div>
          <div className="p-4 glass rounded-t-[40px]">
            {replyingTo && <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl mb-2 animate-pop border-l-4" style={{borderColor: themeColor}}><div className="text-[10px] truncate"><p className="font-bold">Replying to Signal</p><p className="opacity-60">{decrypt(replyingTo.text)}</p></div><button onClick={() => setReplyingTo(null)} className="p-1"><X size={16}/></button></div>}
            <div className="flex items-center gap-3">
              <button onClick={() => setBurnerMode(!burnerMode)} className={`p-3 rounded-2xl transition-all h-[52px] w-[52px] flex items-center justify-center shrink-0 ${burnerMode ? 'bg-red-500 text-white' : 'bg-[#11172b] text-slate-400'}`}><Zap size={20}/></button>
              <button onClick={() => setKeyboardView(keyboardView === 'emoji' ? 'none' : 'emoji')} className="p-3 bg-[#11172b] rounded-2xl text-slate-400 h-[52px] w-[52px] flex items-center justify-center shrink-0"><Smile size={20}/></button>
              <div className="flex-1 bg-[#11172b] p-3 rounded-2xl border border-white/5 flex items-center h-[52px]"><input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={burnerMode ? "Burner Signal..." : "Type signal..."} className="flex-1 bg-transparent outline-none text-sm" /><button onClick={() => setKeyboardView(keyboardView === 'gif' ? 'none' : 'gif')} className="p-1 text-slate-500"><Gift size={18}/></button></div>
              <button onClick={() => handleSend()} style={{backgroundColor: themeColor}} className="rounded-2xl active:scale-90 shadow-lg shadow-black/20 h-[52px] w-[52px] flex items-center justify-center shrink-0"><Send size={20} className="size={20} />
          </button>
        </div>

        {keyboardView !== 'none' && (
          <div className="h-64 mt-4 overflow-y-auto grid grid-cols-8 gap-2 p-4 bg-[#0d1225] rounded-3xl border border-white/5">
            {keyboardView === 'emoji' && (
              /* Add your emoji mapping here */
              <p className="text-slate-400 text-center col-span-8">Emoji Keyboard</p>
            )}
            {keyboardView === 'gif' && (
              /* Add your gif integration here */
              <p className="text-slate-400 text-center col-span-8">GIF Keyboard</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
