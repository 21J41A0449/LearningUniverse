import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- Firebase Configuration ---
// IMPORTANT: Replace this with your actual Firebase config object
const firebaseConfig = {
  apiKey: "AIzaSyDckTd6j_2JLGqVl0bJAt6nyn3CK-MoYkU",
  authDomain: "educaation-afa1d.firebaseapp.com",
  projectId: "educaation-afa1d",
  storageBucket: "educaation-afa1d.firebasestorage.app",
  messagingSenderId: "562101584367",
  appId: "1:562101584367:web:d1eb1fcbfb163ef826f61a",
  measurementId: "G-4C6WVDRDT5"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Gemini API Call Helpers ---
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
// Verify environment variables are loaded
console.log("Gemini API Key:", API_KEY ? "***REDACTED***" : "MISSING");
if (!API_KEY) {
    console.error("Gemini API key is missing. Please:\n1. Check .env file exists\n2. Restart development server\n3. Ensure .env is in src folder");
    alert("Learning features unavailable - API configuration error (check console)");
}

const callGeminiTextAPI = async (contents) => {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;
    const payload = { contents, generationConfig: { temperature: 0.7 } };
    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't get a response.";
    } catch (error) {
        console.error("Gemini Text API call failed:", error);
        if (error.message.includes("status")) {
            return `Sorry, my circuits are busy (${error.message}). Please try again.`;
        }
        return "My learning circuits need repair (API issue). Try again later.";
    }
};

const callGeminiJsonAPI = async (prompt, schema) => {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", responseSchema: schema } };
    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const result = await response.json();
        return JSON.parse(result.candidates[0].content.parts[0].text);
    } catch (error) {
        console.error("Gemini JSON API call failed:", error);
        if (error.message.includes("status")) {
            console.warn("Possible authentication issue - check API key");
        }
        return { error: "Failed to process response. Please try again." };
    }
};

// --- Audio generation helper (placeholder) ---
const generateAudio = async (text) => {
    // This function will no longer generate an audio URL, as we'll use Web Speech API directly.
    // The Web Speech API plays directly, so we don't need to return a URL.
    return null;
};

// --- UI Helper Components ---
const Icon = ({ path, className = "w-12 h-12 mb-4 text-white" }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d={path} /></svg>);
const BackButton = ({ onClick }) => (<button onClick={onClick} className="absolute top-6 left-6 text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-full p-2 transition-colors z-50"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>);
const Spinner = () => (<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
const Modal = ({ children, onClose }) => (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-gray-800 border border-cyan-500/30 rounded-2xl shadow-2xl p-8 max-w-lg w-full relative animate-fade-in-up">{children}<button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button></div><style>{`@keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } } .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }`}</style></div>);

// --- Dashboard ---
const ConceptCard = ({ icon, title, description, onLaunch }) => (<div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 flex flex-col items-center text-center transform hover:scale-105 hover:border-cyan-400/50 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20">{icon}<h3 className="text-xl font-bold text-white mb-2">{title}</h3><p className="text-gray-400 text-sm mb-6 flex-grow">{description}</p><button onClick={onLaunch} className="w-full bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75">Launch</button></div>);
const Dashboard = ({ setActiveScreen, setGradeLevel, gradeLevel, setShowJournal, setShowMysteryDrop, userStats, setShowLeaderboard, setCuriousTopic, userId, onInstall }) => {
    const concepts = [
        { id: 'time-travel-teacher', icon: <Icon path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.5 14.5L11 13V7h1.5v5.25l2.5 1.75L13.5 16.5z" />, title: 'Time-Travel Teacher', description: 'Travel through time and chat with famous figures from history!' },
        { id: 'concept-swapper', icon: <Icon path="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z" />, title: 'Concept Swapper', description: 'Explain school subjects like science and math using fun analogies.' },
        { id: 'mind-symphony', icon: <Icon path="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />, title: 'Mind Symphony', description: 'Turn your study notes into audio tracks to help you remember.' },
        { id: 'curiosity-quests', icon: <Icon path="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />, title: 'Curiosity Quests', description: 'Go on exciting mini-adventures about any topic you can imagine!' },
    ];
    
    const handleFeelingCurious = async () => {
        const prompt = `Suggest one interesting, specific learning topic for a student in grades ${gradeLevel}. For example: "The life of a Roman Gladiator" or "How black holes work". Just return the topic name.`;
        const topic = await callGeminiTextAPI([{ role: 'user', parts: [{ text: prompt }] }]);
        setCuriousTopic(topic);
    };

    return (<div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 flex flex-col items-center font-sans"><header className="w-full max-w-7xl flex justify-between items-center mb-8 flex-wrap gap-4"><div className="text-left"><h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Learning Universe</h1><p className="text-gray-300 text-lg">Your User ID: <span className="font-mono text-xs bg-gray-700 p-1 rounded">{userId}</span></p></div><div className="flex items-center gap-4"><div className="flex items-center gap-2 text-yellow-400 font-bold text-lg">🔥<span>{userStats.streak}</span></div><div className="flex items-center gap-2 text-cyan-400 font-bold text-lg">💎<span>{userStats.xp} XP</span></div><select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"><option value="3-5">Grades 3-5</option><option value="6-8">Grades 6-8</option><option value="9-10">Grades 9-10</option></select><button onClick={() => setShowLeaderboard(true)} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold">🏆</button><button onClick={() => setShowJournal(true)} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold">My Journal</button>{onInstall && <button onClick={onInstall} className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-semibold">Install App</button>}</div></header><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-7xl">{concepts.map(concept => <ConceptCard key={concept.id} {...concept} onLaunch={() => setActiveScreen(concept.id)} />)}</div><div className="flex gap-4 mt-12"><button onClick={() => setShowMysteryDrop(true)} className="bg-yellow-500 text-black font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-yellow-400 transition-all animate-pulse">✨ Surprise Mystery Drop! ✨</button><button onClick={handleFeelingCurious} className="bg-teal-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-teal-400 transition-all">🧠 Feeling Curious?</button></div></div>);
};

// --- Challenge Modal ---
const ChallengeModal = ({ challenge, onClose, onComplete, setActiveScreen }) => {
    const [userAnswer, setUserAnswer] = useState('');
    const [isCorrect, setIsCorrect] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hint, setHint] = useState('');

    const checkAnswer = async () => {
        setIsLoading(true);
        const prompt = `A student was asked: "${challenge.question}". The expected answer is related to "${challenge.answer}". The student answered: "${userAnswer}". Is the student's answer correct or very close? Respond with only "yes" or "no".`;
        const result = await callGeminiTextAPI([{ role: 'user', parts: [{ text: prompt }] }]);
        if (result.toLowerCase().includes('yes')) {
            setIsCorrect(true);
            onComplete();
        } else {
            setIsCorrect(false);
        }
        setIsLoading(false);
    };
    
    const getHint = async () => {
        setIsLoading(true);
        const prompt = `A student is stuck on the question: "${challenge.question}". The answer is "${challenge.answer}". Provide a short, one-sentence hint that guides them to the answer without giving it away.`;
        const result = await callGeminiTextAPI([{ role: 'user', parts: [{ text: prompt }] }]);
        setHint(result);
        setIsLoading(false);
    };

    return (<Modal onClose={onClose}><h2 className="text-2xl font-bold text-yellow-400 mb-4">{challenge.title}</h2><p className="text-gray-300 mb-4 whitespace-pre-wrap">{challenge.question}</p>{isCorrect === null ? (<><textarea value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} rows="3" className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white" placeholder="Your answer..."></textarea>{hint && <p className="text-sm text-cyan-300 mt-2 italic">Hint: {hint}</p>}<div className="flex justify-between items-center mt-4"><button onClick={getHint} disabled={isLoading} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center disabled:bg-gray-700">{isLoading && <Spinner />}Get a Hint</button><button onClick={checkAnswer} disabled={isLoading} className="bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center disabled:bg-gray-500">{isLoading && <Spinner />}Check Answer</button></div></>) : isCorrect ? (<div className="text-center"><p className="text-green-400 font-bold text-lg">Correct! +20 XP!</p><p className="text-gray-300">Artifact Collected!</p>{challenge.chain && (<button onClick={() => {onClose(); setActiveScreen(challenge.chain);}} className="w-full mt-2 bg-teal-600 text-white font-bold py-2 rounded-lg">Explore this in {challenge.chain.replace(/-/g, ' ')}!</button>)}<button onClick={onClose} className="w-full mt-2 bg-purple-600 text-white font-bold py-2 rounded-lg">Continue</button></div>) : (<div className="text-center"><p className="text-red-400 font-bold text-lg">Not quite! The correct answer was: {challenge.answer}</p><button onClick={onClose} className="w-full mt-4 bg-gray-600 text-white font-bold py-2 rounded-lg">Try Again Later</button></div>)}</Modal>);
};

// --- Journal, Mystery Drop, Leaderboard ---
const PersonalCuriosityJournal = ({ journal, badges, onClose }) => (<Modal onClose={onClose}><h2 className="text-2xl font-bold text-purple-400 mb-6 text-center">My Curiosity Journal</h2><h3 className="font-semibold text-cyan-300 mb-2">Artifacts Collected</h3>{journal.length === 0 ? <p className="text-gray-400 text-center">Complete challenges to collect artifacts!</p> :<div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-48 overflow-y-auto">{journal.map((item, i) => (<div key={i} className="bg-gray-700/50 rounded-lg p-3 flex flex-col items-center text-center aspect-square justify-center"><div className="text-4xl mb-2">{item.icon}</div><p className="text-xs font-semibold">{item.title}</p></div>))}</div>}<h3 className="font-semibold text-cyan-300 mt-6 mb-2">Badges Earned</h3>{badges.length === 0 ? <p className="text-gray-400 text-center">Keep learning to earn badges!</p> : <div className="flex gap-4 justify-center">{badges.map((badge, i) => (<div key={i} className="text-4xl" title={badge.title}>{badge.icon}</div>))}</div>}</Modal>);
const MysteryDropModal = ({ onClose, addArtifact }) => {
    const [mystery, setMystery] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const generateMystery = async () => {
            const prompt = `Create a "mystery drop" for a student. Describe a strange, single object. Provide a "title" and a one-sentence "description". Return as a JSON object.`;
            const schema = { type: "OBJECT", properties: { title: {type: "STRING"}, description: {type: "STRING"} } };
            const result = await callGeminiJsonAPI(prompt, schema);
            if (result) setMystery({ ...result, imageUrl: `https://source.unsplash.com/500x300/?${encodeURIComponent(result.title)}` });
            setIsLoading(false);
        };
        generateMystery();
    }, []);
    const handleCollect = () => { addArtifact({ title: mystery.title, icon: "❓" }); onClose(); };
    return (<Modal onClose={onClose}><h2 className="text-2xl font-bold text-yellow-400 mb-4 text-center">Mystery Drop!</h2>{isLoading ? <div className="flex justify-center items-center h-48"><Spinner /></div> : mystery && (<div className="text-center"><img src={mystery.imageUrl} alt={mystery.title} className="w-full h-48 object-cover rounded-lg mb-4" /><h3 className="text-xl font-semibold mb-2">{mystery.title}</h3><p className="text-gray-300 mb-6">{mystery.description}</p><button onClick={handleCollect} className="w-full bg-purple-600 font-bold py-2 rounded-lg">Collect Mystery Artifact (+10 XP)</button></div>)}</Modal>);
};
const LeaderboardModal = ({ onClose, userStats, leaderboardData }) => {
    const leaders = [...leaderboardData];
    const userOnBoard = leaders.find(l => l.id === userStats.id);
    if (!userOnBoard) {
        leaders.push({ ...userStats, name: 'You' });
    }
    leaders.sort((a, b) => b.xp - a.xp);
    
    return (<Modal onClose={onClose}><h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">🏆 Leaderboard 🏆</h2><div className="space-y-3">{leaders.slice(0, 10).map((leader, i) => (<div key={i} className={`flex justify-between items-center p-3 rounded-lg ${leader.id === userStats.id ? 'bg-cyan-500/30 border-cyan-500 border' : 'bg-gray-700/50'}`}><p className="font-bold text-lg">{i+1}. {leader.name || 'Anonymous'}</p><p className="font-semibold text-yellow-400">{leader.xp} XP</p></div>))}</div></Modal>);
};

// --- Time-Travel Teacher ---
const EraCard = ({ era, onSelect }) => (<div onClick={() => onSelect(era)} className="relative rounded-2xl overflow-hidden cursor-pointer group transform hover:-translate-y-2 transition-transform duration-300 shadow-lg"><img src={era.image} alt={era.name} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors duration-300 flex flex-col justify-end p-4"><img src={era.avatar} alt={era.character} className="w-24 h-24 object-cover rounded" /><h3 className="text-white text-2xl font-bold">{era.name}</h3><p className="text-gray-200">{era.character}</p></div></div>);
const ChatBubble = ({ message, eraStyle }) => {
    const isUser = message.sender === 'user'; const isTyping = message.text === '...'; const baseStyle = "max-w-md lg:max-w-lg p-4 rounded-2xl mb-4 shadow-md transition-all"; const userStyle = "bg-cyan-500 text-white self-end rounded-br-none"; const parchmentStyle = "bg-amber-100 border-2 border-amber-300 text-amber-900 self-start rounded-bl-none font-serif"; const holographicStyle = "bg-blue-900/70 border border-cyan-400 text-cyan-200 self-start rounded-bl-none backdrop-blur-sm shadow-cyan-500/20"; const aiStyle = eraStyle === 'holographic' ? holographicStyle : parchmentStyle;
    return (<div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}><div className={`${baseStyle} ${isUser ? userStyle : aiStyle}`}>{isTyping ? (<div className="flex items-center justify-center space-x-1"><span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></span><span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></span><span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></span></div>) : (<p className="text-sm">{message.text}</p>)}</div></div>);
};
const TimeTravelTeacher = ({ onBack, gradeLevel, addArtifact, setActiveScreen }) => {
    const [currentEra, setCurrentEra] = useState(null); const [messages, setMessages] = useState([]); const [input, setInput] = useState(''); const [isLoading, setIsLoading] = useState(false); const [challenge, setChallenge] = useState(null);
    const eras = [
        {
              id: 'ramanujan',
              name: 'British India',
              character: 'Srinivasa Ramanujan',
              avatar: '/avatars/ramanujan.jpg',
            style: 'parchment', 
            image: 'https://1.bp.blogspot.com/-B1DPbDYoYKo/X-DvAnhU5iI/AAAAAAAAHe8/Aq2WoabHl1Io4f2n9-aJpO3Gjmg5QUL5gCLcBGAsYHQ/s820/Ramanujan1.png', 
            challengePrompt: "Create a simple math puzzle about number patterns or infinity. Provide a question and the answer.", 
            artifactIcon: "♾️" 
        },
        {
              id: 'cvraman',
              name: '20th Century India',
              character: 'C.V. Raman',
              avatar: '/avatars/cvraman.jpg',
            style: 'parchment', 
            image: 'https://www.thefamouspeople.com/profiles/images/c-v-raman-2.jpg', 
            challengePrompt: "Create a simple physics question about light or sound. Provide a question and the answer.", 
            artifactIcon: "💡" 
        },
        {
              id: 'kalam',
              name: 'Modern India',
              character: 'Dr. A.P.J. Abdul Kalam',
              avatar: '/avatars/kalam.jpg',
            style: 'holographic', 
            image: 'https://tse2.mm.bing.net/th/id/OIP.g5fP7mkyJfjGr8WYShMErQHaFS?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', 
            challengePrompt: "Create an inspiring question about science, dreams, or the future of India. Provide a question and a thoughtful answer.", 
            artifactIcon: "🚀" 
        },
        {
              id: 'einstein',
              name: '20th Century Science',
              character: 'Albert Einstein',
              avatar: '/avatars/einstein.jpg',
            style: 'parchment', 
            image: 'https://1.bp.blogspot.com/-eeYOiXwnehw/X3Rvi4Od0RI/AAAAAAAAA4U/94PRVjVnyKUE_R5Z5B05_IJqiDK2gnA2ACLcBGAsYHQ/s1920/Albert%2BEinstein%2Bneelcrew.jpg', 
            challengePrompt: "Create a simple physics puzzle about relativity or gravity. Provide a question and the answer.", 
            artifactIcon: "🔬" 
        },
        { 
            id: 'aryabhata', 
            name: 'Gupta Empire', 
            character: 'Aryabhata', 
            avatar: '/avatars/aryabhata.jpg',
            style: 'parchment', 
            image: 'https://www.thefamouspeople.com/profiles/images/aryabhata-5.jpg', 
            challengePrompt: "Create a simple number puzzle based on Aryabhata's work. Provide a question and the answer.", 
            artifactIcon: "➗" 
        }
    ];
    useEffect(() => { if (currentEra) setMessages([{ sender: 'ai', text: `Greetings! I am ${currentEra.character}. What would you like to know?` }]) }, [currentEra]);
    const handleSend = async (text) => {
        if (!text.trim() || isLoading) return;
        const newMessages = [...messages, { sender: 'user', text }];
        setMessages([...newMessages, { sender: 'ai', text: '...' }]); setInput(''); setIsLoading(true);
        const systemInstruction = { role: 'user', parts: [{ text: `**System Instruction:** You are roleplaying as ${currentEra.character}. Stay in character. Your language should be simple enough for a student in grades ${gradeLevel}. If a user mentions a modern concept, act confused. Respond to the student's latest message based on the entire conversation history.` }] };
        const instructionFollowUp = { role: 'model', parts: [{ text: `I understand. I am ${currentEra.character}. I will speak to the student.` }] };
        const conversationHistory = newMessages.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] }));
        const apiContents = [systemInstruction, instructionFollowUp, ...conversationHistory];
        const aiResponse = await callGeminiTextAPI(apiContents);
        setMessages([...newMessages, { sender: 'ai', text: aiResponse }]); setIsLoading(false);
        if (newMessages.filter(m => m.sender === 'user').length === 2) generateChallenge();
    };
    const generateChallenge = async () => {
        const prompt = `For a student in grades ${gradeLevel}, create a challenge based on ${currentEra.character}. ${currentEra.challengePrompt}. Return a JSON object with "title", "question", and "answer" fields.`;
        const schema = { type: "OBJECT", properties: { title: { type: "STRING" }, question: { type: "STRING" }, answer: { type: "STRING" } } };
        const result = await callGeminiJsonAPI(prompt, schema);
        if (result) setChallenge(result);
    };
    if (!currentEra) return (
        <div className="min-h-screen bg-gray-900/95 backdrop-blur-md p-8">
            <BackButton onClick={onBack} />
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
                        Time Travel Portal
                    </h2>
                    <p className="text-gray-300 text-lg">Choose a time period to begin your journey</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                    {eras.map(era => (
                        <div key={era.id} className="relative group h-[400px]">
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent rounded-2xl" />
                            <img 
                                src={era.image} 
                                alt={era.name} 
                                className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 p-6 flex flex-col justify-end rounded-2xl transition-colors duration-300">
                                <img 
                                    src={era.avatar} 
                                    alt={era.character} 
                                    className="w-24 h-24 object-cover rounded" 
                                />
                                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                                    {era.name}
                                </h3>
                                <p className="text-gray-300 text-lg mb-4">
                                    {era.character}
                                </p>
                                <button
                                    onClick={() => setCurrentEra(era)}
                                    className="w-full bg-gray-800/80 hover:bg-cyan-600 text-white font-semibold py-3 px-4 rounded-lg backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
                                >
                                    Begin Journey
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
    return (<div className="min-h-screen bg-gray-800 text-white font-sans flex flex-col">{challenge && <ChallengeModal challenge={challenge} onClose={() => setChallenge(null)} onComplete={() => addArtifact({ title: challenge.title, icon: currentEra.artifactIcon })} setActiveScreen={setActiveScreen} />}<header className="bg-gray-900/80 backdrop-blur-sm p-4 flex items-center justify-between shadow-lg z-10 border-b border-gray-700"><button onClick={() => setCurrentEra(null)} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>Back</button><div className="text-center"><h2 className="text-xl font-bold">{currentEra.character}</h2><p className="text-sm text-gray-400">{currentEra.name}</p></div><div className="w-24"></div></header><main className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col-reverse"><div className="flex flex-col">{messages.slice().reverse().map((msg, index) => <ChatBubble key={index} message={msg} eraStyle={currentEra.style} />)}</div></main><footer className="bg-gray-900/80 p-4 backdrop-blur-sm border-t border-gray-700"><div className="max-w-4xl mx-auto"><form onSubmit={(e) => {e.preventDefault(); handleSend(input)}} className="flex items-center gap-4"><img src={currentEra.avatar} alt={currentEra.character} className="w-12 h-12 rounded-full border-2 border-gray-600"/><input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Ask ${currentEra.character} a question...`} className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white" disabled={isLoading} /><button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg p-3 disabled:bg-gray-600" disabled={isLoading}>{isLoading ? <Spinner /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}</button></form></div></footer></div>);
};

// --- Concept Swapper ---
const DomainIcon = ({ icon, label, isSelected, onSelect }) => (<div onClick={onSelect} className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${isSelected ? 'border-cyan-400 bg-cyan-900/50' : 'border-gray-700 bg-gray-800/60 hover:border-cyan-500/50'}`}><div className={`text-4xl mb-2 ${isSelected ? 'text-cyan-400' : 'text-gray-400'}`}>{icon}</div><span className="text-sm font-semibold">{label}</span></div>);
const ConceptSwapper = ({ onBack, gradeLevel, addArtifact }) => {
    const [selectedConcept, setSelectedConcept] = useState(''); const [selectedDomain, setSelectedDomain] = useState(null); const [analogy, setAnalogy] = useState(''); const [evaluation, setEvaluation] = useState(''); const [isLoading, setIsLoading] = useState({ generate: false, evaluate: false });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const topics = {
        "Science (Grades 3-5)": ["The Water Cycle", "Living and Non-Living Things", "Parts of a Plant", "Solar System"],
        "Science (Grades 6-8)": ["Photosynthesis", "Gravity", "Electricity", "Structure of an Atom", "Plate Tectonics"],
        "Mathematics (Grades 3-5)": ["Fractions", "Multiplication", "Place Value", "Basic Geometry"],
        "Mathematics (Grades 6-8)": ["Pythagorean Theorem", "Algebraic Expressions", "Probability", "Ratios and Proportions"],
        "Social Studies (Grades 3-8)": ["Democracy", "Supply and Demand", "The Silk Road", "Ancient Civilizations"]
    };
    const domains = [{ id: 'cooking', icon: '🍳', label: 'Cooking' }, { id: 'gardening', icon: '🌿', label: 'Gardening' }, { id: 'home', icon: '🏠', label: 'Daily Life' }, { id: 'sports', icon: '🏀', label: 'Sports' }];
    const handleGenerate = async () => {
        if (!selectedDomain || !selectedConcept) return;
        setIsLoading({ ...isLoading, generate: true }); setAnalogy(''); setEvaluation('');
        const prompt = `For a student in grades ${gradeLevel}, generate a short, simple, and creative analogy for the concept of '${selectedConcept}'. The analogy must be from the domain of '${selectedDomain}'. Start the analogy directly, without any introductory phrases.`;
        const generatedAnalogy = await callGeminiTextAPI([{ role: 'user', parts: [{ text: prompt }] }]);
        setAnalogy(generatedAnalogy); setIsLoading({ ...isLoading, generate: false });
    };
    const handleEvaluate = async () => {
        if (!analogy || !selectedConcept) return;
        setIsLoading({ ...isLoading, evaluate: true }); setEvaluation('');
        const prompt = `A student in grades ${gradeLevel} wrote an analogy to explain '${selectedConcept}': "${analogy}". Briefly evaluate this analogy. Is it clear and creative? Provide one positive point and one simple suggestion for improvement.`;
        const aiEvaluation = await callGeminiTextAPI([{ role: 'user', parts: [{ text: prompt }] }]);
        setEvaluation(aiEvaluation); setIsLoading({ ...isLoading, evaluate: false });
        addArtifact({ title: `Analogy for ${selectedConcept}`, icon: "💡" });
    };
    return (<div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-sans"><BackButton onClick={onBack} /><div className="max-w-4xl mx-auto"><div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700"><h1 className="text-3xl font-bold text-cyan-400 mb-2">Concept Swapper Challenge</h1><p className="text-gray-300 mb-6">Explain a school subject using a fun, unrelated analogy.</p><div className="bg-gray-900 p-4 rounded-lg mb-6 relative"><p className="text-sm text-gray-400">SUBJECT TO EXPLAIN:</p><input type="text" value={selectedConcept} onChange={(e) => setSelectedConcept(e.target.value)} onFocus={() => setIsDropdownOpen(true)} onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} placeholder="Search or select a topic..." className="bg-transparent text-xl font-semibold w-full focus:outline-none mt-1" />{isDropdownOpen && (<div className="absolute top-full left-0 w-full bg-gray-800 border border-gray-700 rounded-lg mt-2 z-10 max-h-60 overflow-y-auto">{Object.keys(topics).map(category => (<div key={category}><h4 className="text-gray-400 text-sm font-bold p-2 sticky top-0 bg-gray-800">{category}</h4>{topics[category].map(topic => (<div key={topic} className="p-2 hover:bg-cyan-500/20 cursor-pointer" onMouseDown={() => { setSelectedConcept(topic); setIsDropdownOpen(false); }}>{topic}</div>))}</div>))}</div>)}</div><p className="font-semibold mb-4">1. Choose your analogy style:</p><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">{domains.map(d => <DomainIcon key={d.id} {...d} isSelected={selectedDomain === d.label} onSelect={() => setSelectedDomain(d.label)} />)}</div><p className="font-semibold mb-4">2. Write your creative explanation:</p><textarea value={analogy} onChange={(e) => setAnalogy(e.target.value)} rows="5" className="w-full bg-gray-700 border border-gray-600 rounded-lg p-4 text-white" placeholder={isLoading.generate ? "Generating analogy..." : "Click 'Generate Analogy' or write your own!"} disabled={isLoading.generate}></textarea><div className="flex items-center justify-between mt-4"><button onClick={handleGenerate} className="bg-purple-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-purple-700 flex items-center disabled:bg-purple-800" disabled={isLoading.generate || !selectedDomain || !selectedConcept}>{isLoading.generate && <Spinner />}Generate Analogy</button><button onClick={handleEvaluate} className="bg-cyan-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-cyan-600 flex items-center disabled:bg-cyan-800" disabled={isLoading.evaluate || !analogy}>{isLoading.evaluate && <Spinner />}Evaluate & Collect</button></div>{evaluation && (<div className="mt-6 bg-gray-900/70 p-4 rounded-lg border border-gray-700"><h3 className="font-semibold text-cyan-300 mb-2">AI Feedback</h3><p className="text-sm text-gray-300 whitespace-pre-wrap">{evaluation}</p></div>)}</div></div></div>);
};

// --- Mind Symphony ---
const MindSymphony = ({ onBack, gradeLevel, addArtifact }) => {
    const [notes, setNotes] = useState("The digestive system helps us break down food. It starts in the mouth where we chew. The food then goes down to the stomach. In the stomach, acids and enzymes digest the food more. Finally, the small intestine absorbs nutrients for our body.");
    const [keyPoints, setKeyPoints] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [fullTextToSpeak, setFullTextToSpeak] = useState('');
    const [challenge, setChallenge] = useState(null);
    const colors = ['#38BDF8', '#F472B6', '#A78BFA', '#4ADE80', '#FBBF24'];

    useEffect(() => {
        // Clean up speech synthesis when component unmounts
        return () => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const handleConvert = async () => {
        if (!notes.trim() || isLoading) return;
        setIsLoading(true);
        setKeyPoints([]);
        setSpeaking(false);
        window.speechSynthesis.cancel(); // Stop any ongoing speech

        const prompt = `Analyze these study notes for a student in grades ${gradeLevel} and extract the main key points. Return a concise list, each point on a new line. Notes: "${notes}"`;
        const result = await callGeminiTextAPI([{ role: 'user', parts: [{ text: prompt }] }]);
        const points = result.split('\n').filter(p => p.trim() !== '').map((p, i) => ({ text: p, color: colors[i % colors.length] }));
        setKeyPoints(points);
        const fullText = points.map(p => p.text).join('. ');
        setFullTextToSpeak(fullText);
        setIsLoading(false);
    };

    const handlePlay = () => {
        if (!window.speechSynthesis) {
            alert('Text-to-speech not supported in this browser');
            return;
        }
        if (!fullTextToSpeak || speaking) return;

        const utterance = new SpeechSynthesisUtterance(fullTextToSpeak);
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => {
            setSpeaking(false);
            generateChallenge(); // Trigger challenge after speech ends
        };
        utterance.onerror = (event) => {
            console.error('[MindSymphony] Speech synthesis error:', event.error);
            setSpeaking(false);
            alert('Speech synthesis not supported. Try using Chrome or Edge browser.');
        };
        window.speechSynthesis.speak(utterance);
    };

    const handlePause = () => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            setSpeaking(false);
        }
    };

    const generateChallenge = async () => {
        const prompt = `Based on these notes about the digestive system, create a simple multiple-choice question for a student in grades ${gradeLevel}. Return a JSON object with "title", "question", and "answer" (the correct choice).`;
        const schema = { type: "OBJECT", properties: { title: { type: "STRING" }, question: { type: "STRING" }, answer: { type: "STRING" } } };
        const result = await callGeminiJsonAPI(prompt, schema);
        if (result) setChallenge(result);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-sans flex items-center justify-center">
            <BackButton onClick={onBack} />
            {challenge && <ChallengeModal challenge={challenge} onClose={() => setChallenge(null)} onComplete={() => addArtifact({ title: "Digestive System", icon: "🎵" })} />}
            <div className="w-full max-w-4xl bg-gray-800/50 p-8 rounded-2xl border border-gray-700 shadow-2xl">
                <h1 className="text-3xl font-bold text-center text-purple-400 mb-2">Mind Symphony</h1>
                <p className="text-gray-300 text-center mb-8">Turn your study notes into a real audio memory track.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Your Notes</h2>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows="10"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-4 text-white"
                            placeholder="Enter your study notes here..."
                        ></textarea>
                        <button
                            onClick={handleConvert}
                            className="w-full mt-4 bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center disabled:bg-purple-800"
                            disabled={isLoading}
                        >
                            {isLoading && <Spinner />}
                            {isLoading ? 'Generating...' : 'Generate Audio Track'}
                        </button>
                    </div>
                    <div className={`transition-opacity duration-500 ${keyPoints.length > 0 || isLoading ? 'opacity-100' : 'opacity-40'}`}>
                        <h2 className="text-xl font-semibold mb-4">Memory Track</h2>
                        <div className="flex items-center justify-center gap-4 my-4">
                            <button
                                onClick={handlePlay}
                                disabled={!fullTextToSpeak || speaking}
                                className="bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-600 disabled:bg-gray-600"
                            >
                                Play
                            </button>
                            <button
                                onClick={handlePause}
                                disabled={!speaking}
                                className="bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-500 disabled:bg-gray-700"
                            >
                                Pause
                            </button>
                        </div>
                        <div className="h-40 overflow-y-auto bg-gray-900/50 p-3 rounded-lg space-y-2">
                            {isLoading && <p className="text-sm text-gray-500 text-center pt-12">AI is generating audio...</p>}
                            {!isLoading && keyPoints.length > 0 && keyPoints.map((point, i) => (
                                <div key={i} className={`flex items-center gap-3 p-2 rounded-md`}>
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: point.color }}></div>
                                    <p className="text-sm text-gray-300">{point.text}</p>
                                </div>
                            ))}
                            {!isLoading && keyPoints.length === 0 && <p className="text-sm text-gray-500 text-center pt-12">Generate an audio track to see key points...</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Curiosity Quests ---
const CuriosityQuests = ({ onBack, gradeLevel, addArtifact, initialTopic }) => {
    const [topic, setTopic] = useState(initialTopic || "Dinosaurs"); const [quest, setQuest] = useState(null); const [isLoading, setIsLoading] = useState(false); const [currentStep, setCurrentStep] = useState(0);
    
    const generateQuest = async (e) => {
        if(e) e.preventDefault(); 
        if (!topic.trim()) return;
        setIsLoading(true); setQuest(null); setCurrentStep(0);
        const prompt = `Create a short, 4-step fictional learning adventure for a student in grades ${gradeLevel} about "${topic}". For each step, provide a "story" part (a few sentences of simple, exciting narrative). Return the result as a JSON object with "title" and a "quest_steps" array of objects, where each object has a "story" field.`;
        const schema = { type: "OBJECT", properties: { title: { type: "STRING" }, quest_steps: { type: "ARRAY", items: { type: "OBJECT", properties: { story: { type: "STRING" } }, required: ["story"] } } }, required: ["title", "quest_steps"] };
        const questData = await callGeminiJsonAPI(prompt, schema);
        if (questData && questData.quest_steps) {
            const stepsWithImages = questData.quest_steps.map(step => ({ ...step, imageUrl: `https://source.unsplash.com/800x600/?${encodeURIComponent(topic)},${encodeURIComponent(step.story.split(' ')[0])}` }));
            setQuest({ ...questData, quest_steps: stepsWithImages });
        setIsLoading(false);
        }
    };
    const handleNext = () => { if (quest && currentStep < quest.quest_steps.length - 1) { setCurrentStep(currentStep + 1); } else { addArtifact({ title: quest.title, icon: "🗺️" }); } };
    return (<div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-sans flex items-center justify-center relative"><BackButton onClick={onBack} /><div className="w-full max-w-2xl bg-gray-800/50 p-6 sm:p-8 rounded-2xl border border-gray-700 shadow-2xl">{!quest && !isLoading ? (<div className="text-center"><h1 className="text-2xl font-bold text-cyan-400 mb-2">Curiosity Quest</h1><p className="text-gray-400 mb-6">Enter a topic to start a unique, AI-generated adventure!</p><form onSubmit={generateQuest} className="flex gap-4"><input type="text" value={topic} onChange={e => setTopic(e.target.value)} className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white" placeholder="e.g., Dinosaurs, The Solar System..." /><button type="submit" className="bg-cyan-500 text-white font-bold py-2 px-8 rounded-lg hover:bg-cyan-600">Start Quest</button></form></div>) : (<>{<div className="flex justify-between items-center mb-4"><h1 className="text-2xl font-bold text-cyan-400">{isLoading ? "Generating Quest..." : quest.title}</h1><button onClick={() => setQuest(null)} className="text-sm text-gray-400 hover:text-white">New Quest</button></div>}<div className="w-full bg-gray-700 rounded-full h-2.5 mb-6"><div className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${quest ? (currentStep + 1) / quest.quest_steps.length * 100 : 0}%` }}></div></div><div className="relative h-96">{isLoading ? (<div className="flex flex-col items-center justify-center h-full"><Spinner /><p className="mt-4">Building your adventure...</p></div>) : quest.quest_steps.map((step, index) => (<div key={index} className={`absolute inset-0 transition-opacity duration-700 ${index === currentStep ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}><div className="w-full h-full flex flex-col"><img src={step.imageUrl} alt={topic} className="w-full h-56 object-cover rounded-t-lg bg-gray-700" /><div className="bg-gray-900/50 p-4 rounded-b-lg flex-grow flex items-center"><p className="text-gray-200 text-lg">{step.story}</p></div></div></div>))}</div><div className="mt-6 flex justify-between items-center"><p className="text-sm text-gray-400">Step {currentStep + 1} of {quest?.quest_steps?.length || 4}</p>{currentStep < (quest?.quest_steps?.length || 4) - 1 ? (<button onClick={handleNext} className="bg-cyan-500 text-white font-bold py-2 px-8 rounded-lg hover:bg-cyan-600">Next</button>) : (<p className="text-yellow-400 font-bold">Quest Complete! Artifact Collected!</p>)}</div></>)}</div></div>);
};


// --- Placeholder screens ---
const ValidatedExplainer = ({ onBack, gradeLevel }) => (
  <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
    <BackButton onClick={onBack} />
    <h1 className="text-3xl font-bold text-cyan-400">Validated Explainer</h1>
    <p className="text-gray-400 mt-2">Coming soon for grade level {gradeLevel}.</p>
  </div>
);

const TeacherDashboard = ({ onBack }) => (
  <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
    <BackButton onClick={onBack} />
    <h1 className="text-3xl font-bold text-purple-400">Teacher Dashboard</h1>
    <p className="text-gray-400 mt-2">Coming soon.</p>
  </div>
);

// --- Main App Component ---
const App = () => {
    const [activeScreen, setActiveScreen] = useState('dashboard');
    const [gradeLevel, setGradeLevel] = useState('6-8');
    const [journal, setJournal] = useState([]);
    const [badges, setBadges] = useState([]);
    const [userStats, setUserStats] = useState({ xp: 980, streak: 3 });
    const [showJournal, setShowJournal] = useState(false);
    const [showMysteryDrop, setShowMysteryDrop] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [curiousTopic, setCuriousTopic] = useState(null);
    const [initialQuestTopic, setInitialQuestTopic] = useState("Dinosaurs");

    const addArtifactToJournal = (artifact) => {
        setJournal(prev => [...prev, artifact]);
        setUserStats(prev => ({ ...prev, xp: prev.xp + 20, streak: prev.streak + 1 }));
        checkBadges({ ...artifact, journalSize: journal.length + 1 });
    };

    const checkBadges = (info) => {
        const newBadges = [];
        if (info.journalSize === 1 && !badges.find(b => b.id === 'first')) newBadges.push({id: 'first', title: 'First Artifact!', icon: '🥇'});
        if (info.journalSize === 5 && !badges.find(b => b.id === 'five')) newBadges.push({id: 'five', title: 'Collector!', icon: '🏆'});
        if (newBadges.length > 0) setBadges(prev => [...prev, ...newBadges]);
    };

    const startCuriosityQuestFromSuggestion = (topic) => {
        setInitialQuestTopic(topic);
        setActiveScreen('curiosity-quests');
        setCuriousTopic(null);
    };

    const renderScreen = () => {
        switch (activeScreen) {
            case 'time-travel-teacher': return <TimeTravelTeacher onBack={() => setActiveScreen('dashboard')} gradeLevel={gradeLevel} addArtifact={addArtifactToJournal} setActiveScreen={setActiveScreen} />;
            case 'concept-swapper': return <ConceptSwapper onBack={() => setActiveScreen('dashboard')} gradeLevel={gradeLevel} addArtifact={addArtifactToJournal} />;
            case 'mind-symphony': return <MindSymphony onBack={() => setActiveScreen('dashboard')} gradeLevel={gradeLevel} addArtifact={addArtifactToJournal} />;
            case 'curiosity-quests': return <CuriosityQuests onBack={() => setActiveScreen('dashboard')} gradeLevel={gradeLevel} addArtifact={addArtifactToJournal} initialTopic={initialQuestTopic} />;
            case 'validated-explainer': return <ValidatedExplainer onBack={() => setActiveScreen('dashboard')} gradeLevel={gradeLevel} />;
            case 'teacher-dashboard': return <TeacherDashboard onBack={() => setActiveScreen('dashboard')} />;
            default: return <Dashboard setActiveScreen={setActiveScreen} setGradeLevel={setGradeLevel} gradeLevel={gradeLevel} setShowJournal={setShowJournal} setShowMysteryDrop={setShowMysteryDrop} userStats={userStats} setShowLeaderboard={setShowLeaderboard} setCuriousTopic={setCuriousTopic} />;
        }
    };

    return (
      <div className="antialiased">
        {renderScreen()}
        {showJournal && <PersonalCuriosityJournal journal={journal} badges={badges} onClose={() => setShowJournal(false)} />}
        {showMysteryDrop && <MysteryDropModal onClose={() => setShowMysteryDrop(false)} addArtifact={addArtifactToJournal} />}
        {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} userStats={userStats} />}
        {curiousTopic && (
          <Modal onClose={() => setCuriousTopic(null)}>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-teal-400 mb-4">Feeling Curious?</h2>
              <p className="text-gray-300 mb-6">How about starting a quest on the topic of...</p>
              <p className="text-xl font-bold text-white mb-6">{curiousTopic}</p>
              <button
                onClick={() => startCuriosityQuestFromSuggestion(curiousTopic)}
                className="w-full bg-teal-500 font-bold py-2 rounded-lg"
              >
                Start Quest!
              </button>
            </div>
          </Modal>
        )}
      </div>
    );
};

export default App;

