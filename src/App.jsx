import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, addDoc, query, orderBy, onSnapshot, where, 
  serverTimestamp, setDoc, doc, updateDoc, limit, getDocs 
} from 'firebase/firestore';
import { 
  Send, MessageSquare, Search, Shield, Zap, Radio, Lock, Smile, Check, CheckCheck, 
  Image as ImageIcon, Phone, Globe, TrendingUp, DollarSign, EyeOff, X, Gift, Plus
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

  // --- 💸 LOGIC: PAYSTACK ---
  const handleAddFunds = () => {
    const amount = prompt("Enter amount (₦):");
    if (!amount || isNaN(amount) || amount <= 0) return;
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: amount * 100,
      currency: "NGN",
      callback: async () => {
        await updateDoc(doc(db, "users", user.uid), { walletBalance: (userData?.walletBalance || 0) + Number(amount) });
        alert("Funds Added!");
      }
    });
    handler.openIframe();
  };

  // --- 👤 CONTACT LOGIC ---
  const addContactByNumber = async () => {
    const number = prompt("Enter VORTEX Phone Number to add:");
    if (!number) return;
    const q = query(collection(db, "users"), where("phoneNumber", "==", number.trim()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const contact = snap.docs[0].data();
      if(contact.uid === user.uid) return alert("You cannot add yourself!");
      await setDoc(doc(db, "users", user.uid, "myContacts", contact.uid), contact);
      alert("Contact Linked Successfully!");
    } else {
      alert("User not found on VORTEX.");
    }
  };

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
    return onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        if (data?.phoneNumber && !phoneInput) setPhoneInput(data.phoneNumber);
      }
      setIsLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setDoc(doc(db, "users", user.uid), { 
      status: stealthMode ? "offline" : "online", 
      typing: isTyping, lastSeen: serverTimestamp(),
      displayName: user?.displayName || "Anonymous",
      photoURL: user?.photoURL || "", uid: user.uid
    }, { merge: true });
  }, [user, stealthMode, isTyping]);

  // SYNC ONLY PRIVATE CONTACTS
  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "users", user.uid, "myContacts"), (s) => 
      setUsers(s.docs.map(d => d.data()))
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
    const content = val || newMessage;
    if (!content.trim() || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    await addDoc(collection(db, "messages"), { 
      text: type === "text" ? encrypt(content) : content, 
      type, senderId: user.uid, receiverId: selectedUser.uid, chatId, 
      createdAt: serverTimestamp(), encrypted: type === "text"
    });
    setNewMessage(""); setKeyboardView("none");
  };

  if (isLoading) return <div className="h-screen bg-[#060a16] flex flex-col items-center justify-center text-white"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!user) return (
    <div className="h-screen bg-[#060a16] flex flex-col items-center justify-center p-10 text-white text-center">
      <img src={LOGO_URL} className="w-32 h-32 rounded-[40px] mb-8" alt="Logo" />
      <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-2">VORTEX</h1>
      <button onClick={() => signInWithPopup(auth, googleProvider)} className="w-full mt-12 bg-white text-black py-5 rounded-[25px] font-black uppercase tracking-widest">Connect Hub</button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#060a16] text-white flex flex-col overflow-hidden font-sans">
      {!selectedUser && activeTab === "chats" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 flex justify-between items-center bg-[#0d1225]">
            <div><h2 className="text-4xl font-black italic tracking-tighter uppercase">VORTEX</h2><p className="text-[8px] font-black text-green-500 tracking-widest mt-1 uppercase">Contacts Active</p></div>
            <button onClick={addContactByNumber} className="bg-green-500 p-3 rounded-2xl shadow-lg shadow-green-500/20 active:scale-90"><Plus size={24} className="text-[#060a16]" /></button>
          </header>
          <div className="p-6">
            <div className="bg-[#11172b] rounded-3xl p-4 flex items-center gap-3 border border-white/5">
              <Search className="text-green-500" size={18} />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search saved contacts..." className="bg-transparent outline-none text-xs w-full" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-24">
            {users.length === 0 && <p className="text-center text-slate-500 text-[10px] uppercase font-black tracking-widest mt-10">No Contacts Found. Click + to Add.</p>}
            {users.filter(u => u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
              <div key={u.uid} onClick={() => setSelectedUser(u)} className="flex items-center gap-4 p-4 bg-[#11172b]/80 rounded-[28px] border border-white/5 active:scale-95">
                <div className="relative"><img src={u.photoURL} className="w-14 h-14 rounded-2xl object-cover" />{u.status === 'online' && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-[#11172b]"></div>}</div>
                <div className="flex-1"><p className="font-black text-[15px]">{u.displayName}</p><p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{u.phoneNumber}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedUser && activeTab === "market" && (
         <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 bg-[#0d1225]"><h2 className="text-3xl font-black italic tracking-tighter uppercase">Market Hub</h2></header>
          <div className="px-6 py-4 bg-[#0d1225] border-b border-white/5"><div className="bg-[#11172b] rounded-2xl p-3 flex gap-2 border border-green-500/30"><input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} placeholder="Share a money idea..." className="bg-transparent flex-1 outline-none text-xs px-2" /><button onClick={async () => { if (!newIdea.trim()) return; await addDoc(collection(db, "market"), { text: newIdea, authorId: user.uid, createdAt: serverTimestamp() }); setNewIdea(""); }} className="bg-green-600 p-2 rounded-xl"><Send size={16} /></button></div></div>
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-24 pt-4">{marketIdeas.map(idea => <div key={idea.id} className="p-6 bg-[#11172b] rounded-[35px] border border-white/5 shadow-xl"><p className="text-sm font-medium">{idea.text}</p></div>)}</div>
        </div>
      )}

      {!selectedUser && activeTab === "settings" && (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto pb-32">
           <header className="flex flex-col items-center mb-8"><img src={user?.photoURL} className="w-24 h-24 rounded-[35px] border-4 border-green-500/20 mb-4 shadow-2xl" /><h2 className="text-2xl font-black italic tracking-tighter uppercase">{user?.displayName}</h2></header>
           <div className="bg-gradient-to-br from-[#1a2238] to-[#0d1225] p-6 rounded-[35px] border border-white/10 shadow-2xl mb-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Set Your Signal ID (Phone Number)</p>
                <div className="flex gap-2"><input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="e.g. 091613..." className="bg-[#060a16] p-4 rounded-2xl flex-1 outline-none text-xs font-bold" /><button onClick={async () => { await updateDoc(doc(db, "users", user.uid), { phoneNumber: phoneInput }); alert("VORTEX ID Active!"); }} className="bg-green-600 px-6 rounded-2xl font-black text-[10px] uppercase">Link</button></div>
           </div>
           <div className="bg-gradient-to-br from-[#1a2238] to-[#0d1225] p-6 rounded-[35px] border border-white/10 shadow-2xl mb-8"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Wallet Balance</p><h3 className="text-3xl font-black text-white mt-1">₦{(userData?.walletBalance || 0).toLocaleString()}</h3><button onClick={handleAddFunds} className="w-full mt-4 bg-green-600 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest">Add Funds +</button></div>
           <button onClick={() => signOut(auth)} className="p-6 w-full rounded-[30px] border border-red-500/20 bg-[#11172b] text-red-500 font-black text-xs uppercase tracking-widest">Logout</button>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-[#060a16] flex flex-col">
          <header className="p-4 flex items-center gap-4 border-b border-white/5 bg-[#0d1225]">
            <button onClick={() => setSelectedUser(null)} className="p-2 text-green-500 font-black text-xl">←</button>
            <img src={selectedUser.photoURL} className="w-10 h-10 rounded-xl" />
            <div><h4 className="font-black text-[13px] uppercase truncate">{selectedUser.displayName}</h4><p className="text-[7px] text-green-500 font-black uppercase tracking-widest">{selectedUser.status === 'online' ? 'Signal Live' : 'Encrypted'}</p></div>
          </header>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">{messages.map((m) => (<div key={m.id} className={`flex flex-col ${m.senderId === user.uid ? 'items-end' : 'items-start'}`}><div className={`max-w-[80%] px-4 py-3 rounded-[24px] ${m.senderId === user.uid ? 'bg-green-600' : 'bg-[#11172b]'}`}>{m.type === "gif" ? <img src={m.text} className="w-40 rounded-xl" /> : <p className="text-[14px]">{m.encrypted ? decrypt(m.text) : m.text}</p>}</div></div>))}<div ref={scroll}></div></div>
          <div className="p-5 bg-[#0d1225] rounded-t-[40px] shadow-2xl">
            <div className="bg-[#11172b] p-2 flex gap-2 items-center rounded-full border border-white/5 mb-3"><button onClick={() => setKeyboardView(keyboardView === 'emoji' ? 'none' : 'emoji')} className="p-2 text-slate-500"><Smile size={22} /></button><button onClick={() => setKeyboardView(keyboardView === 'gif' ? 'none' : 'gif')} className="p-2 text-slate-500"><Gift size={22} /></button><input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Send signal..." className="flex-1 bg-transparent py-3 px-2 outline-none text-sm" /><button onClick={() => handleSend(newMessage)} className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center"><Send size={20} /></button></div>
            {keyboardView === 'emoji' && <div className="h-48 overflow-y-auto grid grid-cols-8 gap-2 p-4">{EMOJI_LIST.map((e,i)=><button key={i} onClick={()=>setNewMessage(p=>p+e)} className="text-2xl">{e}</button>)}</div>}
            {keyboardView === 'gif' && <div className="h-48 overflow-y-auto flex gap-4 p-4">{GIF_LIST.map((g,i)=><img key={i} src={g} onClick={()=>handleSend(g, 'gif')} className="h-40 rounded-xl" />)}</div>}
          </div>
        </div>
      )}

      {!selectedUser && (
        <nav className="p-4 px-8 bg-[#0d1225] flex justify-between border-t border-white/5 pb-10">
          <button onClick={() => setActiveTab("chats")} className={`flex flex-col items-center gap-1.5 ${activeTab === 'chats' ? 'text-green-500' : 'text-slate-600'}`}><MessageSquare size={22} /><span className="text-[8px] font-black uppercase tracking-widest">Signals</span></button>
          <button onClick={() => setActiveTab("market")} className={`flex flex-col items-center gap-1.5 ${activeTab === 'market' ? 'text-green-500' : 'text-slate-600'}`}><Globe size={22} /><span className="text-[8px] font-black uppercase tracking-widest">Market</span></button>
          <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center gap-1.5 ${activeTab === 'settings' ? 'text-green-500' : 'text-slate-600'}`}><Shield size={22} /><span className="text-[8px] font-black uppercase tracking-widest">System</span></button>
        </nav>
      )}
    </div>
  );
}
