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
  const touchStart = useRef(0);

  const emojiCategories = {
    "Popular": ["❤️", "😂", "🙌", "🔥", "💯", "👍", "😎", "✨", "⚽", "🎮", "💸", "🇳🇬"],
    "Flags": ["🇲🇹", "🇲🇵", "🇲🇹", "🇲🇵", "🇲🇱", "🇲🇫", "🇲🇱", "🇲🇬", "🇳🇦", "🇲🇶", "🇳🇵", "🇲🇾", "🇲🇦", "🇲🇾", "🇲🇾", "🇲🇲", "🇲🇶", "🇲🇲", "🇹🇷", "🇺🇸", "🇬🇧"],
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
        window.addEventListener('beforeunload', () => updateDoc(doc(db, "users", u.uid), { status: "Offline" }));
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
    const unsubMsgs = onSnapshot(q, (s) => {
      setMessages(s.docs.map(d => ({ id: d.id, ...d.data() })));
      s.docs.forEach(d => d.data().receiverId === user.uid && !d.data().seen && updateDoc(doc(db, "messages", d.id), { seen: true }));
      scroll.current?.scrollIntoView({ behavior: 'smooth' });
    });
    const unsubTyping = onSnapshot(doc(db, "typing", chatId), (d) => { if (d.exists()) setPeerTyping(d.data()[selectedUser.uid] || false); });
    return () => { unsubMsgs(); unsubTyping(); };
  }, [user, selectedUser]);

  const sendMessage = async (val, type = "text") => {
    if (!val.trim() || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    await addDoc(collection(db, "messages"), { text: val, type, senderId: user.uid, receiverId: selectedUser.uid, chatId, createdAt: serverTimestamp(), seen: false, replyTo: replyTo ? { text: replyTo.text, senderName: replyTo.senderId === user.uid ? 'You' : selectedUser.displayName } : null });
    setNewMessage(""); setReplyTo(null); setShowEmojiPicker(false);
  };

  if (!user) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
      <div className="w-20 h-20 bg-green-600 rounded-3xl flex items-center justify-center shadow-2xl mb-6"><MessageSquare size={40} /></div>
      <h1 className="text-3xl font-black mb-8">Paschala Hub</h1>
      <button onClick={() => signInWithPopup(auth, googleProvider)} className="bg-white text-black px-12 py-4 rounded-2xl font-bold active:scale-95 transition-all shadow-xl">Sign in with Google</button>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-white/5 bg-slate-900/50 backdrop-blur-xl z-20`}>
        <div className="p-6 flex justify-between items-center">
          <img src={user.photoURL} onClick={() => setShowProfileEdit(true)} className="w-12 h-12 rounded-2xl ring-2 ring-green-500/20 object-cover cursor-pointer" alt="" />
          <div className="flex gap-2">
            <button onClick={() => setShowProfileEdit(true)} className="p-2 hover:bg-white/5 rounded-xl transition-all"><User size={20} className="text-slate-400" /></button>
            <button onClick={() => signOut(auth)} className="p-2 text-slate-400 hover:text-red-500 transition-all"><LogOut size={20} /></button>
          </div>
        </div>
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
            <input type="text" placeholder="Search people..." className="w-full bg-white/5 rounded-2xl py-3 pl-12 pr-4 outline-none border border-transparent focus:ring-1 ring-green-500/50" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {users.map(u => (
            <div key={u.uid} onClick={() => setSelectedUser(u)} className={`flex items-center gap-4 p-4 cursor-pointer rounded-2xl transition-all ${selectedUser?.uid === u.uid ? 'bg-green-600 shadow-lg' : 'hover:bg-white/5'}`}>
              <div className="relative"><img src={u.photoURL} className="w-14 h-14 rounded-2xl object-cover shadow-lg" alt="" />{u.status === "Online" && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-slate-900"></div>}</div>
              <div className="flex-1 min-w-0"><p className="font-bold truncate">{u.displayName}</p><p className="text-xs opacity-60 tracking-wide">{u.status === "Online" ? "Active now" : "Offline"}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col relative bg-slate-950">
        {selectedUser ? (
          <>
            {/* ADAPTIVE WALLPAPER FIX */}
            <div className="absolute inset-0 opacity-40 scale-110 blur-[80px] pointer-events-none transition-all duration-700" style={{ backgroundImage: `url(${selectedUser.photoURL})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#0f172a' }}></div>

            <div className="relative z-30 flex flex-col h-full w-full">
              {/* HEADER (Re-Added & Fixed) */}
              <div className="p-4 bg-slate-900/60 backdrop-blur-xl flex items-center gap-3 border-b border-white/5 shadow-md">
                <button onClick={() => setSelectedUser(null)} className="md:hidden text-2xl mr-2 text-white">←</button>
                <img src={selectedUser.photoURL} className="w-10 h-10 rounded-xl object-cover shadow-md" alt="" />
                <div className="flex flex-col">
                  <p className="font-bold text-white leading-tight">{selectedUser.displayName}</p>
                  <p className="text-[10px] text-green-500 font-black uppercase tracking-widest mt-0.5">{peerTyping ? "Typing..." : selectedUser.status}</p>
                </div>
              </div>

              {/* MESSAGES */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 && <div className="h-full flex items-center justify-center opacity-20 italic text-sm">Say something to {selectedUser.displayName}...</div>}
                {messages.map((msg) => (
                  <div key={msg.id} onDoubleClick={async () => {
                    const msgRef = doc(db, "messages", msg.id);
                    await updateDoc(msgRef, { reaction: msg.reaction === "❤️" ? null : "❤️" });
                    if ('vibrate' in navigator) navigator.vibrate(50);
                  }} className={`flex flex-col ${msg.senderId === user.uid ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[85%] ${msg.type === 'sticker' ? '' : 'p-4 rounded-3xl shadow-xl'} relative ${msg.senderId === user.uid ? 'bg-green-600 rounded-tr-none shadow-green-900/20' : 'bg-slate-800/80 backdrop-blur-md rounded-tl-none border border-white/5'}`}>
                      {msg.type === 'sticker' ? <img src={msg.text} className="w-32 h-32 rounded-2xl shadow-lg" alt="" /> : (
                        <>
                          {msg.replyTo && <div className="bg-black/20 p-2 rounded-xl mb-2 border-l-4 border-white/30 text-[11px] italic text-white/80"><p className="font-black opacity-60 text-[10px]">{msg.replyTo.senderName}</p><p className="truncate">{msg.replyTo.text}</p></div>}
                          <p className="text-[15px] leading-relaxed pr-4 text-white font-medium">{msg.text}</p>
                        </>
                      )}
                      {msg.reaction && <div className="absolute -bottom-2 -right-1 bg-slate-700 rounded-full px-2 py-0.5 text-[12px] border border-slate-600 shadow-xl animate-in zoom-in-50">{msg.reaction}</div>}
                      <div className="flex justify-end gap-1 mt-1 opacity-40 text-[9px] font-black uppercase tracking-tighter">
                        {msg.createdAt?.toDate && new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {msg.senderId === user.uid && (msg.seen ? <CheckCheck size={12} className="text-blue-300" /> : <Check size={12} />)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={scroll}></div>
              </div>

              {/* INPUT */}
              <div className="p-4 pb-10 space-y-2 z-50">
                {showEmojiPicker && (
                  <div className="bg-slate-900/95 backdrop-blur-2xl p-5 rounded-[32px] border border-white/10 shadow-2xl max-h-[300px] overflow-y-auto mb-3">
                    {Object.entries(emojiCategories).map(([cat, items]) => (
                      <div key={cat} className="mb-4">
                        <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">{cat}</p>
                        <div className="grid grid-cols-6 gap-3">
                          {cat === "Stickers" ? items.map(s => <button key={s} onClick={() => sendMessage(s, "sticker")} className="active:scale-110 transition-transform"><img src={s} className="w-12 h-12 rounded-lg" alt="" /></button>)
                            : items.map(e => <button key={e} onClick={() => sendMessage(e)} className="text-2xl active:scale-125 transition-transform">{e}</button>)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(newMessage); }} className="bg-slate-900/70 backdrop-blur-2xl p-2 flex gap-2 items-center rounded-3xl shadow-2xl border border-white/5">
                  <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-3 rounded-2xl transition-all ${showEmojiPicker ? 'text-green-500 bg-green-500/10' : 'text-slate-400'}`}><Smile size={24} /></button>
                  <input value={newMessage} onChange={(e) => {
                    setNewMessage(e.target.value);
                    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
                    setDoc(doc(db, "typing", chatId), { [user.uid]: true }, { merge: true });
                    setTimeout(() => setDoc(doc(db, "typing", chatId), { [user.uid]: false }, { merge: true }), 2000);
                  }} placeholder="Type message..." className="flex-1 bg-transparent px-2 py-3 outline-none text-white text-sm" />
                  <button type="submit" className="bg-green-600 p-4 rounded-2xl shadow-xl shadow-green-600/20 active:scale-90 transition-all"><Send size={20} /></button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-800 opacity-20"><MessageSquare size={60} className="mb-4" /><p className="text-xs font-black uppercase tracking-[0.3em]">Paschala Hub</p></div>
        )}
      </div>

      {/* MODAL */}
      {showProfileEdit && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div className="bg-slate-900 w-full max-w-sm rounded-[40px] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black">Profile</h2><X className="cursor-pointer text-slate-400" onClick={() => setShowProfileEdit(false)} /></div>
            <div className="space-y-6">
              <div><label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Name</label><input value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-white/5 p-4 rounded-2xl outline-none text-white border border-transparent focus:border-green-500" /></div>
              <div><label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Photo Link</label><input value={newPhoto} onChange={e => setNewPhoto(e.target.value)} className="w-full bg-white/5 p-4 rounded-2xl outline-none text-white border border-transparent focus:border-green-500" /></div>
              <button onClick={() => { updateProfile(auth.currentUser, { displayName: newName, photoURL: newPhoto }); updateDoc(doc(db, "users", user.uid), { displayName: newName, photoURL: newPhoto }); setShowProfileEdit(false); }} className="w-full bg-green-600 py-5 rounded-[24px] font-black text-lg shadow-xl shadow-green-600/20 hover:scale-[1.02] active:scale-95 transition-all">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
