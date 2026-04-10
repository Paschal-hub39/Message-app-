import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, addDoc, query, orderBy, onSnapshot, where, 
  serverTimestamp, setDoc, doc, updateDoc, limit 
} from 'firebase/firestore';
import { 
  Send, MessageSquare, Search, Shield, Zap, Radio, Lock, Smile, Check, CheckCheck, 
  Image as ImageIcon, Phone, Globe, TrendingUp, DollarSign, EyeOff
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

const EMOJI_LIST = ["😂","😎","🥰","😭","🙏","😡","🤣","😌","🤷","😒","💙","😀","😃","😄","😁","😆","😅","😉","😘","😍","😏","😊","🙂","🙃","🥳","🤩","😋","😛","😜","🤪","😔","🥺","🤭","🤫","🤔","🤐","😶","😐","😑","😬","🥱","🤗","😱","🤨","🧐","🙄","😤","😥","😟","🤬","😠","🙁","😕","😰","😨","😧","😦","😮","😫","😣","😖","😳","😲","😯","😵","🥴","🥵","🤢","🥶","🤮","😴","🤑","🤠","😇","🤥","😷","🤕","🤒","🤧","🤓","🤡","💩","😈","👿","👻","💀","👾","👽","⛄","👺","👹","🤖","☠️","🌚","🌞","🌝","💫","⭐","🌟","✨","⚡","💥","💢","🤍","🖤","🤎","💜","💚","💛","🧡","❤️","💘","💝","💖","💗","💓","💞","💕","💌","🗣️","👤","👥","💋","💔","❣️","♥️","💟","👣","💦","🧠","🩸","🦠","🦷","🦴","👀","👍","👎","💪","👏","🙏","💅","🙇","🙋","💁","🙆","🙅","🤷","🤦","🙍","🧘","🤸","🚶","🏃","🧗","🚵","🚴","🤾","⛹️","🤹","🏌️","🏇","🤺","⛷️","🏂","🪂","🧝","🧞","🧚","🧜","🤽","🏊","🚣","🏄","🧙","🧛","🧟","🦸","🦹","🤶","💂","👸","🕵️","👮","👷","👰","🤵","👼","👶","🧒","🧑","🧓","🧔","👯‍♂️","👯","🕺","💃","🕴️","👫","👭","👬","💏","🤱","🤰","💑","🏵️","💮","🌸","🌷","🌺","🥀","🌹","💐","🌻","🌼","🍂","🍁","🍄","🌾","🌿","🌱","🔥","🌀","❄️","🌬️","🌊","🏖️","🏝️","🌄","🌅","🌪️","⚡","☔","💧","🌨️","☁️","🌧️","🌞","☀️","🌤️","⛅","🌥️","🌦️","⛈️","🌩️","🌝","🌚","🌜","🌛","🌙","🌌","🌠","🌫️","🌏","🌎","🌍","🪐"];

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
  const [activeTab, setActiveTab] = useState("chats");
  const [keyboardView, setKeyboardView] = useState("none"); 
  const [stealthMode, setStealthMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scroll = useRef();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserData(data);
        if (data?.phoneNumber && !phoneInput) setPhoneInput(data.phoneNumber);
      }
    });
    setDoc(userRef, { 
      status: stealthMode ? "offline" : "online", 
      typing: isTyping,
      lastSeen: serverTimestamp(),
      displayName: user.displayName,
      photoURL: user.photoURL,
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

  const initializePayment = (amount) => {
    if (!window.PaystackPop) {
      alert("Payment gateway loading... please try again in a second.");
      return;
    }
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: amount * 100,
      currency: 'NGN',
      callback: async () => {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { walletBalance: (userData?.walletBalance || 0) + amount });
        alert(`Vortex Wallet Updated: ₦${amount}`);
      },
    });
    handler.openIframe();
  };

  const postIdea = async () => {
    if (!newIdea.trim()) return;
    await addDoc(collection(db, "market"), {
      text: newIdea,
      authorName: user.displayName,
      authorPhoto: user.photoURL,
      uid: user.uid,
      createdAt: serverTimestamp()
    });
    setNewIdea("");
  };

  const handleSend = async (val) => {
    if (!val.trim() || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    await addDoc(collection(db, "messages"), { 
      text: encrypt(val), 
      type: "text", 
      encrypted: true,
      senderId: user.uid, receiverId: selectedUser.uid, chatId, 
      createdAt: serverTimestamp(), seen: false 
    });
    setNewMessage("");
  };

  if (!user) return (
    <div className="h-screen bg-[#060a16] flex flex-col items-center justify-center p-10 text-white">
      <img src={LOGO_URL} className="w-24 h-24 rounded-3xl mb-8" alt="Logo" />
      <button onClick={() => signInWithPopup(auth, googleProvider)} className="bg-white text-black px-12 py-4 rounded-2xl font-black">LOGIN TO VORTEX</button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#060a16] text-white flex flex-col overflow-hidden">
      
      {/* CHATS TAB */}
      {!selectedUser && activeTab === "chats" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 flex justify-between items-center bg-[#0d1225]">
             <h2 className="text-3xl font-black italic tracking-tighter">VORTEX</h2>
             <Radio size={24} className="text-green-500 animate-pulse" />
          </header>
          <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-24">
            {users.map(u => (
              <div key={u.uid} onClick={() => setSelectedUser(u)} className="flex items-center gap-4 p-4 bg-[#11172b] rounded-3xl border border-white/5">
                <img src={u.photoURL} className="w-12 h-12 rounded-xl" />
                <div>
                  <p className="font-bold text-sm">{u.displayName}</p>
                  <p className="text-[9px] text-slate-500">{u.phoneNumber || "VORTEX ID ACTIVE"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MARKET TAB */}
      {!selectedUser && activeTab === "market" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 bg-[#0d1225]">
            <h2 className="text-2xl font-black italic">MARKET HUB</h2>
          </header>
          <div className="px-6 mb-4">
             <div className="bg-[#11172b] p-4 rounded-3xl border border-white/5 flex gap-2">
                <input value={newIdea} onChange={(e)=>setNewIdea(e.target.value)} placeholder="Share idea..." className="bg-transparent flex-1 outline-none text-xs" />
                <button onClick={postIdea} className="bg-green-600 p-2 rounded-xl"><TrendingUp size={16} /></button>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-24">
            {marketIdeas.map(idea => (
              <div key={idea.id} className="p-5 bg-[#11172b] rounded-[30px] border border-white/5">
                <p className="text-xs leading-relaxed">{idea.text}</p>
                <div className="mt-4 flex justify-between items-center">
                   <span className="text-[8px] text-slate-500 uppercase">{idea.authorName}</span>
                   <button className="text-[9px] text-green-500 font-bold bg-green-500/10 px-3 py-1 rounded-full"><DollarSign size={10} className="inline mr-1" /> TIP</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SYSTEM TAB */}
      {!selectedUser && activeTab === "settings" && (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto pb-32">
           <div className="bg-gradient-to-br from-[#1a2238] to-[#0d1225] p-6 rounded-[35px] border border-white/10 mb-8">
              <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Wallet Balance</p>
              <h3 className="text-3xl font-black mt-1 text-white">₦{(userData?.walletBalance || 0).toLocaleString()}</h3>
              <button onClick={() => initializePayment(500)} className="w-full bg-green-600 py-4 rounded-2xl font-black mt-6 text-[11px] tracking-widest">ADD FUNDS +</button>
           </div>
           <button onClick={() => setStealthMode(!stealthMode)} className="p-6 w-full rounded-3xl bg-[#11172b] flex justify-between items-center mb-4">
              <div className="flex items-center gap-3"><Lock size={18} /><p className="font-bold text-xs uppercase">Stealth Mode</p></div>
              <div className={`w-10 h-5 rounded-full transition-colors ${stealthMode ? 'bg-green-500' : 'bg-slate-700'}`}></div>
           </button>
           <button onClick={() => signOut(auth)} className="w-full p-5 rounded-3xl bg-red-500/10 text-red-500 font-bold text-xs">LOGOUT</button>
        </div>
      )}

      {/* CHAT VIEW */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-[#060a16] flex flex-col">
          <header className="p-4 flex items-center gap-4 bg-[#0d1225]">
            <button onClick={() => setSelectedUser(null)} className="text-green-500 text-2xl">←</button>
            <img src={selectedUser.photoURL} className="w-10 h-10 rounded-xl" />
            <h4 className="font-black text-xs uppercase">{selectedUser.displayName}</h4>
          </header>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.senderId === user.uid ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${m.senderId === user.uid ? 'bg-green-600' : 'bg-[#11172b]'} ${stealthMode && m.senderId !== user.uid ? 'blur-md hover:blur-none' : ''}`}>
                  <p className="text-sm">{m.encrypted ? decrypt(m.text) : m.text}</p>
                </div>
              </div>
            ))}
            <div ref={scroll}></div>
          </div>
          <div className="p-5 bg-[#0d1225]">
            <div className="bg-[#11172b] p-2 flex gap-2 items-center rounded-full border border-white/5">
              <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Send signal..." className="flex-1 bg-transparent px-4 outline-none text-sm" />
              <button onClick={() => handleSend(newMessage)} className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center"><Send size={18} /></button>
            </div>
          </div>
        </div>
      )}

      {/* NAV BAR */}
      {!selectedUser && (
        <nav className="p-4 bg-[#0d1225] flex justify-around border-t border-white/5 pb-10">
          <button onClick={() => setActiveTab("chats")} className={activeTab === 'chats' ? 'text-green-500' : 'text-slate-600'}><MessageSquare size={20} /></button>
          <button onClick={() => setActiveTab("market")} className={activeTab === 'market' ? 'text-green-500' : 'text-slate-600'}><Globe size={20} /></button>
          <button onClick={() => setActiveTab("settings")} className={activeTab === 'settings' ? 'text-green-500' : 'text-slate-600'}><Shield size={20} /></button>
        </nav>
      )}
    </div>
  );
}
