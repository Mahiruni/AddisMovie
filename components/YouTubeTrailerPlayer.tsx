"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import {AlertCircle,Maximize,Pause,Play,RotateCcw,Volume2,VolumeX,X} from "lucide-react";

type PlayerState=0|1|2|3|5;
type YTPlayer={
 playVideo:()=>void;pauseVideo:()=>void;seekTo:(s:number,allowSeekAhead:boolean)=>void;
 setVolume:(v:number)=>void;mute:()=>void;unMute:()=>void;getCurrentTime:()=>number;
 getDuration:()=>number;getPlayerState:()=>PlayerState;getPlaybackQuality?:()=>string;
 setPlaybackQuality?:(q:string)=>void;getAvailableQualityLevels?:()=>string[];destroy:()=>void;
};
declare global{interface Window{YT?:{Player:new(id:string,opts:Record<string,unknown>)=>YTPlayer};onYouTubeIframeAPIReady?:()=>void}}

const qualityNames:Record<string,string>={highres:"1080p+",hd1080:"1080p",hd720:"720p",large:"480p",medium:"360p",small:"240p",tiny:"144p",auto:"Auto"};

export default function YouTubeTrailerPlayer({videoId,title,thumbnail,onClose}:{videoId:string;title:string;thumbnail?:string;onClose?:()=>void}){
 const mountRef=useRef<HTMLDivElement>(null),playerRef=useRef<YTPlayer|null>(null),timerRef=useRef<ReturnType<typeof setInterval>|null>(null);
 const [ready,setReady]=useState(false),[playing,setPlaying]=useState(false),[error,setError]=useState(false),[online,setOnline]=useState(true),[started,setStarted]=useState(false),[muted,setMuted]=useState(true),[volume,setVolume]=useState(75),[progress,setProgress]=useState(0),[duration,setDuration]=useState(0),[quality,setQuality]=useState("auto"),[qualities,setQualities]=useState<string[]>([]);

 const start=useCallback(()=>{if(!window.YT?.Player||!mountRef.current)return;
   const id="yt-trailer-"+Math.random().toString(36).slice(2);mountRef.current.id=id;
   playerRef.current=new window.YT.Player(id,{videoId,playerVars:{autoplay:0,controls:1,playsinline:1,rel:0,modestbranding:1,iv_load_policy:3,fs:1,disablekb:0,origin:window.location.origin},
     events:{
       onReady:(e:{target:YTPlayer})=>{const p=e.target;playerRef.current=p;setReady(true);setDuration(p.getDuration());const qs=p.getAvailableQualityLevels?.()||[];setQualities(qs);setQuality(p.getPlaybackQuality?.()||"auto")},
       onStateChange:(e:{data:number})=>{setPlaying(e.data===1);if(e.data===1)setStarted(true)},
       onError:()=>{setError(true);setPlaying(false)}
     }});},[videoId]);

 const load=useCallback(()=>{setError(false);if(!navigator.onLine){setOnline(false);return}setOnline(true);
   if(window.YT?.Player)start();else{window.onYouTubeIframeAPIReady=start;if(!document.querySelector('script[data-addismovie-youtube]')){const s=document.createElement("script");s.src="https://www.youtube.com/iframe_api";s.async=true;s.dataset.addismovieYoutube="true";document.head.appendChild(s)}}
 },[start]);

 useEffect(()=>{setOnline(navigator.onLine);load();const on=()=>setOnline(true),off=()=>setOnline(false);window.addEventListener("online",on);window.addEventListener("offline",off);
   return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);if(timerRef.current)clearInterval(timerRef.current);playerRef.current?.destroy()}},[load]);

 useEffect(()=>{if(!playing)return;timerRef.current=setInterval(()=>{const p=playerRef.current;if(!p)return;const d=p.getDuration();setDuration(d);setProgress(d?p.getCurrentTime()/d*100:0)},250);return()=>{if(timerRef.current)clearInterval(timerRef.current)}},[playing]);

 const toggle=()=>{const p=playerRef.current;if(!p)return;if(playing)p.pauseVideo();else{p.mute();setMuted(true);p.playVideo()}};
 const seek=(v:number)=>{playerRef.current?.seekTo(v/100*duration,true);setProgress(v)};
 const changeVolume=(v:number)=>{setVolume(v);const p=playerRef.current;if(!p)return;if(v===0){p.mute();setMuted(true)}else{p.unMute();p.setVolume(v);setMuted(false)}};
 const changeQuality=(q:string)=>{setQuality(q);playerRef.current?.setPlaybackQuality?.(q)};
 const full=()=>{const el=mountRef.current?.parentElement;if(el?.requestFullscreen)el.requestFullscreen().catch(()=>{})};

 if(!online)return <div className="trailerState"><AlertCircle/><strong>You’re offline</strong><span>Connect to the internet to play this YouTube trailer.</span><button onClick={load}><RotateCcw/> Retry</button></div>;
 return <div className="trailerShell"><div className="trailerViewport">
   {!started&&thumbnail?<button className="trailerPoster" onClick={toggle} aria-label={"Play "+title}><img src={thumbnail} alt=""/><span className="posterShade"/><span className="bigPlay"><Play fill="currentColor"/></span><span className="posterLabel">Official trailer</span></button>:null}
   <div ref={mountRef} className="youtubeMount" aria-label={title+" trailer"}/>
   {!ready&&!error?<div className="trailerLoading"><span className="spinner"/><span>Loading trailer…</span></div>:null}
   {error?<div className="trailerState"><AlertCircle/><strong>Trailer unavailable</strong><span>YouTube could not load this video right now.</span><button onClick={load}><RotateCcw/> Retry</button></div>:null}
 </div>{onClose?<button className="closeTrailer" onClick={onClose} aria-label="Close trailer"><X/></button>:null}
 <div className="trailerControls"><button onClick={toggle} disabled={!ready||!!error} aria-label={playing?"Pause":"Play"}>{playing?<Pause fill="currentColor"/>:<Play fill="currentColor"/>}</button>
 <input aria-label="Seek trailer" type="range" min="0" max="100" value={progress} onChange={e=>seek(Number(e.target.value))}/>
 <button onClick={()=>changeVolume(muted?volume:0)} aria-label={muted?"Unmute":"Mute"}>{muted?<VolumeX/>:<Volume2/>}</button>
 <input className="volume" aria-label="Volume" type="range" min="0" max="100" value={muted?0:volume} onChange={e=>changeVolume(Number(e.target.value))}/>
 {qualities.length>0?<select className="qualitySelect" value={quality} onChange={e=>changeQuality(e.target.value)} aria-label="Video quality"><option value="auto">Auto</option>{qualities.map(q=><option key={q} value={q}>{qualityNames[q]||q}</option>)}</select>:null}
 <button onClick={full} aria-label="Fullscreen"><Maximize/></button></div></div>
}