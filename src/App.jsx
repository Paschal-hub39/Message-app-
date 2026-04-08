import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, where, serverTimestamp, setDoc, doc, updateDoc } from 'firebase/firestore';
import { Send, LogOut, MessageSquare, Search, User, Check, CheckCheck, X, Smile } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]); 
  const [selectedUser, setSelectedUser] = useState(null); 
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [peerTyping, setPeerTyping] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTo, setReplyTo] = useState(null); 
  const [newName, setNewName] = useState("");
  const [newPhoto, setNewPhoto] = useState("");
  
  const scroll = useRef();

  const emojiCategories = {
    "Popular": ["❤️", "😂", "🙌", "🔥", "💯", "👍", "⚽", "🎮", "💸", "🇳🇬"],
    "Flags": ["🇲🇹", "🇲🇵", "🇲🇹", "🇲🇵", "🇲🇱", "🇲🇫", "🇲🇱", "🇲🇬", "🇳🇦", "🇲🇶", "🇳🇵", "🇲🇾", "🇲🇦", "🇲🇾", "🇲🇲", "🇲🇶", "🇲🇲", "🇹🇷", "🇺🇸", "🇬🇧"],
    "Stickers": [
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpueXJ3bmZ4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKVUn7iM8FMEU24/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpueXJ3bmZ4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/l41lTfuxz2M4V28OA/giphy.gif"
    ]
  };

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u); setNewName(u.displayName); setNewPhoto(u.photoURL);
        await setDoc(doc(db, "users", u.uid), { uid: u.uid, displayName: u.displayName, photoURL: u.photoURL, status: "Online", lastSeen: serverTimestamp() }, { merge: true });
      } else { setUser(null); }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "users"), (s) => setUsers(s.docs.map(d => d.data()).filter(u => u.uid !== user.uid)));
  }, [user]);

  useEffect(() => {
    if (!user || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    const q = query(collection(db, "messages"), where("chatId", "==", chatId), orderBy("createdAt", "asc"));
    return onSnapshot(q, (s) => {
      setMessages(s.docs.map(d => ({ id: d.id, ...d.data() })));
      s.docs.forEach(d => d.data().receiverId === user.uid && !d.data().seen && updateDoc(doc(db, "messages", d.id), { seen: true }));
      scroll.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [user, selectedUser]);

  const sendMessage = async (val, type = "text") => {
    if (!val.trim() || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    await addDoc(collection(db, "messages"), { text: val, type, senderId: user.uid, receiverId: selectedUser.uid, chatId, createdAt: serverTimestamp(), seen: false });
    setNewMessage(""); setShowEmojiPicker(false);
  };

  if (!user) return (
    <div className="h-screen bg-[#0a0f1e] flex flex-col items-center justify-center text-white p-6">
      <div className="w-20 h-20 bg-green-600 rounded-3xl flex items-center justify-center shadow-2xl mb-6"><MessageSquare size={40} /></div>
      <h1 className="text-3xl font-black mb-8 tracking-tighter">Paschala Hub</h1>
      <button onClick={() => signInWithPopup(auth, googleProvider)} className="bg-white text-black w-full max-w-xs py-4 rounded-2xl font-bold active:scale-95 transition-all shadow-xl">Sign in with Google</button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#0a0f1e] text-white overflow-hidden flex flex-col">
      
      {/* SIDEBAR / HOME SCREEN */}
      <div className={`${selectedUser ? 'hidden' : 'flex'} flex-col h-full w-full z-20`}>
        <div className="p-6 flex justify-between items-center">
          <img src={user.photoURL} onClick={() => setShowProfileEdit(true)} className="w-12 h-12 rounded-2xl ring-2 ring-green-500/20 object-cover cursor-pointer" alt="" />
          <div className="flex gap-2">
            <button onClick={() => setShowProfileEdit(true)} className="p-2 text-slate-400 hover:text-white transition-all"><User size={24} /></button>
            <button onClick={() => signOut(auth)} className="p-2 text-slate-400 hover:text-red-500 transition-all"><LogOut size={24} /></button>
          </div>
        </div>
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-500" size={20} />
            <input type="text" placeholder="Search people..." className="w-full bg-[#161b2c] rounded-2xl py-4 pl-12 pr-4 outline-none border border-transparent focus:ring-1 ring-green-500/50" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {users.map(u => (
            <div key={u.uid} onClick={() => setSelectedUser(u)} className="flex items-center gap-4 p-4 cursor-pointer rounded-2xl hover:bg-white/5 transition-all active:scale-[0.98]">
              <div className="relative"><img src={u.photoURL} className="w-14 h-14 rounded-2xl object-cover shadow-lg" alt="" />{u.status === "Online" && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-[#0a0f1e]"></div>}</div>
              <div className="flex-1 min-w-0"><p className="font-bold text-lg truncate">{u.displayName}</p><p className="text-xs text-slate-500">{u.status === "Online" ? "Active now" : "Offline"}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT WINDOW */}
      {selectedUser && (
        <div className="fixed inset-0 flex flex-col z-30 bg-[#0a0f1e]">
          {/* ADAPTIVE WALLPAPER LAYER */}
          <div className="absolute inset-0 opacity-40 scale-110 blur-[90px] pointer-events-none" 
               style={{ backgroundImage: `url(${selectedUser.photoURL})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          </div>

          <div className="relative z-40 flex flex-col h-full w-full">
            {/* STICKY HEADER */}
            <div className="p-4 bg-[#0a0f1e]/80 backdrop-blur-xl flex items-center gap-3 border-b border-white/5 shadow-md">
              <button onClick={() => setSelectedUser(null)} className="text-2xl mr-2">←</button>
              <img src={selectedUser.photoURL} className="w-10 h-10 rounded-xl object-cover" alt="" />
              <div><p className="font-bold text-white">{selectedUser.displayName}</p><p className="text-[10px] text-green-500 font-black uppercase tracking-[0.2em]">{selectedUser.status}</p></div>
            </div>

            {/* MESSAGE LIST */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.senderId === user.uid ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] ${msg.type === 'sticker' ? '' : 'p-4 rounded-3xl shadow-lg'} relative ${msg.senderId === user.uid ? 'bg-green-600 rounded-tr-none' : 'bg-slate-800/90 backdrop-blur-md rounded-tl-none border border-white/5'}`}>
                    {msg.type === 'sticker' ? <img src={msg.text} className="w-32 h-32 rounded-2xl shadow-lg" alt="" /> : <p className="text-[15px] font-medium">{msg.text}</p>}
                    <div className="flex justify-end gap-1 mt-1 opacity-40 text-[9px] font-black uppercase tracking-tighter">
                      {msg.createdAt?.toDate && new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      {msg.senderId === user.uid && (msg.seen ? <CheckCheck size={12} className="text-blue-300" /> : <Check size={12} />)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scroll}></div>
            </div>

            {/* BOTTOM INPUT AREA */}
            <div className="p-4 pb-8 space-y-2 bg-gradient-to-t from-[#0a0f1e] via-[#0a0f1e]/80 to-transparent">
              {showEmojiPicker && (
                <div className="bg-[#161b2c]/95 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-2xl max-h-[250px] overflow-y-auto animate-in slide-in-from-bottom-2">
                  {Object.entries(emojiCategories).map(([cat, items]) => (
                    <div key={cat} className="mb-4 last:mb-0">
                      <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">{cat}</p>
                      <div className="grid grid-cols-6 gap-3">
                        {cat === "Stickers" ? items.map(s => <button key={s} onClick={() => sendMessage(s, "sticker")}><img src={s} className="w-10 h-10 rounded-lg" alt="" /></button>)
                          : items.map(e => <button key={e} onClick={() => sendMessage(e)} className="text-2xl active:scale-125 transition-transform">{e}</button>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(newMessage); }} className="bg-[#161b2c] p-2 flex gap-2 items-center rounded-3xl border border-white/5 shadow-2xl">
                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-3 rounded-2xl transition-all ${showEmojiPicker ? 'text-green-500 bg-green-500/10' : 'text-slate-400'}`}><Smile size={24} /></button>
                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type message..." className="flex-1 bg-transparent px-2 py-3 outline-none text-white text-[16px]" />
                <button type="submit" className="bg-green-600 p-4 rounded-2xl shadow-xl active:scale-90 transition-all"><Send size={20} /></button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE MODAL */}
      {showProfileEdit && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div className="bg-[#161b2c] w-full max-w-sm rounded-[32px] p-8 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black">Profile</h2><X className="cursor-pointer text-slate-500" onClick={() => setShowProfileEdit(false)} /></div>
            <div className="space-y-6">
              <div><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Name</label><input value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-white/5 p-4 rounded-2xl outline-none text-white" /></div>
              <div><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Photo Link</label><input value={newPhoto} onChange={e => setNewPhoto(e.target.value)} className="w-full bg-white/5 p-4 rounded-2xl outline-none text-white" /></div>
              <button onClick={() => { updateProfile(auth.currentUser, { displayName: newName, photoURL: newPhoto }); updateDoc(doc(db, "users", user.uid), { displayName: newName, photoURL: newPhoto }); setShowProfileEdit(false); }} className="w-full bg-green-600 py-5 rounded-2xl font-black text-lg active:scale-95 transition-all">Save Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
