// handcoded by Chee Yong Lee
// view license https://github.com/leecheeyong/github-player
const playlist = document.getElementById("playlist");
const slidebar = document.getElementById("slidebar");
const searchBar = document.getElementById("search");
const pauseButton = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" style="fill: rgba(255, 255, 255, 255);"><path d="M8 7h3v10H8zm5 0h3v10h-3z"></path></svg>';
const playButton = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" style="fill: rgba(255,255,255,255);"><path d="M7 6v12l10-6z"></path></svg>'
var currentTrack = 0;
var list = [];
var loaded = [];
var timestamp = document.getElementById("timestamp");
const audio = new Audio();
const control = document.getElementById("control");
var currentTrackName = document.getElementById("nowPlaying");

function debounce(cb, delay = 1000) {
  let timeout

  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      cb(...args)
    }, delay)
  }
}

function updatePositionState() {
  if ('setPositionState' in navigator.mediaSession) {
    navigator.mediaSession.setPositionState({
      duration: audio.duration,
      position: audio.currentTime,
      playbackRate: audio.playbackRate 
    });
  }
}

function search(name) {
  if(!name) {
    loaded.forEach(e => {
        var music = document.createElement("div");
        music.textContent = decodeURIComponent(e.title);
        music.onclick = () => playAudio(e.track, e.title);
        music.classList.add("music");
       playlist.appendChild(music);
    })
  }else {
  playlist.replaceChildren();
  const result = list.filter(e=>decodeURIComponent(e.title).toLowerCase().split(" ").join("").includes(`${name}`.toLowerCase().split(" ").join("")));
  if(result.length == 0) {
     var music = document.createElement("div");
     music.textContent = "No Result"; music.classList.add("music"); playlist.appendChild(music);
  }else {
  result.forEach(e => {
        var music = document.createElement("div");
        music.textContent = decodeURIComponent(e.title);
        music.onclick = () => playAudio(e.track, e.title);
        music.classList.add("music");
       playlist.appendChild(music);
    })
  }
  }
}
searchBar.onkeydown = () => search(searchBar.value);
function playAudio(track, name) {
    name = decodeURIComponent(name);
    track = decodeURIComponent(track);
    audio.src = `${track.slice(1)}`;
    currentTrack = list.find(e=> decodeURIComponent(e.track) == track && decodeURIComponent(e.title) == name).trackNumber - 1;
    currentTrackName.textContent = name;
    document.title = `${name} | Github Music - Favourites`;
    audio.play().then(() => {
    navigator.mediaSession.metadata = new MediaMetadata({ title: `${name}`, artist: 'Github Player - Favourites' });
    navigator.mediaSession.playbackState = 'playing';
    updatePositionState();
    })
    control.innerHTML = pauseButton;
    playing = true;
}

window.onload = () => {
var playing = false;
fetchPlaylist();
function fetchPlaylist() {
fetch(`/fav/${window.location.search.slice(1)}.json`).then(r=>r.json()).then(r=> {
    list = r;
    r.forEach(e => {
        var music = document.createElement("div");
        music.textContent = decodeURIComponent(e.title);
        music.onclick = () => {
            playAudio(e.track, e.title);
        }     
        music.classList.add("music");
       playlist.appendChild(music);
    })
    loaded = loaded.concat(r.list);
});
}

function playPause() {
if(!list) return;
    if(!currentTrack && !currentTrackName) return playAudio(list[0].track, list[0].title);
    if (!playing) {
        playing = true;
        audio.play();
        navigator.mediaSession.playbackState = 'playing';
        control.innerHTML = pauseButton;
    } else {
        playing = false;
        audio.pause();
        navigator.mediaSession.playbackState = 'paused';
        control.innerHTML = playButton;
    }
}
control.addEventListener("click", () => playPause());
/* https://web.dev/media-session/ */

navigator.mediaSession.setActionHandler('play', () => playPause());
navigator.mediaSession.setActionHandler('pause', () => playPause());

audio.addEventListener("ended", () => {
    if(currentTrack == list.length) return;
    playAudio(list[currentTrack + 1].track, list[currentTrack + 1].title);
})
    
function playPrevious() {
 if(!list) return;
    if(!currentTrack && !currentTrackName) return playAudio(list[0].track, list[0].title);
    if(currentTrack == 1) return;
    playAudio(list[currentTrack - 1].track, list[currentTrack - 1].title);
}

document.getElementById("previous").addEventListener("click", () => playPrevious());
navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());

function playNext() {
  if(!list) return;
  if(!currentTrack && !currentTrackName) return playAudio(list[0].track, list[0].title);
  if(currentTrack == list.length) return;
  playAudio(list[currentTrack + 1].track, list[currentTrack + 1].title);
}
    
document.getElementById("next").addEventListener("click", () => playNext());
navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
 
audio.ontimeupdate = function () {
    timestamp.textContent = timeFormat(audio.currentTime);
    slidebar.value = audio.currentTime / audio.duration * 100;
}

slidebar.oninput = (e) => {
  audio.currentTime = audio.duration / 100 * slidebar.value, audio.duration;
}


function timeFormat(ct) {
    minutes = Math.floor(ct / 60);
    seconds = Math.floor(ct % 60);
  
    if (seconds < 10) {
      seconds = "0"+seconds;
    }
  
    return minutes + ":" + seconds;
}

}

const lyrics = document.getElementById("lyrics");
currentTrackName.onclick = () => {
  if(!currentTrackName.textContent)return;
  if(lyrics.style.display == "none") {
  fetch(`/lyrics/${currentTrackName.textContent}.txt`).then(async r=> {
    if(r.status == 200) {
    lyrics.replaceChildren();
    lyrics.style.display = "block";
    playlist.style.overflow = "hidden";
    const text = await r.text();
    text.split("\n").forEach(e => {
      const node = document.createElement("p");
      node.textContent = e;
      lyrics.appendChild(node);
    })
    }
  })
}else {
  lyrics.style.display = "none";
  playlist.style.overflow = "auto";
}
}
