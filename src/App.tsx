/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useRef, useEffect } from 'react';
import { Play, Square, FileMusic, Upload, Timer, RefreshCw, AudioLines } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [repeats, setRepeats] = useState<number>(3);
  const [gapSeconds, setGapSeconds] = useState<number>(2);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [isWaitingGap, setIsWaitingGap] = useState(false);
  const [timeLeftInGap, setTimeLeftInGap] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const shouldStopRef = useRef(false);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    let animationFrameId: number;
    const updateProgress = () => {
      // While waiting for gap, we use the gap time for progress manually.
      // So only update audio progress if it's currently playing audio.
      if (audio.duration && !audio.paused && !isWaitingGap) {
        setProgress(audio.currentTime / audio.duration);
      }
      animationFrameId = requestAnimationFrame(updateProgress);
    };
    
    animationFrameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isWaitingGap]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAudioFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const startPlayback = async () => {
    if (!audioFile || !audioRef.current) return;
    
    setIsPlaying(true);
    shouldStopRef.current = false;
    setCurrentIteration(1);
    setIsWaitingGap(false);
    setProgress(0);
    
    const audio = audioRef.current;
    const fileUrl = URL.createObjectURL(audioFile);
    audio.src = fileUrl;
    
    for (let i = 0; i < repeats; i++) {
      if (shouldStopRef.current) break;
      
      setCurrentIteration(i + 1);
      
      await new Promise<void>((resolve) => {
        const endHandler = () => {
           audio.removeEventListener('ended', endHandler);
           resolve();
        };
        audio.addEventListener('ended', endHandler);
        audio.currentTime = 0;
        
        audio.play().catch(e => {
           console.error("Playback failed: ", e);
           audio.removeEventListener('ended', endHandler);
           resolve();
        });
        
        cancelRef.current = () => {
           audio.pause();
           audio.removeEventListener('ended', endHandler);
           resolve();
        };
      });
      
      if (shouldStopRef.current) break;
      
      setProgress(1); // Finish progress bar conceptually
      
      if (i < repeats - 1) {
         setIsWaitingGap(true);
         let curTimeLeft = gapSeconds;
         setTimeLeftInGap(curTimeLeft);
         
         await new Promise<void>((resolve) => {
            const step = 0.05; // 50ms intervals for smoother progress
            const interval = setInterval(() => {
               curTimeLeft -= step;
               setTimeLeftInGap(Math.max(0, curTimeLeft));
               // Update progress during gap based on time left 
               // (0 to 1 scaling, going up or down. Let's make it fill up as it waits)
               setProgress(Math.max(0, gapSeconds - curTimeLeft) / Math.max(0.1, gapSeconds));
               
               if (curTimeLeft <= 0) {
                  clearInterval(interval);
                  resolve();
               }
            }, step * 1000);
            
            cancelRef.current = () => {
               clearInterval(interval);
               resolve();
            };
         });
         setIsWaitingGap(false);
         setProgress(0);
      }
    }
    
    URL.revokeObjectURL(fileUrl);
    audio.src = "";
    setIsPlaying(false);
    setCurrentIteration(0);
    setProgress(0);
    setIsWaitingGap(false);
    cancelRef.current = null;
  };

  const stopPlayback = () => {
    shouldStopRef.current = true;
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    setIsPlaying(false);
    setIsWaitingGap(false);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-bg-surround flex flex-col items-center justify-center p-6">
      
      <div className="w-full max-w-sm bg-card-bg rounded-2xl shadow-2xl p-6 border border-white/5 flex flex-col gap-6 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-start gap-3 border-b border-white/10 pb-4">
          <div className="p-2 bg-white/5 rounded-lg border border-white/10">
            <AudioLines className="w-5 h-5 text-text-primary" />
          </div>
          <div>
            <h1 className="text-text-primary font-medium tracking-wide">LOOPER PLAYER</h1>
            <p className="font-mono text-[10px] text-text-secondary tracking-widest uppercase">AUDIO REPEATER TOOL</p>
          </div>
        </div>

        {/* File Picker */}
        <div className="relative">
          <input 
            type="file" 
            accept="audio/*" 
            id="audio-upload" 
            className="sr-only"
            onChange={handleFileChange}
            disabled={isPlaying}
          />
          <label 
            htmlFor="audio-upload"
            className={cn(
               "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-border border-dashed transition-all cursor-pointer",
               fileName ? "bg-white/5 border-white/20" : "bg-black/20 border-white/10 hover:border-white/30 hover:bg-white-[0.02]",
               isPlaying && "opacity-50 pointer-events-none cursor-default"
            )}
          >
            {fileName ? (
              <>
                 <FileMusic className="w-8 h-8 text-white/80" />
                 <span className="text-sm font-medium text-white truncate max-w-full px-2" title={fileName}>
                   {fileName}
                 </span>
              </>
            ) : (
              <>
                 <div className="p-3 bg-white/5 rounded-full border border-white/10">
                   <Upload className="w-6 h-6 text-white/60" />
                 </div>
                 <span className="text-sm font-medium text-text-secondary">Select Audio File</span>
              </>
            )}
          </label>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] text-text-secondary tracking-widest uppercase flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" />
              Repeats
            </label>
            <input 
              type="number"
              min="1"
              value={repeats}
              onChange={(e) => setRepeats(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isPlaying}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-white/30 disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] text-text-secondary tracking-widest uppercase flex items-center gap-1.5">
              <Timer className="w-3 h-3" />
              Gap (Sec)
            </label>
            <input 
              type="number"
              min="0"
              step="0.5"
              value={gapSeconds}
              onChange={(e) => setGapSeconds(Math.max(0, parseFloat(e.target.value) || 0))}
              disabled={isPlaying}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-white/30 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Playback Display */}
        <div className="flex flex-col mt-2">
          <div className="flex justify-between items-end mb-2">
            <div className="font-mono text-[10px] tracking-widest text-text-secondary uppercase">
               {isPlaying ? (
                  isWaitingGap ? (
                     <span className="text-accent-wait">WAITING GAP</span>
                  ) : (
                     <span className="text-accent-play">PLAYING</span>
                  )
               ) : (
                 "READY"
               )}
            </div>
            {isPlaying && (
              <div className="font-mono text-xs text-text-primary">
                 ITERATION {currentIteration}/{repeats}
              </div>
            )}
          </div>
          
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/10 relative">
             <div 
               className={cn(
                 "absolute top-0 left-0 h-full rounded-full transition-all duration-75",
                 isWaitingGap ? "bg-accent-wait" : "bg-accent-play"
               )}
               style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
             />
          </div>
          {isWaitingGap && (
             <div className="font-mono text-[10px] text-text-secondary text-right mt-1.5 opacity-80">
                {timeLeftInGap.toFixed(1)}s REMAINING
             </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center mt-2">
           <button
             onClick={isPlaying ? stopPlayback : startPlayback}
             disabled={!audioFile}
             className={cn(
               "relative group flex items-center justify-center w-20 h-20 rounded-full border-2 transition-all active:scale-95 disabled:opacity-30 disabled:active:scale-100",
               isPlaying 
                 ? "border-accent-stop/50 bg-accent-stop/10 text-accent-stop hover:bg-accent-stop/20 hover:border-accent-stop shadow-[0_0_20px_rgba(239,68,68,0.2)]" 
                 : "border-text-primary/10 bg-white/5 text-text-primary hover:bg-white/10 hover:border-white/30"
             )}
           >
             {isPlaying ? (
               <Square className="w-8 h-8 fill-current" />
             ) : (
               <Play className="w-8 h-8 fill-current ml-1" />
             )}
             
             {isPlaying && (
               <div className="absolute inset-0 rounded-full border border-accent-stop rounded-full animate-ping opacity-20" />
             )}
           </button>
        </div>

      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
