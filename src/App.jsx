import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Send, LogOut, MessageSquare } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scroll = useRef();

  useEffect(() => {
    onAuthStateChanged(auth, (user) => setUser(user));
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "messages"), orderBy("createdAt"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    await addDoc(collection(db, "messages"), {
      text: newMessage,
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
    });
    setNewMessage("");
    scroll.current.scrollIntoView({ behavior: 'smooth' });
  };

  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f0f2f5] p-6 text-center">
      <div className="bg-white p-10 rounded-3xl shadow-2xl">
        <MessageSquare size={80} className="text-[#25D366] mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-[#075e54] mb-2">Paschala Hub</h1>
        <p className="text-gray-500 mb-8">Real-time chatting made simple.</p>
        <button 
          onClick={() => signInWithPopup(auth, googleProvider)} 
          className="bg-[#075e54] text-white px-10 py-3 rounded-full font-bold hover:bg-[#128c7e] transition-all"
        >
          Login with Google
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#e5ddd5] max-w-md mx-auto border-x border-gray-300">
      {/* Header */}
      <header className="bg-[#075e54] text-white p-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-3">
          <img src={user.photoURL} alt="me" className="w-10 h-10 rounded-full border border-white/20" />
          <div>
            <p className="font-bold text-sm leading-tight">{user.displayName}</p>
            <p className="text-[10px] text-green-300">online</p>
          </div>
        </div>
        <button onClick={() => signOut(auth)} className="opacity-70 hover:opacity-100">
          <LogOut size={20} />
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-fixed">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.uid === user.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-3 py-2 rounded-xl shadow-sm max-w-[80%] text-sm relative ${msg.uid === user.uid ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
              <p className="text-[#303030]">{msg.text}</p>
              <p className="text-[9px] text-gray-500 text-right mt-1">
                {msg.createdAt?.toDate() ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
              </p>
            </div>
          </div>
        ))}
        <div ref={scroll}></div>
      </main>

      {/* Footer Input */}
      <form onSubmit={sendMessage} className="p-3 bg-[#f0f2f5] flex items-center gap-2">
        <input 
          className="flex-1 p-3 bg-white rounded-full outline-none text-sm shadow-inner" 
          placeholder="Type a message" 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()}
          className="bg-[#128c7e] text-white p-3 rounded-full disabled:opacity-50 shadow-md active:scale-90 transition-transform"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}

export default App;
        
