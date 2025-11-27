import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Share2, Zap, Brain, Grid, ChevronRight, X, Palette, Eye, Link as LinkIcon, Check, Copy, Download, ExternalLink } from 'lucide-react';
import { toPng } from 'html-to-image';

/* FONTS & GLOBAL STYLES 
  We inject a Google Font 'Fredoka' for that round, cartoony feel.
*/
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@300;500;700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

const GlobalStyles = () => (
  <style>{`
    body {
      font-family: 'Fredoka', sans-serif;
      background-color: #FFFbeb;
      overflow-x: hidden;
    }
    .cartoon-shadow {
      box-shadow: 6px 6px 0px 0px rgba(0,0,0,1);
    }
    .cartoon-shadow-sm {
      box-shadow: 3px 3px 0px 0px rgba(0,0,0,1);
    }
    .cartoon-shadow-hover:active {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0px 0px rgba(0,0,0,1);
    }
    .wiggle {
      animation: wiggle 2s linear infinite;
    }
    @keyframes wiggle {
      0%, 7% { transform: rotateZ(0); }
      15% { transform: rotateZ(-5deg); }
      20% { transform: rotateZ(3deg); }
      25% { transform: rotateZ(-5deg); }
      30% { transform: rotateZ(2deg); }
      35%, 100% { transform: rotateZ(0); }
    }
    .target-appear {
      animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes popIn {
      from { transform: scale(0); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .modal-overlay {
      background-color: rgba(0, 0, 0, 0.5);
      animation: fadeIn 0.2s ease-out;
    }
    .modal-content {
      animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleUp {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `}</style>
);

/* CONSTANTS & DATA */
// --- TASK 1: FIXED IMAGE URLs ---
// Using placeholder links for safety and providing a fallback image in case the ibb.co links fail.
const MEME_URLS = {
  // Mamadani and Trump meme by @whocaresbilly (Intro Screen)
  whocaresbilly: "https://i.ibb.co/wFtQGZdv/whocaresbilly.jpg",
  // Patrick brain rot meme by HIMUVI (High Score)
  himuvi: "https://i.ibb.co/6JHSg2LD/HIMUVI.jpg",
  // brain rot meme by OutsideScaresMe (Low Score)
  outsidescaresme: "https://i.ibb.co/v6pW3yLD/Outside-Scares-Me.jpg",
  // memory loss meme by Jamminmb (Mid Score)
  jamminmb: "https://i.ibb.co/5Xt5ydjX/Jamminmb.jpg",
};

// Fallback image URL for broken links
const PLACEHOLDER_IMAGE = "https://placehold.co/600x400/805ad5/ffffff?text=Meme+Loading+Error&font=fredoka";

const MEMES = {
  intro: { url: MEME_URLS.whocaresbilly, citation: "Meme by u/whocaresbilly", fallback: PLACEHOLDER_IMAGE },
  highScore: { url: MEME_URLS.himuvi, citation: "Meme by u/HIMUVI", fallback: PLACEHOLDER_IMAGE },
  lowScore: { url: MEME_URLS.outsidescaresme, citation: "Meme by u/OutsideScaresMe", fallback: PLACEHOLDER_IMAGE },
  midScore: { url: MEME_URLS.jamminmb, citation: "Meme by u/Jamminmb", fallback: PLACEHOLDER_IMAGE },
};

const BRAIN_TYPES = [
  { threshold: 85, label: "Lightning CPU", desc: "You calculate faster than my GPU!", color: "bg-purple-300" },
  { threshold: 70, label: "Fast Thinker", desc: "Sharp, quick, and dangerous.", color: "bg-blue-300" },
  { threshold: 55, label: "Balanced Brain", desc: "Solid performance. Very human.", color: "bg-green-300" },
  { threshold: 35, label: "Golden Retriever", desc: "Just happy to be here!", color: "bg-yellow-300" },
  { threshold: 0, label: "Slow Mode", desc: "Loading... still loading...", color: "bg-red-300" }
];

/* UI COMPONENTS */
const Card = ({ children, className = "", color = "bg-white", id }) => (
  <div id={id} className={`border-4 border-black rounded-3xl p-6 cartoon-shadow ${color} ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = "primary", className = "", disabled = false }) => {
  const colors = {
    primary: "bg-blue-400 hover:bg-blue-500 text-white",
    secondary: "bg-pink-400 hover:bg-pink-500 text-white",
    outline: "bg-white hover:bg-gray-100 text-black",
    danger: "bg-red-500 text-white"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        border-4 border-black rounded-xl px-6 py-3 font-bold text-lg 
        transition-transform duration-100 cartoon-shadow-sm cartoon-shadow-hover
        disabled:opacity-50 disabled:cursor-not-allowed
        ${colors[variant]} ${className}
      `}
    >
      {children}
    </button>
  );
};

/* SHARE MODAL COMPONENT */
const ShareModal = ({ isOpen, onClose, result }) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  // --- TASK 2: UPDATED SHARE TEXT ---
  // The share URL is static (links to the app), but the text is customized.
  const shareUrl = window.location.href;
  const shareText = `I scored ${result.score}% on RateMyBrain! Diagnosis: ${result.label} 🧠 Test your brain power here: ${shareUrl}`;

  const handleCopyText = () => {
    // Copy the entire share message, including score and link
    const textArea = document.createElement("textarea");
    textArea.value = shareText;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);

    const element = document.getElementById('result-card');
    if (element) {
      toPng(element, { cacheBust: true })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `RateMyBrain_${result.label.replace(/\s/g, '_')}.png`;
          link.href = dataUrl;
          link.click();
          setDownloading(false);
        })
        .catch((err) => {
          console.error('Capture failed:', err);
          setDownloading(false);
        });
    } else {
      setDownloading(false);
    }
  };

  const socialPlatforms = [
    {
      name: 'X / Twitter',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, // Note: URL is included in the text now
      color: 'bg-black text-white',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
    },
    {
      name: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
      color: 'bg-blue-600 text-white',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
    },
    {
      name: 'Reddit',
      url: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
      color: 'bg-orange-500 text-white',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" /></svg>
    },
    {
      name: 'LinkedIn',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`,
      color: 'bg-blue-700 text-white',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="bg-white rounded-3xl border-4 border-black w-full max-w-md p-6 relative cartoon-shadow modal-content">
        <button onClick={onClose} className="absolute top-4 right-4 hover:bg-gray-100 p-2 rounded-full">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-black mb-1">Share Results</h2>
        <p className="text-gray-600 mb-6 font-medium">Show the world your big brain!</p>

        {/* Copy Link Section - Now copies the full text */}
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">Copy Share Message</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-500 truncate flex items-center gap-2">
              <Copy size={16} />
              {shareText.substring(0, 40)}...
            </div>
            <button
              onClick={handleCopyText}
              className={`px-4 rounded-xl border-2 border-black font-bold transition-all ${copied ? 'bg-green-400 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Copies score, diagnosis, and app link.</p>
        </div>

        {/* Download Card Section */}
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2">Save Image Card (Recommended)</label>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full bg-pink-400 hover:bg-pink-500 text-white border-2 border-black rounded-xl py-3 font-bold flex items-center justify-center gap-2 cartoon-shadow-hover transition-transform active:translate-y-0.5 disabled:opacity-50"
          >
            {downloading ? (
              <span className="animate-pulse">Generating Image...</span>
            ) : (
              <>
                <Download size={20} /> Download Result Card
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 mt-1">Saves a high-quality PNG of your result card for social media.</p>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {socialPlatforms.map((platform) => (
            <a
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${platform.color} flex items-center justify-center gap-2 py-3 rounded-xl font-bold border-2 border-black cartoon-shadow-hover transition-transform hover:-translate-y-0.5`}
            >
              {platform.icon}
              {platform.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

/* UI COMPONENTS (ScoreRow, located here since Card and Button were already defined above) */

const ScoreRow = ({ label, score, icon }) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-2 text-gray-700 font-bold">
      {icon} {label}
    </div>
    <div className="font-black">
      {score}/100
    </div>
  </div>
);

/* GAME COMPONENTS */
// These components (ReactionGame, PatternGame, NumberGame, StroopGame, ChimpGame, AimGame) remain the same.

/* GAME 1: REACTION TEST */
const ReactionGame = ({ onComplete }) => {
  const [status, setStatus] = useState('idle'); // idle, waiting, ready, finished
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  const startTest = () => {
    setStatus('waiting');
    setResult(null);
    const randomDelay = Math.floor(Math.random() * 2000) + 1500; // 1.5s - 3.5s
    timerRef.current = setTimeout(() => {
      setStatus('ready');
      setStartTime(Date.now());
    }, randomDelay);
  };

  const handleClick = () => {
    if (status === 'waiting') {
      clearTimeout(timerRef.current);
      setStatus('early');
      return;
    }
    if (status === 'ready') {
      const endTime = Date.now();
      const diff = endTime - startTime;
      setResult(diff);
      setStatus('finished');
      let score = Math.max(0, Math.min(100, Math.round(100 - (diff - 200) / 4)));
      setTimeout(() => onComplete(score), 2000);
    }
  };

  return (
    <div className="text-center h-full flex flex-col items-center justify-center space-y-6">
      <h2 className="text-3xl font-black mb-2">⚡ Reaction Test</h2>
      <p className="mb-4 text-gray-700">Click when the screen turns GREEN!</p>

      <div
        onClick={status !== 'idle' && status !== 'finished' ? handleClick : undefined}
        className={`
          w-full max-w-sm aspect-square border-4 border-black rounded-3xl cartoon-shadow
          flex items-center justify-center cursor-pointer select-none transition-colors duration-200
          ${status === 'idle' ? 'bg-gray-200' : ''}
          ${status === 'waiting' ? 'bg-red-400' : ''}
          ${status === 'ready' ? 'bg-green-400' : ''}
          ${status === 'early' ? 'bg-yellow-400' : ''}
          ${status === 'finished' ? 'bg-blue-300' : ''}
        `}
      >
        {status === 'idle' && <Button onClick={startTest}>Start</Button>}
        {status === 'waiting' && <span className="text-white font-bold text-2xl">Wait for it...</span>}
        {status === 'ready' && <span className="text-white font-bold text-4xl">CLICK!</span>}
        {status === 'early' && (
          <div className="flex flex-col gap-2">
            <span className="font-bold text-xl">Too fast!</span>
            <Button onClick={startTest} variant="outline" className="text-sm">Try Again</Button>
          </div>
        )}
        {status === 'finished' && (
          <div className="flex flex-col gap-2 animate-bounce">
            <span className="font-bold text-4xl">{result}ms</span>
            <span className="text-sm">Next game loading...</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* GAME 2: PATTERN RECOGNITION */
const PatternGame = ({ onComplete }) => {
  const [grid, setGrid] = useState(Array(9).fill(false));
  const [userPattern, setUserPattern] = useState(Array(9).fill(false));
  const [phase, setPhase] = useState('memorize'); // memorize, recall, result
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const newGrid = Array(9).fill(false);
    let count = 0;
    while (count < 4) {
      const idx = Math.floor(Math.random() * 9);
      if (!newGrid[idx]) {
        newGrid[idx] = true;
        count++;
      }
    }
    setGrid(newGrid);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('recall');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCellClick = (index) => {
    if (phase !== 'recall') return;
    const newUserPattern = [...userPattern];
    newUserPattern[index] = !newUserPattern[index];
    setUserPattern(newUserPattern);
  };

  const handleSubmit = () => {
    let correct = 0;
    let mistakes = 0;
    grid.forEach((isFilled, idx) => {
      if (isFilled && userPattern[idx]) correct++;
      if (!isFilled && userPattern[idx]) mistakes++;
    });
    let score = Math.max(0, (correct * 25) - (mistakes * 15));
    setPhase('result');
    setTimeout(() => onComplete(score), 2000);
  };

  return (
    <div className="text-center flex flex-col items-center">
      <h2 className="text-3xl font-black mb-2">🧩 Pattern Match</h2>
      <p className="mb-4 text-gray-700">
        {phase === 'memorize' ? `Memorize the blue blocks! (${countdown})` : 'Recreate the pattern!'}
      </p>

      <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-gray-100 rounded-2xl border-4 border-black cartoon-shadow-sm">
        {grid.map((isActive, i) => (
          <div
            key={i}
            onClick={() => handleCellClick(i)}
            className={`
              w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-black transition-all duration-200
              ${phase === 'memorize'
                ? (isActive ? 'bg-blue-500' : 'bg-white')
                : (userPattern[i] ? 'bg-blue-500' : 'bg-white hover:bg-gray-100 cursor-pointer')
              }
            `}
          />
        ))}
      </div>

      {phase === 'recall' && (
        <Button onClick={handleSubmit} variant="primary">Submit Pattern</Button>
      )}
      {phase === 'result' && (
        <div className="text-xl font-bold animate-pulse">Checking Brain Waves...</div>
      )}
    </div>
  );
};

/* GAME 3: NUMBER MEMORY */
const NumberGame = ({ onComplete }) => {
  const [number, setNumber] = useState("");
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState("show"); // show, input, feedback
  const [level, setLevel] = useState(1);

  useEffect(() => {
    if (phase === 'show') {
      const digits = level + 2;
      const newNum = Math.floor(Math.random() * (Math.pow(10, digits) - Math.pow(10, digits - 1))) + Math.pow(10, digits - 1);
      setNumber(newNum.toString());

      const time = 1000 + (level * 500);
      const timer = setTimeout(() => {
        setPhase('input');
      }, time);
      return () => clearTimeout(timer);
    }
  }, [level, phase]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === number) {
      if (level >= 4) { // Reduced levels to make room for other games
        onComplete(100);
      } else {
        setPhase('feedback');
        setTimeout(() => {
          setInput("");
          setLevel(l => l + 1);
          setPhase('show');
        }, 1000);
      }
    } else {
      const score = (level - 1) * 25;
      onComplete(score);
    }
  };

  return (
    <div className="text-center flex flex-col items-center w-full">
      <h2 className="text-3xl font-black mb-2">🧠 Number Recall</h2>
      <p className="mb-6 text-gray-700">Memorize the digits shown!</p>

      <div className="h-40 w-full flex items-center justify-center mb-4">
        {phase === 'show' && (
          <div className="text-5xl font-black tracking-widest animate-pulse">
            {number}
          </div>
        )}
        {phase === 'input' && (
          <form onSubmit={handleSubmit} className="w-full max-w-xs">
            <input
              type="number"
              pattern="\d*"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full text-center text-3xl p-3 border-4 border-black rounded-xl mb-4 outline-none focus:ring-4 ring-pink-300"
              placeholder="Type here..."
            />
            <Button variant="secondary" className="w-full">Submit</Button>
          </form>
        )}
        {phase === 'feedback' && (
          <div className="text-green-600 font-bold text-2xl flex items-center gap-2">
            <Zap className="fill-current" /> Correct! Next Level...
          </div>
        )}
      </div>
      <div className="text-sm font-bold text-gray-400 mt-4">Level {level} / 4</div>
    </div>
  );
};

/* GAME 4: COLOR CHAOS (Stroop) */
const StroopGame = ({ onComplete }) => {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState({ text: 'RED', color: 'text-red-500', answer: 'red' });

  // Colors mapping
  const options = [
    { name: 'Red', class: 'bg-red-500', val: 'red', textClass: 'text-red-500' },
    { name: 'Blue', class: 'bg-blue-500', val: 'blue', textClass: 'text-blue-500' },
    { name: 'Green', class: 'bg-green-500', val: 'green', textClass: 'text-green-500' },
    { name: 'Yellow', class: 'bg-yellow-400', val: 'yellow', textClass: 'text-yellow-400' }
  ];

  const nextRound = (currentScore) => {
    if (round >= 5) {
      onComplete(Math.round((currentScore / 5) * 100)); // 5 rounds
      return;
    }

    // Generate puzzle: Text says one thing, Color is another
    const textObj = options[Math.floor(Math.random() * options.length)];
    const colorObj = options[Math.floor(Math.random() * options.length)];

    setCurrent({
      text: textObj.name.toUpperCase(),
      color: colorObj.textClass, // The display color class
      answer: colorObj.val       // The correct answer (the ink color)
    });
    setRound(r => r + 1);
    setScore(currentScore);
  };

  // Initial load
  useEffect(() => {
    nextRound(0);
  }, []);

  const handleAnswer = (val) => {
    const isCorrect = val === current.answer;
    nextRound(isCorrect ? score + 1 : score);
  };

  return (
    <div className="text-center flex flex-col items-center w-full">
      <h2 className="text-3xl font-black mb-2">🎨 Color Chaos</h2>
      <p className="mb-6 text-gray-700">Click the <b>COLOR</b> of the word, not the text!</p>

      <div className="h-40 w-full flex items-center justify-center mb-4 bg-gray-100 rounded-2xl border-4 border-black cartoon-shadow-sm">
        <span className={`text-6xl font-black ${current.color} drop-shadow-sm`}>
          {current.text}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        {options.map((opt) => (
          <button
            key={opt.name}
            onClick={() => handleAnswer(opt.val)}
            className={`${opt.class} border-4 border-black rounded-xl py-4 text-white font-bold text-xl cartoon-shadow-hover cartoon-shadow-sm transition-transform`}
          >
            {opt.name}
          </button>
        ))}
      </div>
      <div className="text-sm font-bold text-gray-400 mt-4">Round {round} / 6</div>
    </div>
  );
};

/* GAME 5: MONKEY MIND (Chimp Test variant) */
const ChimpGame = ({ onComplete }) => {
  const [numbers, setNumbers] = useState([]);
  const [status, setStatus] = useState('memorize'); // memorize, play, lost, won
  const [nextExpected, setNextExpected] = useState(1);

  useEffect(() => {
    // Generate 5 random non-overlapping positions
    const spots = [];
    while (spots.length < 5) {
      const x = Math.floor(Math.random() * 80) + 10; // 10-90%
      const y = Math.floor(Math.random() * 80) + 10;
      // Check collision (simple distance check)
      const collision = spots.some(s => Math.abs(s.x - x) < 15 && Math.abs(s.y - y) < 15);
      if (!collision) spots.push({ id: spots.length + 1, x, y, state: 'visible' });
    }
    setNumbers(spots);
  }, []);

  const handleNumberClick = (num) => {
    if (status === 'lost') return;

    if (num.id === 1 && status === 'memorize') {
      // First click hides everything
      setStatus('play');
      setNumbers(prev => prev.map(n => ({ ...n, state: n.id === 1 ? 'hidden' : 'masked' })));
      setNextExpected(2);
    } else if (status === 'play') {
      if (num.id === nextExpected) {
        // Correct
        setNumbers(prev => prev.map(n => n.id === num.id ? { ...n, state: 'hidden' } : n));
        if (nextExpected === 5) {
          onComplete(100);
        } else {
          setNextExpected(n => n + 1);
        }
      } else {
        // Wrong
        setStatus('lost');
        setNumbers(prev => prev.map(n => ({ ...n, state: 'visible' }))); // Reveal all
        setTimeout(() => onComplete(0), 1500);
      }
    }
  };

  return (
    <div className="text-center flex flex-col items-center w-full h-[450px] relative">
      <h2 className="text-3xl font-black mb-2">🐵 Monkey Mind</h2>
      <p className="mb-2 text-gray-700">Click '1', then click the rest in order from memory!</p>

      <div className="flex-1 w-full bg-amber-50 rounded-2xl border-4 border-black relative overflow-hidden cartoon-shadow-sm cursor-pointer">
        {numbers.map((n) => (
          n.state !== 'hidden' && (
            <div
              key={n.id}
              onClick={() => handleNumberClick(n)}
              className={`
                                absolute w-12 h-12 flex items-center justify-center rounded-lg border-2 border-black font-black text-xl select-none
                                transition-all duration-200
                                ${n.state === 'visible' ? 'bg-white text-black' : 'bg-white'}
                                ${status === 'lost' && n.id === nextExpected ? 'bg-red-400' : ''}
                            `}
              style={{ left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              {n.state === 'visible' ? n.id : ''}
            </div>
          )
        ))}
        {status === 'lost' && <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-4xl font-black text-red-600 rotate-12">FAIL!</div>}
      </div>
    </div>
  );
};

/* GAME 6: GHOST BUSTER (Aim/Precision) */
const AimGame = ({ onComplete }) => {
  const [ghosts, setGhosts] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameActive, setGameActive] = useState(false);

  // Spawn a ghost
  const spawnGhost = () => {
    const id = Date.now();
    const x = Math.floor(Math.random() * 80) + 10;
    const y = Math.floor(Math.random() * 80) + 10;
    setGhosts(prev => [...prev, { id, x, y }]);
  };

  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      const spawner = setInterval(spawnGhost, 800); // New ghost every 0.8s
      return () => { clearInterval(timer); clearInterval(spawner); };
    } else if (timeLeft === 0 && gameActive) {
      setGameActive(false);
      // Max score around 15 ghosts?
      let finalScore = Math.min(100, score * 10);
      onComplete(finalScore);
    }
  }, [gameActive, timeLeft]);

  const startGame = () => {
    setGameActive(true);
    spawnGhost();
  };

  const whackGhost = (id) => {
    setGhosts(prev => prev.filter(g => g.id !== id));
    setScore(s => s + 1);
  };

  return (
    <div className="text-center flex flex-col items-center w-full h-[450px]">
      <h2 className="text-3xl font-black mb-2">👻 Ghost Buster</h2>
      <div className="flex justify-between w-full px-8 mb-2 font-bold text-gray-700">
        <span>Score: {score}</span>
        <span>Time: {timeLeft}s</span>
      </div>

      <div className="flex-1 w-full bg-slate-800 rounded-2xl border-4 border-black relative overflow-hidden cartoon-shadow-sm cursor-crosshair">
        {!gameActive && timeLeft === 10 && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Button onClick={startGame} variant="primary">Start Hunting</Button>
          </div>
        )}

        {ghosts.map(g => (
          <div
            key={g.id}
            onMouseDown={() => whackGhost(g.id)}
            className="absolute target-appear cursor-pointer hover:scale-110 transition-transform"
            style={{ left: `${g.x}%`, top: `${g.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {/* Using inline SVG for ghosts instead of external icons */}
            <svg className="w-12 h-12 text-white fill-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a4 4 0 0 1 4 4v7h1a2 2 0 0 1 2 2v4a2 4 0 0 1-2 2H7a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1V5a4 4 0 0 1 4-4z" fill="white" />
              <path d="M12 1a4 4 0 0 1 4 4v7H8V5a4 4 0 0 1 4-4z" fill="white" />
              <path d="M5 19l2-2m0 4l2-2m4-2l2-2m0 4l2-2m4-2l2-2m0 4l-2-2" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
};

/* RESULTS SCREEN */
const ResultsScreen = ({ scores, onRestart }) => {
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const average = Math.round(total / 6);

  const brainType = BRAIN_TYPES.find(t => average >= t.threshold) || BRAIN_TYPES[BRAIN_TYPES.length - 1];

  let memeData;
  if (average > 75) {
    memeData = MEMES.highScore;
  } else if (average < 40) {
    memeData = MEMES.lowScore;
  } else {
    memeData = MEMES.midScore;
  }

  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto relative">
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        result={{ ...brainType, score: average }}
      />

      <h1 className="text-4xl font-black mb-6 text-center transform -rotate-2">Your Diagnosis</h1>

      <Card id="result-card" color="bg-white" className="w-full mb-8 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-4 ${brainType.color} border-b-4 border-black`}></div>

        <div className="flex flex-col items-center mt-4">
          <div className="w-full bg-gray-200 rounded-xl border-4 border-black overflow-hidden mb-2 cartoon-shadow-sm">
            <img
              src={memeData.url}
              alt="Result Meme"
              className="w-full h-auto"
              crossOrigin="anonymous"
              onError={(e) => { e.target.onerror = null; e.target.src = memeData.fallback; }}
            />
          </div>

          <p className="text-xs text-gray-500 italic mb-4">{memeData.citation}</p>

          <h2 className="text-3xl font-black text-center mb-1">{brainType.label}</h2>
          <p className="text-gray-600 font-medium italic mb-6 text-center">"{brainType.desc}"</p>

          <div className="w-full bg-gray-100 rounded-xl border-2 border-black p-4 space-y-2 text-sm md:text-base">
            <ScoreRow label="Reflexes" score={scores.reaction} icon={<Zap size={16} />} />
            <ScoreRow label="Patterns" score={scores.pattern} icon={<Grid size={16} />} />
            <ScoreRow label="Memory" score={scores.memory} icon={<Brain size={16} />} />
            <ScoreRow label="Focus" score={scores.stroop} icon={<Palette size={16} />} />
            <ScoreRow label="Spatial" score={scores.chimp} icon={<Eye size={16} />} />
            <ScoreRow label="Precision" score={scores.aim} icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v2M12 20v2M2 12h2M20 12h2M7 7l1.5 1.5M15.5 15.5l1.5 1.5M7 17l1.5-1.5M15.5 8.5l1.5-1.5"></path></svg>} />

            <div className="h-0.5 bg-black/10 my-2"></div>
            <div className="flex justify-between items-center text-xl font-black">
              <span>BRAIN POWER</span>
              <span>{average}%</span>
            </div>
          </div>
        </div>
      </Card >

      <div className="flex gap-4 w-full">
        <Button onClick={onRestart} variant="outline" className="flex-1 flex items-center justify-center gap-2">
          <RotateCcw size={20} /> Retry
        </Button>
        <Button onClick={() => setShowShareModal(true)} variant="primary" className="flex-1 flex items-center justify-center gap-2">
          <Share2 size={20} /> Share
        </Button>
      </div>
    </div >
  );
};

/* INTRO SCREEN */
const IntroScreen = ({ onStart }) => {
  const memeData = MEMES.intro;
  return (
    <div className="flex flex-col items-center text-center max-w-lg mx-auto">
      <div className="mb-8 wiggle">
        <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-amber-500 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
          Rate My Brain
        </h1>
      </div>

      <Card color="bg-amber-100" className="mb-8 w-full transform rotate-1 hover:rotate-0 transition-transform duration-300">
        <div className="w-full bg-gray-200 rounded-xl border-4 border-black overflow-hidden mb-2 cartoon-shadow-sm">
          {/* Image loading with fallback */}
          <img
            src={memeData.url}
            alt="Brain Meme Intro"
            className="w-full h-auto"
            onError={(e) => { e.target.onerror = null; e.target.src = memeData.fallback; }}
          />
        </div>
        <p className="text-xs text-gray-500 italic mb-4">{memeData.citation}</p>

        <p className="font-bold text-xl mb-2">Is your brain rotting?</p>
        <p className="text-gray-700">Take this 100% scientifically questionable test to find out your true Brain Type.</p>
      </Card>

      <Button onClick={onStart} className="w-full py-4 text-2xl flex items-center justify-center gap-2">
        Start Test <ChevronRight size={28} />
      </Button>
    </div>
  );
};

/* MAIN APP COMPONENT */
export default function App() {
  const [step, setStep] = useState('intro');
  // Games: reaction, pattern, memory, stroop, chimp, aim
  const [scores, setScores] = useState({
    reaction: 0, pattern: 0, memory: 0, stroop: 0, chimp: 0, aim: 0
  });

  const handleGameComplete = (game, score) => {
    setScores(prev => ({ ...prev, [game]: score }));

    // Sequential Navigation
    if (game === 'reaction') setStep('pattern');
    if (game === 'pattern') setStep('memory');
    if (game === 'memory') setStep('stroop');
    if (game === 'stroop') setStep('chimp');
    if (game === 'chimp') setStep('aim');
    if (game === 'aim') setStep('results');
  };

  const restart = () => {
    setScores({ reaction: 0, pattern: 0, memory: 0, stroop: 0, chimp: 0, aim: 0 });
    setStep('intro');
  };

  const bgColors = {
    intro: "bg-amber-50",
    reaction: "bg-blue-50",
    pattern: "bg-pink-50",
    memory: "bg-green-50",
    stroop: "bg-yellow-50",
    chimp: "bg-orange-50",
    aim: "bg-indigo-50",
    results: "bg-purple-50"
  };

  // Game list for progress dots
  const gameList = ['reaction', 'pattern', 'memory', 'stroop', 'chimp', 'aim'];

  return (
    <div className={`min-h-screen ${bgColors[step] || 'bg-white'} transition-colors duration-500 flex flex-col items-center py-10 px-4`}>
      <GlobalStyles />

      {/* Header */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-2 font-black text-xl select-none">
          <Brain className="fill-pink-400" size={32} />
          RateMyBrain
        </div>
        {step !== 'intro' && step !== 'results' && (
          <button onClick={restart} className="p-2 hover:bg-black/5 rounded-full">
            <X size={24} />
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="w-full max-w-2xl">
        {step === 'intro' && <IntroScreen onStart={() => setStep('reaction')} />}

        {step === 'reaction' && (
          <Card color="bg-white" className="min-h-[400px]">
            <ReactionGame onComplete={(s) => handleGameComplete('reaction', s)} />
          </Card>
        )}

        {step === 'pattern' && (
          <Card color="bg-white" className="min-h-[400px]">
            <PatternGame onComplete={(s) => handleGameComplete('pattern', s)} />
          </Card>
        )}

        {step === 'memory' && (
          <Card color="bg-white" className="min-h-[400px]">
            <NumberGame onComplete={(s) => handleGameComplete('memory', s)} />
          </Card>
        )}

        {step === 'stroop' && (
          <Card color="bg-white" className="min-h-[400px]">
            <StroopGame onComplete={(s) => handleGameComplete('stroop', s)} />
          </Card>
        )}

        {step === 'chimp' && (
          <Card color="bg-white" className="min-h-[400px]">
            <ChimpGame onComplete={(s) => handleGameComplete('chimp', s)} />
          </Card>
        )}

        {step === 'aim' && (
          <Card color="bg-white" className="min-h-[400px]">
            <AimGame onComplete={(s) => handleGameComplete('aim', s)} />
          </Card>
        )}

        {step === 'results' && (
          <ResultsScreen scores={scores} onRestart={restart} />
        )}
      </div>

      {/* Progress Dots */}
      {gameList.includes(step) && (
        <div className="flex gap-2 mt-8">
          {gameList.map((s, i) => (
            <div
              key={s}
              className={`
                        w-3 h-3 rounded-full border-2 border-black transition-colors duration-300
                        ${step === s ? 'bg-black' : (gameList.indexOf(step) > i ? 'bg-gray-400' : 'bg-white')}
                    `}
            />
          ))}
        </div>
      )}

      <footer className="mt-12 text-gray-400 font-bold text-sm">
        RateMyBrain © 2024 • Not Medical Advice
      </footer>
    </div>
  );
}