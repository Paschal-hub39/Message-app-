import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, addDoc, query, orderBy, 
  onSnapshot, serverTimestamp, setDoc, doc 
} from 'firebase/firestore';

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
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

  useEffect(() => {
    if (!user) return;
    // Simple query: Just get all messages ordered by time
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await addDoc(collection(db, "messages"), {
      text: newMessage,
      senderId: user.uid,
      senderName: user.displayName,
      createdAt: serverTimestamp()
    });
    setNewMessage("");
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#111b21] text-white">
        <h1 className="text-4xl font-bold mb-8 text-[#00a884]">Paschala Hub</h1>
        <button onClick={() => signInWithPopup(auth, googleProvider)} className="bg-[#00a884] px-8 py-3 rounded-full font-bold">Sign in with Google</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0b141a] text-[#e9edef]">
      <div className="p-4 bg-[#202c33] flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <img src={user.photoURL} className="w-10 h-10 rounded-full" alt="" />
          <span className="font-bold">Global Chat</span>
        </div>
        <button onClick={() => signOut(auth)} className="text-xs text-red-400">LOGOUT</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-opacity-5">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.senderId === user.uid ? "items-end" : "items-start"}`}>
            <span className="text-[10px] text-[#8696a0] mb-1">{m.senderName}</span>
            <div className={`p-2 rounded-lg max-w-[80%] ${m.senderId === user.uid ? "bg-[#005c4b] rounded-tr-none" : "bg-[#202c33] rounded-tl-none"}`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 bg-[#202c33] flex gap-2">
        <input 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-[#2a3942] rounded-lg px-4 py-2 outline-none"
        />
        <button className="bg-[#00a884] px-6 py-2 rounded-lg font-bold">Send</button>
      </form>
    </div>
  );
}

export default App;
