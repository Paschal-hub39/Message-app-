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

        window.addEventListener('beforeunload', () => {
          updateDoc(userRef, { status: "Offline", lastSeen: serverTimestamp() });
        });
      } else {
        setUser(null);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data()).filter(u => u.uid !== user.uid));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    
    const q = query(collection(db, "messages"), where("chatId", "==", chatId), orderBy("createdAt", "asc"));
    const unsubMsgs = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

  const handleTouchStart = (e) => { touchStart.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = (e, msg) => {
    if (e.changedTouches[0].clientX - touchStart.current > 70) setReplyTo(msg);
  };

  const handleTyping = async (e) => {
    setNewMessage(e.target.value);
    if (!user || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `${user.uid}_${selectedUser.uid}` : `${selectedUser.uid}_${user.uid}`;
    await setDoc(doc(db, "typing", chatId), { [user.uid]: true }, { merge: true });
    setTimeout(async () => {
      await setDoc(doc(db, "typing", chatId), { [user.uid]: false }, { merge: true });
    }, 2000);
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

  const handleProfileUpdate = async () => {
    await updateProfile(auth.currentUser, { displayName: newName, photoURL: newPhoto });
    await updateDoc(doc(db, "users", user.uid), { displayName: newName, photoURL: newPhoto });
    setShowProfileEdit(false);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-4">
        <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl text-center border border-slate-700">
          <MessageSquare size={60} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Paschala Hub</h1>
          <button onClick={() => signInWithPopup(auth, googleProvider)} className="bg-green-600 px-8 py-3 rounded-xl font-bold">Sign in with Google</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden relative">
      <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-800 bg-slate-900`}>
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <img src={user.photoURL} className="w-10 h-10 rounded-full border-2 border-green-500 cursor-pointer" onClick={() => setShowProfileEdit(true)} alt="me" />
          <div className="flex gap-4">
            <User className="text-slate-400 cursor-pointer" onClick={() => setShowProfileEdit(true)} />
            <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-red-500"><LogOut size={20} /></button>
          </div>
        </div>
        <div className="p-4"><div className="relative"><Search className="absolute left-3 top-3 text-slate-500" size={18} /><input type="text" placeholder="Search users..." className="w-full bg-slate-800 rounded-xl py-2 pl-10 pr-4 focus:outline-none border border-slate-700" /></div></div>
        <div className="flex-1 overflow-y-auto">
          {users.map(u => (
            <div key={u.uid} onClick={() => setSelectedUser(u)} className={`flex items-center gap-3 p-4 cursor-pointer transition-all hover:bg-slate-800 ${selectedUser?.uid === u.uid ? 'bg-slate-800 border-l-4 border-green-500' : ''}`}>
              <div className="relative"><img src={u.photoURL} className="w-12 h-12 rounded-full" alt="" />{u.status === "Online" && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>}</div>
              <div className="flex-1 min-w-0"><p className="font-bold truncate">{u.displayName}</p><p className="text-xs text-slate-500">{u.status === "Online" ? "Online" : "Offline"}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div className={`${!selectedUser ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat`}>
        {selectedUser ? (
          <>
            <div className="p-4 bg-slate-900/90 backdrop-blur-md flex items-center gap-3 border-b border-slate-800">
              <button onClick={() => setSelectedUser(null)} className="md:hidden text-slate-400 mr-2 text-2xl">←</button>
              <img src={selectedUser.photoURL} className="w-10 h-10 rounded-full" alt="peer" />
              <div><p className="font-bold">{selectedUser.displayName}</p><p className="text-xs text-green-500">{peerTyping ? "Typing..." : selectedUser.status}</p></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
              {messages.map(msg => (
                <div key={msg.id} onTouchStart={handleTouchStart} onTouchEnd={(e) => handleTouchEnd(e, msg)} className={`flex flex-col ${msg.senderId === user.uid ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl shadow-lg relative ${msg.senderId === user.uid ? 'bg-green-600 text-white rounded-tr-none' : 'bg-slate-800 text-white rounded-tl-none border border-slate-700'}`}>
                    {msg.replyTo && <div className="bg-black/20 p-2 rounded-lg mb-2 border-l-4 border-green-400 text-xs italic"><p className="font-bold text-green-400">{msg.replyTo.senderName}</p><p className="truncate">{msg.replyTo.text}</p></div>}
                    <p className="text-sm pr-6">{msg.text}</p>
                    {msg.senderId === user.uid && <div className="absolute bottom-1 right-2">{msg.seen ? <CheckCheck size={14} className="text-blue-300" /> : <Check size={14} className="text-white/60" />}</div>}
                  </div>
                </div>
              ))}
              <div ref={scroll}></div>
            </div>

            {replyTo && (
              <div className="mx-4 bg-slate-800 p-3 rounded-t-2xl border-t border-x border-slate-700 flex justify-between items-center">
                <div className="border-l-4 border-green-500 pl-3 overflow-hidden"><p className="text-xs text-green-500 font-bold">Replying to {replyTo.senderId === user.uid ? 'You' : selectedUser.displayName}</p><p className="text-sm text-slate-400 truncate">{replyTo.text}</p></div>
                <X size={18} className="cursor-pointer text-slate-500" onClick={() => setReplyTo(null)} />
              </div>
            )}

            <form onSubmit={sendMessage} className="p-4 bg-slate-900/90 backdrop-blur-md flex gap-2">
              <input value={newMessage} onChange={handleTyping} placeholder="Type a message..." className="flex-1 bg-slate-800 rounded-full px-6 py-3 focus:outline-none border border-slate-700 text-white" />
              <button type="submit" className="bg-green-600 p-3 rounded-full shadow-lg"><Send size={24} /></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-950/80"><MessageSquare size={80} className="opacity-10 mb-4" /><p className="text-xl">Select a user to start chatting</p></div>
        )}
      </div>

      {showProfileEdit && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Settings</h2><X className="cursor-pointer text-slate-400" onClick={() => setShowProfileEdit(false)} /></div>
            <div className="space-y-4">
              <div><label className="text-xs text-slate-500 ml-1">Name</label><input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 outline-none" /></div>
              <div><label className="text-xs text-slate-500 ml-1">Photo Link</label><input value={newPhoto} onChange={(e) => setNewPhoto(e.target.value)} className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 outline-none" /></div>
              <button onClick={handleProfileUpdate} className="w-full bg-green-600 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors">Save Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
