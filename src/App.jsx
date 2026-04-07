import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, addDoc, query, where, orderBy, 
  onSnapshot, serverTimestamp, setDoc, doc 
} from 'firebase/firestore';

function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef();

  // 1. Handle Authentication & Sync User to Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Save user to "users" collection so they appear in sidebars
        await setDoc(doc(db, "users", currentUser.uid), {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          lastSeen: serverTimestamp()
        }, { merge: true });
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch all users for the sidebar
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.filter(d => d.id !== user.uid).map(d => d.data()));
    });
    return () => unsubscribe();
  }, [user]);

  // 3. THE FIX: Fetch messages for the SPECIFIC private chat
  useEffect(() => {
    if (!user || !selectedUser) {
      setMessages([]);
      return;
    }

    // This logic ensures the ID is ALWAYS the same for both people
    const combinedId = user.uid > selectedUser.uid 
      ? `${user.uid}_${selectedUser.uid}` 
      : `${selectedUser.uid}_${user.uid}`;

    const q = query(
      collection(db, "messages"),
      where("chatId", "==", combinedId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [selectedUser, user]);

  // 4. Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const combinedId = user.uid > selectedUser.uid 
      ? `${user.uid}_${selectedUser.uid}` 
      : `${selectedUser.uid}_${user.uid}`;

    await addDoc(collection(db, "messages"), {
      text: newMessage,
      senderId: user.uid,
      receiverId: selectedUser.uid, // Matches your screenshot spelling
      chatId: combinedId,
      senderName: user.displayName,
      createdAt: serverTimestamp()
    });

    setNewMessage("");
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
        <h1 className="text-4xl font-bold mb-8 text-blue-400">Paschala Hub</h1>
        <button 
          onClick={() => signInWithPopup(auth, googleProvider)}
          className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-full font-bold transition-all shadow-lg"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#111b21] text-[#e9edef] overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-[#374045] flex flex-col">
        <div className="p-4 bg-[#202c33] flex justify-between items-center">
          <img src={user.photoURL} alt="me" className="w-10 h-10 rounded-full" />
          <button onClick={() => signOut(auth)} className="text-xs text-red-400 uppercase tracking-widest">Logout</button>
        </div>
        <div className="overflow-y-auto flex-1">
          {users.map(u => (
            <div 
              key={u.uid} 
              onClick={() => setSelectedUser(u)}
              className={`p-4 flex items-center gap-3 cursor-pointer border-b border-[#222d34] hover:bg-[#2a3942] ${selectedUser?.uid === u.uid ? 'bg-[#2a3942]' : ''}`}
            >
              <img src={u.photoURL} alt="" className="w-12 h-12 rounded-full" />
              <div>
                <div className="font-medium text-[#e9edef]">{u.displayName}</div>
                <div className="text-xs text-[#8696a0]">Online</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-[#0b141a]">
        {selectedUser ? (
          <>
            <div className="p-3 bg-[#202c33] flex items-center gap-3">
              <img src={selectedUser.photoURL} alt="" className="w-10 h-10 rounded-full" />
              <span className="font-semibold">{selectedUser.displayName}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-opacity-5">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.senderId === user.uid ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] p-2 rounded-lg shadow-sm ${m.senderId === user.uid ? "bg-[#005c4b] text-white rounded-tr-none" : "bg-[#202c33] text-white rounded-tl-none"}`}>
                    <p className="text-sm">{m.text}</p>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={sendMessage} className="p-3 bg-[#202c33] flex gap-2">
              <input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message"
                className="flex-1 bg-[#2a3942] border-none outline-none rounded-lg px-4 py-2 text-sm"
              />
              <button className="bg-[#00a884] text-white px-6 py-2 rounded-lg font-bold">Send</button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#8696a0]">
            Select a contact to start chatting
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
