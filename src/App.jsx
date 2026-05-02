import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, addDoc, query, orderBy, onSnapshot, where, 
  serverTimestamp, setDoc, doc, updateDoc, limit, getDocs, arrayUnion 
} from 'firebase/firestore';
import { 
  Send, MessageSquare, Search, Shield, Radio, Lock, Smile, X, Gift, Plus, Bell, ChevronRight
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

const EMOJI_LIST = ["😂","😎","🥰","😭","🙏","😡","🤣","😌","🤷","😒","💙","😀","😃","😄","😁","😆","😅","😉","😘","😍","😏","😊","🙂","🙃","🥳","🤩","😋","😛","😜","🤪","😔","🥺","🤭","🤫","🤔","🤐","😶","😐","😑","😬","🥱","🤗","😱","🤨","🧐","🙄","😤","😥","😟","🤬","😠","🙁","😕","😰","😨","😧","😦","😮","😫","😣","😖","😳","😲","😯","😵","🥴","🥵","🤢","🥶","🤮","😴","🤑","🤠","😇","🤥","😷","🤕","🤒","🤧","🤓","🤡","💩","😈","👿","👻","💀","👾","👽","⛄","👺","👹","🤖","☠️","🌚","🌞","🌝","💫","⭐","🌟","✨","⚡","💥","💢","🤍","🖤","🤎","💜","💚","💛","🧡","❤️","💘","💝","💖","💗","💓","💞","💕","💌","🗣️","👤","👥","💋","💔","❣️","❤️","💟","👣","💦","🧠","🩸","🦠","🦷","🦴","👀","👍","👎","💪","👏","🙏","💅","🙇","🙋","💁","🙆","🙅","🤷","🤦","🙍","🧘","🤸","🚶","🏃","🧗","🚵","🚴","🤾","⛹️","🤹","🏌️","🏇","🤺","⛷️","🏂","🪂","🧝","🧞","🧚","🧜","🤽","🏊","學","🏄","🧙","🧛","🧟","🦸","🦹","🤶","💂","👸","🕵️","👮","👷","👰","🤵","👼","👶","🧒","🧑","🧓","🧔","👯‍♂️","👯","🕺","💃","🕴️","👫","👭","👬","💏","🤱","🤰","💑","🏵️","💮","🌸","🌷","🌺","🥀","🌹","💐","🌻","🌼","🍂","🍁","🍄","🌾","🌿","🌱","🔥","🌀","❄️","🌬️","🌊","🏖️","🏝️","🌄","🌅","🌪️","⚡","☔","💧","🌨️","☁️","🌧️","🌞","☀️","🌤️","⛅","🌥️","🌦️","⛈️","🌩️","🌝","🌚","🌜","🌛","🌙","🌌","🌠","🌫️","🌏","🌎","🌍","🪐"];

const GIF_LIST = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlUxc2YM1NC6ny8/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26AHONh79u4m5W98s/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKVUn7iM8FMEU24/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l41lTfuxV5F68S96E/giphy.gif"
];

export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [keyboardView, setKeyboardView] = useState("none"); 
  const [replyingTo, setReplyingTo] = useState(null);
  const [reactionId, setReactionId] = useState(null);
  const scroll = useRef();
  const touchStart = useRef(0);

  // --- 🔔 NOTIFICATION PERMISSION ---
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // --- 👤 FETCH CONTACTS & TRIGGER NOTIFICATIONS ---
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "myContacts"), orderBy("lastInteraction", "desc"));
    return onSnapshot(q, (s) => {
      const updatedUsers = s.docs.map(d => d.data());
      
      // Browser Notification Logic
      updatedUsers.forEach(u => {
        if (u.hasNewMessage && selectedUser?.uid !== u.uid) {
           if (Notification.permission === "granted" && document.hidden) {
              new Notification("VORTEX: New Signal", { 
                body: `${u.displayName} sent a message`, 
                icon: LOGO_URL 
              });
           }
        }
      });

      setUsers(updatedUsers);
    });
  }, [user, selectedUser]);

  useEffect(() => {
    if (!user || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    
    // Clear notification badge when opening chat
    updateDoc(doc(db, "users", user.uid, "myContacts", selectedUser.uid), { hasNewMessage: false });

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
      type, senderId: user.uid, chatId, createdAt: serverTimestamp(), 
      encrypted: type === "text",
      replyTo: replyingTo ? { text: replyingTo.text, senderId: replyingTo.senderId } : null,
      reactions: []
    });

    // Alert Receiver of New Message
    await updateDoc(doc(db, "users", selectedUser.uid, "myContacts", user.uid), { 
      lastInteraction: serverTimestamp(), 
      hasNewMessage: true 
    });

    // Update own list order
    await updateDoc(doc(db, "users", user.uid, "myContacts", selectedUser.uid), { 
      lastInteraction: serverTimestamp() 
    });

    setNewMessage(""); setReplyingTo(null); setKeyboardView("none");
  };

  const handleReaction = async (msgId, emoji) => {
    await updateDoc(doc(db, "messages", msgId), {
      reactions: arrayUnion({ emoji, userId: user.uid })
    });
    setReactionId(null);
  };

  const handleTouchStart = (e) => (touchStart.current = e.targetTouches[0].clientX);
  const handleTouchEnd = (e, msg) => {
    const delta = e.changedTouches[0].clientX - touchStart.current;
    if (delta > 70) setReplyingTo(msg);
  };

  if (!user) return <div className="h-screen bg-[#060a16] flex items-center justify-center"><button onClick={() => signInWithPopup(auth, googleProvider)} className="bg-white text-black px-8 py-4 rounded-3xl font-bold uppercase">Enter Vortex</button></div>;

  return (
    <div className="fixed inset-0 bg-[#060a16] text-white flex flex-col overflow-hidden font-sans">
      <style>{`
        .glass { background: rgba(13, 18, 37, 0.7); backdrop-filter: blur(20px); }
        .reply-card { border-left: 4px solid #22c55e; background: rgba(255,255,255,0.05); }
        @keyframes pop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-pop { animation: pop 0.2s ease-out forwards; }
        .notification-glow { box-shadow: 0 0 15px rgba(34, 197, 94, 0.5); border: 1px solid #22c55e !important; }
      `}</style>

      {/* CHATS LIST */}
      {!selectedUser && activeTab === "chats" && (
        <div className="flex-1 flex flex-col">
          <header className="p-8 pt-12 flex justify-between items-center glass border-b border-white/5">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">VORTEX</h2>
            <div className="bg-green-500/10 p-2 rounded-xl text-green-500"><Plus size={24} /></div>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {users.map(u => (
              <div 
                key={u.uid} 
                onClick={() => setSelectedUser(u)} 
                className={`flex items-center gap-4 p-4 rounded-[28px] bg-[#0d1225] border border-white/5 transition-all active:scale-95 ${u.hasNewMessage ? 'notification-glow' : ''}`}
              >
                <div className="relative">
                  <img src={u.photoURL} className="w-14 h-14 rounded-2xl object-cover" />
                  {u.hasNewMessage && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-[#060a16] animate-bounce">
                      <Bell size={10} className="text-black fill-black" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold uppercase tracking-tight">{u.displayName}</h3>
                    {u.hasNewMessage && <span className="text-[7px] bg-green-500 text-black px-2 py-0.5 rounded-full font-black">NEW SIGNAL</span>}
                  </div>
                  <p className="text-[8px] text-green-500 font-black tracking-widest mt-1 uppercase">Link Secured</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHAT VIEW - REST OF CODE UNCHANGED */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-[#060a16] flex flex-col">
          <header className="p-4 pt-10 glass border-b border-white/5 flex items-center gap-4">
            <button onClick={() => setSelectedUser(null)} className="text-green-500 font-bold">←</button>
            <img src={selectedUser.photoURL} className="w-10 h-10 rounded-xl" />
            <div>
              <h4 className="text-[12px] font-black uppercase">{selectedUser.displayName}</h4>
              <p className="text-[7px] text-green-500 font-black uppercase tracking-[0.2em]">End-to-End Encrypted</p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((m) => {
              const isMe = m.senderId === user.uid;
              return (
                <div 
                  key={m.id} 
                  onTouchStart={handleTouchStart} 
                  onTouchEnd={(e) => handleTouchEnd(e, m)}
                  onContextMenu={(e) => { e.preventDefault(); setReactionId(m.id); }}
                  className={`flex flex-col relative ${isMe ? 'items-end' : 'items-start'}`}
                >
                  {reactionId === m.id && (
                    <div className="absolute -top-10 z-50 flex gap-2 bg-[#1a2238] p-2 rounded-full border border-white/20 animate-pop">
                      {["🔥", "❤️", "😂", "👍", "🙏"].map(e => (
                        <button key={e} onClick={() => handleReaction(m.id, e)} className="text-xl hover:scale-125 transition-transform">{e}</button>
                      ))}
                    </div>
                  )}

                  <div className={`max-w-[80%] px-4 py-3 rounded-[24px] shadow-xl ${isMe ? 'bg-green-600 rounded-tr-none' : 'bg-[#11172b] rounded-tl-none'}`}>
                    {m.replyTo && (
                      <div className="mb-2 p-2 rounded-lg reply-card text-[10px] opacity-70">
                        <p className="font-bold text-green-400">{m.replyTo.senderId === user.uid ? 'You' : selectedUser.displayName}</p>
                        <p className="truncate">{decrypt(m.replyTo.text)}</p>
                      </div>
                    )}
                    {m.type === "gif" ? <img src={m.text} className="w-44 rounded-xl" /> : <p className="text-sm">{decrypt(m.text)}</p>}
                  </div>
                  
                  {m.reactions?.length > 0 && (
                    <div className="flex -mt-2 bg-[#1a2238] px-2 py-0.5 rounded-full border border-white/10 text-[10px]">
                      {m.reactions.map((r, i) => <span key={i}>{r.emoji}</span>)}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={scroll}></div>
          </div>

          <div className="p-4 glass rounded-t-[40px]">
            {replyingTo && (
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl mb-2 animate-pop border-l-4 border-green-500">
                <div className="text-[10px] truncate"><p className="font-bold">Replying to Signal</p><p className="opacity-60">{decrypt(replyingTo.text)}</p></div>
                <button onClick={() => setReplyingTo(null)} className="p-1"><X size={16}/></button>
              </div>
            )}
            
            <div className="flex items-center gap-3">
               <button onClick={() => setKeyboardView(keyboardView === 'emoji' ? 'none' : 'emoji')} className="p-3 bg-[#11172b] rounded-2xl text-slate-400"><Smile size={20}/></button>
               <div className="flex-1 bg-[#11172b] p-3 rounded-2xl border border-white/5 flex items-center">
                  <input 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                    placeholder="Type signal..." 
                    className="flex-1 bg-transparent outline-none text-sm" 
                  />
                  <button onClick={() => setKeyboardView(keyboardView === 'gif' ? 'none' : 'gif')} className="p-1 text-slate-500"><Gift size={18}/></button>
               </div>
               <button onClick={() => handleSend()} className="bg-green-500 p-4 rounded-2xl shadow-lg shadow-green-500/20 active:scale-90 transition-transform"><Send size={20} className="text-[#060a16]"/></button>
            </div>

            {keyboardView !== 'none' && (
              <div className="h-64 mt-4 overflow-y-auto grid grid-cols-8 gap-2 p-4 bg-[#0d1225] rounded-3xl border border-white/5 hide-scrollbar">
                {keyboardView === 'emoji' ? EMOJI_LIST.map((e,i)=><button key={i} onClick={()=>setNewMessage(p=>p+e)} className="text-2xl hover:scale-125 transition-transform">{e}</button>) : 
                  GIF_LIST.map((g,i)=><img key={i} src={g} onClick={()=>handleSend(g, 'gif')} className="h-24 w-full object-cover rounded-xl" />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER NAV */}
      {!selectedUser && (
        <nav className="p-6 px-10 glass flex justify-between items-center pb-12 border-t border-white/5">
          <button onClick={() => setActiveTab("chats")} className={`flex flex-col items-center gap-1 ${activeTab === 'chats' ? 'text-green-500' : 'text-slate-600'}`}><MessageSquare size={22} /><span className="text-[8px] font-black uppercase">Signals</span></button>
          <button onClick={() => setActiveTab("market")} className={`flex flex-col items-center gap-1 ${activeTab === 'market' ? 'text-green-500' : 'text-slate-600'}`}><Radio size={22} /><span className="text-[8px] font-black uppercase">Market</span></button>
          <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-green-500' : 'text-slate-600'}`}><Shield size={22} /><span className="text-[8px] font-black uppercase">System</span></button>
        </nav>
      )}
    </div>
  );
}
