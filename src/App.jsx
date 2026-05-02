import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, addDoc, query, orderBy, onSnapshot, where, 
  serverTimestamp, setDoc, doc, updateDoc, limit, deleteDoc 
} from 'firebase/firestore';
import { 
  Send, MessageSquare, Search, Shield, Zap, Radio, Lock, Smile, Check, CheckCheck, 
  Image as ImageIcon, Phone, Globe, TrendingUp, DollarSign, EyeOff, X, Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIG & ENCRYPTION (unchanged) ---
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

// ==================== MASSIVELY EXPANDED EMOJIS & GIFS ====================
const EMOJI_LIST = [
  "😂","😭","🤣","🥲","🥹","😅","😆","😁","😄","😃","🥰","😍","🤩","🥳","😘","😚","😊","😇","🙂","🙃","😉","😌","😏","😜","🤪","😝","🤗","🤭","🫢","🫣","🤔","🫡","🤨","😐","😑","😶","😒","🙄","😬","😮‍💨","🤥","😔","🥺","😢","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🫠","😵","😵‍💫","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","🥳","😎","🤓","🧐","😏","😒","🙄","😬","🤨","🫠",
  "👍","👎","👊","✊","🤛","🤜","👏","🙌","👐","🤲","🙏","✌️","🤞","🫰","🤟","🤘","👌","🤌","👈","👉","👆","👇","☝️","🖕","💪","🦵","🦶","👀","👁️","👅","👄","💋",
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","💘","💝","💖","💗","💓","💞","💕","💟","💌","🔥","⚡","✨","💥","💫","💦","💰","📈","🚀","🌍","🏆","🎉","🍾",
  "🐶","🐱","🦍","🐼","🦁","🐸","🐍","🦋","🐢","🦖","🍎","🍉","🍓","🥑","🍔","🍕","🍣","🧁","🍫","🇳🇬","🇬🇭","🇺🇸","🇬🇧","🇯🇵","🌍","💵","🪙","📊"
];

const GIF_LIST = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlUxc2YM1NC6ny8/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26AHONh79u4m5W98s/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKVUn7iM8FMEU24/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXZueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l41lTfuxV5F68S96E/giphy.gif",
  "https://media.giphy.com/media/Ju7l5p0O9xZ8I/giphy.gif",
  "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif",
  "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
  "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif",
  "https://media.giphy.com/media/l0IylOPCNkiqOg8rm/giphy.gif",
  "https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif",
  "https://media.giphy.com/media/26xBwdIuR9J2c7s2c/giphy.gif",
  "https://media.giphy.com/media/3o72EX5QZ9N9d51dqM/giphy.gif",
  "https://media.giphy.com/media/l0HlRnAWXxn0MhKLK/giphy.gif",
  "https://media.giphy.com/media/3oEjHWt8b3q5t6J5qM/giphy.gif",
  "https://media.giphy.com/media/26BRv0Th5V0z6Q7bW/giphy.gif",
  "https://media.giphy.com/media/l41lR4rY4f8p8Zf9q/giphy.gif",
  "https://media.giphy.com/media/3o7TKsQ8v2Z8j5z5zC/giphy.gif",
  "https://media.giphy.com/media/26xBwdIuR9J2c7s2c/giphy.gif", // money vibe
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
  const [typingUsers, setTypingUsers] = useState({}); // Real-time typing
  const scroll = useRef();

  // Your original functions (handleAddFunds, handlePostIdea, toggleStealth, etc.) remain unchanged

  // Message Delete
  const deleteMessage = async (msgId) => {
    if (!msgId) return;
    try {
      await deleteDoc(doc(db, "messages", msgId));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  // ... (Keep all your original useEffects here) ...

  // Real-time Typing Listener
  useEffect(() => {
    if (!user || !selectedUser) return;
    const userRef = doc(db, "users", selectedUser.uid);
    return onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setTypingUsers(prev => ({ ...prev, [selectedUser.uid]: snap.data().typing }));
      }
    });
  }, [user, selectedUser]);

  const handleSend = async (val, type = "text") => {
    const content = val || newMessage;
    if (!content.trim() || !selectedUser) return;
    const chatId = user.uid > selectedUser.uid ? `\( {user.uid}_ \){selectedUser.uid}` : `\( {selectedUser.uid}_ \){user.uid}`;
    await addDoc(collection(db, "messages"), { 
      text: type === "text" ? encrypt(content) : content, 
      type, encrypted: type === "text",
      senderId: user.uid, receiverId: selectedUser.uid, chatId, 
      createdAt: serverTimestamp(), seen: false 
    });
    setNewMessage(""); setKeyboardView("none");
  };

  // ... (your original loading and login screens unchanged) ...

  return (
    <div className="fixed inset-0 bg-[#060a16] text-white flex flex-col overflow-hidden font-sans">

      {/* Your original non-chat screens (chats list, market, settings) are untouched */}

      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-[#060a16] flex flex-col">
          <header className="p-4 flex items-center gap-4 border-b border-white/5 bg-[#0d1225]">
            <button onClick={() => setSelectedUser(null)} className="p-2 text-green-500 font-black text-xl">←</button>
            <img src={selectedUser.photoURL || ""} className="w-10 h-10 rounded-xl bg-slate-800" />
            <h4 className="font-black text-[13px] uppercase truncate">{selectedUser.displayName}</h4>
          </header>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <AnimatePresence>
              {messages.map((m) => (
                <motion.div 
                  key={m.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className={`flex flex-col ${m.senderId === user.uid ? 'items-end' : 'items-start'}`}
                >
                  <div 
                    className={`max-w-[80%] px-4 py-3 rounded-[24px] ${m.senderId === user.uid ? 'bg-green-600' : 'bg-[#11172b]'}`}
                    onDoubleClick={() => m.senderId === user.uid && deleteMessage(m.id)}
                  >
                    {m.type === "gif" ? (
                      <img src={m.text} className="w-40 rounded-xl" alt="gif" />
                    ) : (
                      <p className="text-[14px]">{m.encrypted ? decrypt(m.text) : m.text}</p>
                    )}
                    {m.senderId === user.uid && (
                      <button 
                        onClick={() => deleteMessage(m.id)}
                        className="text-[10px] text-red-400 mt-1 opacity-70 hover:opacity-100"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={scroll} />
          </div>

          {/* Real-time Typing Indicator */}
          {typingUsers[selectedUser.uid] && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-6 pb-2 text-green-500 text-sm italic"
            >
              {selectedUser.displayName} is typing...
            </motion.p>
          )}

          {/* Your original input area with expanded lists */}
          <div className="p-5 bg-[#0d1225] rounded-t-[40px] shadow-2xl">
            <div className="bg-[#11172b] p-2 flex gap-2 items-center rounded-full border border-white/5 mb-3">
              <button onClick={() => setKeyboardView(keyboardView === 'emoji' ? 'none' : 'emoji')} className="p-2 text-slate-500"><Smile size={22} /></button>
              <button onClick={() => setKeyboardView(keyboardView === 'gif' ? 'none' : 'gif')} className="p-2 text-slate-500"><Gift size={22} /></button>
              <input 
                value={newMessage} 
                onFocus={() => setIsTyping(true)} 
                onBlur={() => setIsTyping(false)} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Send signal..." 
                className="flex-1 bg-transparent py-3 px-2 outline-none text-sm" 
              />
              <button onClick={() => handleSend(newMessage)} className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center"><Send size={20} /></button>
            </div>

            {keyboardView === 'emoji' && (
              <div className="h-48 overflow-y-auto grid grid-cols-8 gap-3 p-4 bg-[#11172b] rounded-3xl">
                {EMOJI_LIST.map((e,i) => <button key={i} onClick={()=>setNewMessage(p=>p+e)} className="text-3xl hover:scale-125 active:scale-90 transition-transform">{e}</button>)}
              </div>
            )}

            {keyboardView === 'gif' && (
              <div className="h-48 overflow-y-auto grid grid-cols-2 gap-3 p-4 bg-[#11172b] rounded-3xl">
                {GIF_LIST.map((g,i) => (
                  <motion.img 
                    key={i} 
                    src={g} 
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={()=>handleSend(g, 'gif')} 
                    className="h-40 w-full object-cover rounded-2xl cursor-pointer" 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Your original bottom navigation unchanged */}
    </div>
  );
}