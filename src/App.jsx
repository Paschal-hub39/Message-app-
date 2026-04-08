import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, where, serverTimestamp, setDoc, doc, updateDoc } from 'firebase/firestore';
import { Send, LogOut, MessageSquare, Search, User, Check, CheckCheck, X, Camera } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]); 
  const [selectedUser, setSelectedUser] = useState(null); 
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [peerTyping, setPeerTyping] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [replyTo, setReplyTo] = useState(null); 
  const [newName, setNewName] = useState("");
  const [newPhoto, setNewPhoto] = useState("");
  const scroll = useRef();
  const touchStart = useRef(0);

  // 1. Auth & Presence
  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setNewName(u.displayName);
        setNewPhoto(u.photoURL);
        const userRef = doc(db, "users", u.uid);
        await setDoc(userRef, {
          uid: u.uid,
          displayName: u.displayName,
          photoURL: u.photoURL,
          status: "Online",
          lastSeen: serverTimestamp()
        }, { merge: true });
        
        if ("Notification" in window) Notification.requestPermission();

        window.addEventListener('beforeunload', () => {
          updateDoc(userRef, { status: "Offline", lastSeen: serverTimestamp() });
        });
      } else {
        setUser(null);
      }
    });
  }, []);

  // 2. Sidebar Users
  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data()).filter(u => u.uid !== user.uid));
    });
  }, [user]);

  // 3. Messages & Reactions & Typing
  useEffect(() => {
    if (!user || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    
    const q = query(collection(db, "messages"), where("chatId", "==", chatId), orderBy("createdAt", "asc"));
    const unsubMsgs = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.senderId !== user.uid && !lastMsg.seen) {
        if ('vibrate' in navigator) navigator.vibrate(200);
      }

      setMessages(msgs);
      msgs.forEach(msg => {
        if (msg.receiverId === user.uid && !msg.seen) {
          updateDoc(doc(db, "messages", msg.id), { seen: true });
        }
      });
      scroll.current?.scrollIntoView({ behavior: 'smooth' });
    });

    const unsubTyping = onSnapshot(doc(db, "typing", chatId), (doc) => {
      if (doc.exists()) setPeerTyping(doc.data()[selectedUser.uid] || false);
    });

    return () => { unsubMsgs(); unsubTyping(); };
  }, [user, selectedUser]);

  // 4. Interaction Handlers
  const handleTouchStart = (e) => { touchStart.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = (e, msg) => {
    if (e.changedTouches[0].clientX - touchStart.current > 70) {
      if ('vibrate' in navigator) navigator.vibrate(50);
      setReplyTo(msg);
    }
  };

  const handleTyping = async (e) => {
    setNewMessage(e.target.value);
    if (!user || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    await setDoc(doc(db, "typing", chatId), { [user.uid]: true }, { merge: true });
    setTimeout(() => setDoc(doc(db, "typing", chatId), { [user.uid]: false }, { merge: true }), 2000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;

    await addDoc(collection(db, "messages"), {
      text: newMessage,
      senderId: user.uid,
      receiverId: selectedUser.uid,
      chatId: chatId,
      createdAt: serverTimestamp(),
      seen: false,
      replyTo: replyTo ? { text: replyTo.text, senderName: replyTo.senderId === user.uid ? 'You' : selectedUser.displayName } : null
    });

    setNewMessage("");
    setReplyTo(null);
  };

  if (!user) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
      <div className="w-20 h-20 bg-green-600 rounded-3xl flex items-center justify-center shadow-xl mb-6">
        <MessageSquare size={40} />
      </div>
      <h1 className="text-3xl font-black mb-6">Paschala Hub</h1>
      <button onClick={() => signInWithPopup(auth, googleProvider)} className="bg-white text-black px-10 py-4 rounded-2xl font-bold shadow-lg">Continue with Google</button>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden relative">
      
      {/* SIDEBAR */}
      <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-white/5 bg-slate-900/50 backdrop-blur-xl`}>
        <div className="p-6 flex justify-between items-center">
          <img src={user.photoURL} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-green-500/20 cursor-pointer" onClick={() => setShowProfileEdit(true)} alt="" />
          <div className="flex gap-2">
            <button className="p-2 hover:bg-white/5 rounded-xl" onClick={() => setShowProfileEdit(true)}><User size={20} className="text-slate-400" /></button>
            <button className="p-2 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-500" onClick={() => signOut(auth)}><LogOut size={20} /></button>
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
            <input type="text" placeholder="Search messages..." className="w-full bg-white/5 rounded-2xl py-3 pl-12 pr-4 focus:outline-none border border-transparent focus:ring-1 ring-green-500/50" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          {users.map(u => (
            <div key={u.uid} onClick={() => setSelectedUser(u)} className={`flex items-center gap-4 p-4 cursor-pointer rounded-2xl transition-all ${selectedUser?.uid === u.uid ? 'bg-green-600 shadow-lg shadow-green-600/20' : 'hover:bg-white/5'}`}>
              <div className="relative">
                <img src={u.photoURL} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                {u.status === "Online" && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-slate-900"></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{u.displayName}</p>
                <p className={`text-xs truncate ${selectedUser?.uid === u.uid ? 'text-green-100' : 'text-slate-500'}`}>{u.status === "Online" ? "Active now" : "Offline"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className={`${!selectedUser ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-slate-950`}>
        {selectedUser ? (
          <>
            <div className="p-4 bg-slate-900/80 backdrop-blur-md flex items-center gap-3 border-b border-white/5">
              <button onClick={() => setSelectedUser(null)} className="md:hidden text-slate-400 text-2xl mr-2">←</button>
              <img src={selectedUser.photoURL} className="w-10 h-10 rounded-xl" alt="" />
              <div>
                <p className="font-bold">{selectedUser.displayName}</p>
                <p className="text-[10px] uppercase font-bold text-green-500 tracking-widest">{peerTyping ? "Typing..." : selectedUser.status}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} 
                     onTouchStart={handleTouchStart} 
                     onTouchEnd={(e) => handleTouchEnd(e, msg)}
                     onDoubleClick={async () => {
                       const msgRef = doc(db, "messages", msg.id);
                       await updateDoc(msgRef, { reaction: msg.reaction === "❤️" ? null : "❤️" });
                       if ('vibrate' in navigator) navigator.vibrate(50);
                     }}
                     className={`flex flex-col animate-in slide-in-from-bottom-2 ${msg.senderId === user.uid ? 'items-end' : 'items-start'}`}>
                  
                  <div className={`max-w-[85%] p-4 rounded-3xl shadow-xl relative transition-all ${msg.senderId === user.uid ? 'bg-green-600 text-white rounded-tr-none' : 'bg-slate-800/90 backdrop-blur-sm text-white rounded-tl-none border border-white/5'}`}>
                    {msg.replyTo && (
                      <div className="bg-black/20 p-3 rounded-xl mb-2 border-l-4 border-white/30 text-xs italic">
                        <p className="font-black opacity-60 mb-1">{msg.replyTo.senderName}</p>
                        <p className="truncate opacity-80">{msg.replyTo.text}</p>
                      </div>
                    )}
                    <p className="text-[15px] leading-relaxed pr-4">{msg.text}</p>
                    
                    {/* Reaction Badge */}
                    {msg.reaction && (
                      <div className="absolute -bottom-2 -right-1 bg-slate-700 rounded-full px-2 py-0.5 text-[12px] border border-slate-600 shadow-lg">
                        {msg.reaction}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-1 opacity-50">
                       <p className="text-[9px] font-bold uppercase">
                        {msg.createdAt?.toDate ? new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(msg.createdAt.toDate()) : ''}
                       </p>
                       {msg.senderId === user.uid && (msg.seen ? <CheckCheck size={12} className="text-blue-300" /> : <Check size={12} />)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scroll}></div>
            </div>

            <div className="p-4 pb-8">
              {replyTo && (
                <div className="mx-4 bg-slate-800/95 p-4 rounded-t-3xl border-t border-x border-white/5 flex justify-between items-center animate-in slide-in-from-bottom-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Replying to {replyTo.senderId === user.uid ? 'You' : selectedUser.displayName}</p>
                    <p className="text-sm text-slate-400 truncate">{replyTo.text}</p>
                  </div>
                  <X size={20} className="text-slate-500 cursor-pointer" onClick={() => setReplyTo(null)} />
                </div>
              )}
              <form onSubmit={sendMessage} className={`bg-slate-900/90 backdrop-blur-md p-2 flex gap-2 items-center shadow-2xl ${replyTo ? 'rounded-b-3xl' : 'rounded-3xl'}`}>
                <input value={newMessage} onChange={handleTyping} placeholder="Write a message..." className="flex-1 bg-transparent px-6 py-3 focus:outline-none text-white placeholder:text-slate-600" />
                <button type="submit" className="bg-green-600 p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-600/20"><Send size={20} /></button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-700">
             <div className="w-24 h-24 rounded-full border-8 border-slate-900 mb-4 opacity-20 flex items-center justify-center"><MessageSquare size={40}/></div>
             <p className="text-xs font-bold tracking-widest uppercase opacity-20 italic">Select a person to Hub with</p>
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-slate-900 w-full max-w-sm rounded-[40px] p-8 border border-white/5 shadow-2xl">
            <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black">Profile Settings</h2><X className="cursor-pointer text-slate-500" onClick={() => setShowProfileEdit(false)} /></div>
            <div className="space-y-6">
              <div><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Name</label><input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-white/5 p-4 rounded-2xl border border-transparent focus:border-green-500 outline-none transition-all" /></div>
              <div><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Photo Link</label><input value={newPhoto} onChange={(e) => setNewPhoto(e.target.value)} className="w-full bg-white/5 p-4 rounded-2xl border border-transparent focus:border-green-500 outline-none transition-all" /></div>
              <button onClick={() => { updateProfile(auth.currentUser, { displayName: newName, photoURL: newPhoto }); updateDoc(doc(db, "users", user.uid), { displayName: newName, photoURL: newPhoto }); setShowProfileEdit(false); }} className="w-full bg-green-600 py-5 rounded-[24px] font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
