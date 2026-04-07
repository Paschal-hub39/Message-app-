import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, where, serverTimestamp, getDocs, setDoc, doc } from 'firebase/firestore';
import { Send, LogOut, MessageSquare, User, Search } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]); // List of all users
  const [selectedUser, setSelectedUser] = useState(null); // The person you are messaging
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scroll = useRef();

  // 1. Handle Login & Save User to Firestore
  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Save/Update user in "users" collection so others can find you
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          lastSeen: serverTimestamp()
        }, { merge: true });
      } else {
        setUser(null);
      }
    });
  }, []);

  // 2. Fetch all registered users for the Sidebar
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data()).filter(u => u.uid !== user.uid));
    });
    return () => unsub();
  }, [user]);

  // 3. Fetch Private Messages between You and Selected User
  useEffect(() => {
    if (!user || !selectedUser) return;

    // Logic: Find messages where (sender=me AND receiver=them) OR (sender=them AND receiver=me)
    const q = query(
      collection(db, "messages"),
      where("chatId", "in", [
        `${user.uid}_${selectedUser.uid}`,
        `${selectedUser.uid}_${user.uid}`
      ]),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      scroll.current?.scrollIntoView({ behavior: 'smooth' });
    });
    return () => unsubscribe();
  }, [user, selectedUser]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    await addDoc(collection(db, "messages"), {
      text: newMessage,
      senderId: user.uid,
      receiverId: selectedUser.uid,
      chatId: `${user.uid}_${selectedUser.uid}`, // Unique ID for this pair
      createdAt: serverTimestamp(),
      senderName: user.displayName
    });

    setNewMessage("");
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-4">
        <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl text-center border border-slate-700">
          <MessageSquare size={60} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Paschala Hub</h1>
          <p className="text-slate-400 mb-6">Real-time Private Messaging</p>
          <button 
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 mx-auto"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* SIDEBAR: User List */}
      <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-800 bg-slate-900`}>
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <img src={user.photoURL} className="w-10 h-10 rounded-full border-2 border-green-500" alt="me" />
          <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={18} />
            <input type="text" placeholder="Search users..." className="w-full bg-slate-800 rounded-xl py-2 pl-10 pr-4 focus:outline-none border border-slate-700" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Chats</h3>
          {users.map(u => (
            <div 
              key={u.uid} 
              onClick={() => setSelectedUser(u)}
              className={`flex items-center gap-3 p-4 cursor-pointer transition-all hover:bg-slate-800 ${selectedUser?.uid === u.uid ? 'bg-slate-800 border-l-4 border-green-500' : ''}`}
            >
              <img src={u.photoURL} className="w-12 h-12 rounded-full" alt={u.displayName} />
              <div className="flex-1">
                <p className="font-bold truncate">{u.displayName}</p>
                <p className="text-xs text-slate-500">Tap to start chatting</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className={`${!selectedUser ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat`}>
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="p-4 bg-slate-900/90 backdrop-blur-md flex items-center gap-3 border-b border-slate-800">
              <button onClick={() => setSelectedUser(null)} className="md:hidden text-slate-400 mr-2">←</button>
              <img src={selectedUser.photoURL} className="w-10 h-10 rounded-full" alt="peer" />
              <div>
                <p className="font-bold">{selectedUser.displayName}</p>
                <p className="text-xs text-green-500">Online</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl shadow-lg ${
                    msg.senderId === user.uid 
                    ? 'bg-green-600 text-white rounded-tr-none' 
                    : 'bg-slate-800 text-white rounded-tl-none border border-slate-700'
                  }`}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={scroll}></div>
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 bg-slate-900/90 backdrop-blur-md flex gap-2">
              <input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..." 
                className="flex-1 bg-slate-800 rounded-full px-6 py-3 focus:outline-none border border-slate-700 text-white"
              />
              <button type="submit" className="bg-green-600 p-3 rounded-full hover:bg-green-700 transition-transform active:scale-95 shadow-lg">
                <Send size={24} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-950/80">
            <MessageSquare size={80} className="opacity-10 mb-4" />
            <p className="text-xl">Select a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
