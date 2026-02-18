
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Disc, Mic2, Music, ChevronLeft, BrainCircuit, Trash2, Home, LogOut, User, Upload, Image as ImageIcon, Play, Pause, SkipBack, SkipForward, Volume2, Lock } from 'lucide-react';
import { Band, Album, Song, ViewType } from './types';
import { brainstormBandDetails, suggestTrackNames } from './services/geminiService';

interface UserAccount {
  username: string;
  password: string;
  id: string;
}

const App: React.FC = () => {
  // Estado de Autenticación
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('vibe_studio_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [bands, setBands] = useState<Band[]>([]);
  const [view, setView] = useState<ViewType>(ViewType.DASHBOARD);
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  
  // Modales
  const [isCreatingBand, setIsCreatingBand] = useState(false);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [isAddingSong, setIsAddingSong] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Reproductor
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Cargar datos al iniciar sesión
  useEffect(() => {
    if (currentUser) {
      const savedBands = localStorage.getItem(`vibe_studio_data_${currentUser.id}`);
      setBands(savedBands ? JSON.parse(savedBands) : []);
    } else {
      setBands([]);
    }
  }, [currentUser]);

  // Guardar datos de forma persistente
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`vibe_studio_data_${currentUser.id}`, JSON.stringify(bands));
    }
  }, [bands, currentUser]);

  // Simulación de progreso de reproducción
  useEffect(() => {
    let interval: any;
    if (isPlaying && currentSong) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSong]);

  const handleLogin = (account: UserAccount) => {
    setCurrentUser(account);
    localStorage.setItem('vibe_studio_session', JSON.stringify(account));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('vibe_studio_session');
    setView(ViewType.DASHBOARD);
    setSelectedBandId(null);
    setSelectedAlbumId(null);
    setCurrentSong(null);
    setIsPlaying(false);
  };

  const playSong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    setProgress(0);
  };

  const addBand = (newBand: Band) => {
    setBands(prev => [...prev, newBand]);
    setIsCreatingBand(false);
  };

  const addAlbum = (bandId: string, newAlbum: Album) => {
    setBands(prev => prev.map(band => 
      band.id === bandId ? { ...band, albums: [...band.albums, newAlbum] } : band
    ));
    setIsCreatingAlbum(false);
  };

  const addSong = (bandId: string, albumId: string, newSong: Song) => {
    setBands(prev => prev.map(band => {
      if (band.id !== bandId) return band;
      return {
        ...band,
        albums: band.albums.map(album => 
          album.id === albumId ? { ...album, songs: [...album.songs, newSong] } : album
        )
      };
    }));
    setIsAddingSong(false);
  };

  const deleteBand = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta banda y todos sus datos?')) {
      setBands(prev => prev.filter(b => b.id !== id));
      setView(ViewType.DASHBOARD);
    }
  };

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleLogin} />;
  }

  const currentBand = bands.find(b => b.id === selectedBandId);
  const currentAlbum = currentBand?.albums.find(a => a.id === selectedAlbumId);

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      {/* Barra lateral */}
      <aside className="w-72 border-r border-zinc-800 bg-[#0c0c0e] flex flex-col p-6">
        <div className="flex items-center gap-3 px-2 py-4 mb-8">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
            <Music size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter">VibeStudio</h1>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2">
          <button 
            onClick={() => setView(ViewType.DASHBOARD)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === ViewType.DASHBOARD ? 'bg-indigo-600/10 text-indigo-400 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
          >
            <Home size={20} />
            <span>Inicio</span>
          </button>
          
          <div className="pt-6 pb-2 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Mis Proyectos</div>
          <div className="space-y-1">
            {bands.map(band => (
              <button 
                key={band.id}
                onClick={() => {
                  setSelectedBandId(band.id);
                  setView(ViewType.BAND_DETAIL);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all truncate ${selectedBandId === band.id && view === ViewType.BAND_DETAIL ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
              >
                <Mic2 size={18} />
                <span className="truncate text-sm">{band.name}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="mt-auto space-y-4 pt-4 border-t border-zinc-800">
          <button 
            onClick={() => setIsCreatingBand(true)}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
          >
            <Plus size={20} />
            <span>Crear Banda</span>
          </button>

          <div className="flex items-center justify-between px-2 py-2 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <User size={14} />
              </div>
              <span className="font-medium truncate max-w-[80px]">{currentUser.username}</span>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors group" title="Cerrar Sesión">
              <LogOut size={16} className="text-zinc-500 group-hover:text-red-400" />
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className={`flex-1 overflow-y-auto ${currentSong ? 'pb-32' : 'pb-10'} p-10 bg-gradient-to-br from-[#09090b] to-[#121214]`}>
        {view === ViewType.DASHBOARD && (
          <div className="max-w-6xl mx-auto">
            <header className="mb-10">
              <h2 className="text-4xl font-black mb-2">Bienvenido, {currentUser.username}</h2>
              <p className="text-zinc-500">Crea tu legado musical hoy mismo.</p>
            </header>
            
            {bands.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-zinc-500 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
                <div className="bg-zinc-800/50 p-6 rounded-full mb-6">
                  <Disc size={48} className="opacity-20" />
                </div>
                <p className="text-xl font-medium mb-2 text-zinc-400">Aún no tienes bandas</p>
                <button 
                  onClick={() => setIsCreatingBand(true)}
                  className="mt-4 px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-500 transition-all"
                >
                  Empezar Ahora
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {bands.map(band => (
                  <div 
                    key={band.id} 
                    className="group bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-500 transition-all cursor-pointer hover:shadow-2xl"
                    onClick={() => {
                      setSelectedBandId(band.id);
                      setView(ViewType.BAND_DETAIL);
                    }}
                  >
                    <div className="aspect-[4/5] relative overflow-hidden">
                      <img 
                        src={band.imageUrl} 
                        alt={band.name} 
                        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end p-6">
                        <div className="w-full">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{band.genre}</p>
                          <h3 className="font-black text-2xl truncate">{band.name}</h3>
                          <p className="text-zinc-400 text-xs mt-1">{band.albums.length} Álbumes registrados</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === ViewType.BAND_DETAIL && currentBand && (
          <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <button onClick={() => setView(ViewType.DASHBOARD)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">
              <ChevronLeft size={18} /> Panel Principal
            </button>

            <div className="flex flex-col md:flex-row gap-10 items-start">
              <div className="w-64 h-64 rounded-3xl overflow-hidden border-4 border-zinc-800 shadow-2xl shrink-0">
                <img src={currentBand.imageUrl} alt={currentBand.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-6xl font-black tracking-tighter leading-none mb-4">{currentBand.name}</h2>
                    <span className="px-3 py-1 bg-indigo-600/20 text-indigo-400 text-[10px] font-black rounded-full uppercase border border-indigo-500/20 tracking-widest">{currentBand.genre}</span>
                  </div>
                  <button 
                    onClick={() => deleteBand(currentBand.id)}
                    className="p-3 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 size={22} />
                  </button>
                </div>
                <p className="text-zinc-400 text-lg italic leading-relaxed max-w-2xl border-l-2 border-zinc-800 pl-6">
                  "{currentBand.bio}"
                </p>
              </div>
            </div>

            <div className="pt-8">
              <div className="flex justify-between items-end mb-8 border-b border-zinc-800 pb-4">
                <h3 className="text-3xl font-black tracking-tight">Discografía</h3>
                <button 
                  onClick={() => setIsCreatingAlbum(true)}
                  className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full font-bold transition-all text-sm"
                >
                  <Plus size={18} />
                  Añadir Álbum
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {currentBand.albums.map(album => (
                  <div 
                    key={album.id}
                    className="group space-y-3 cursor-pointer"
                    onClick={() => {
                      setSelectedAlbumId(album.id);
                      setView(ViewType.ALBUM_DETAIL);
                    }}
                  >
                    <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl transition-all group-hover:-translate-y-2 relative">
                      <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform shadow-xl">
                            <Plus size={24} />
                         </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-black text-lg truncate group-hover:text-indigo-400 transition-colors">{album.title}</h4>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{album.year} • {album.genre}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === ViewType.ALBUM_DETAIL && currentBand && currentAlbum && (
          <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-6 duration-700">
             <button onClick={() => setView(ViewType.BAND_DETAIL)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">
               <ChevronLeft size={18} /> Volver a {currentBand.name}
             </button>

            <div className="flex flex-col md:flex-row items-end gap-10">
              <div className="w-72 h-72 rounded-2xl shadow-2xl shadow-black overflow-hidden shrink-0 border border-zinc-800">
                <img src={currentAlbum.coverUrl} alt={currentAlbum.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 pb-2">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-indigo-500 mb-3">Álbum</p>
                <h2 className="text-7xl font-black mb-6 tracking-tighter leading-none">{currentAlbum.title}</h2>
                <div className="flex items-center gap-3 text-zinc-400 font-bold text-sm">
                  <span className="text-white hover:underline cursor-pointer">{currentBand.name}</span>
                  <span className="text-zinc-700">•</span>
                  <span>{currentAlbum.year}</span>
                  <span className="text-zinc-700">•</span>
                  <span>{currentAlbum.songs.length} pistas grabadas</span>
                </div>
              </div>
            </div>

            <div className="space-y-6 bg-zinc-900/30 p-8 rounded-3xl border border-zinc-800/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-6">
                  <button className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-500 text-white transition-all shadow-xl">
                    <Play className="fill-current ml-1" size={24} />
                  </button>
                  <button 
                    onClick={() => setIsAddingSong(true)}
                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-8 py-3 rounded-full font-black transition-all text-xs uppercase tracking-widest border border-zinc-700"
                  >
                    <Upload size={16} /> Subir Nueva Pista
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 px-6 py-4 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800/50">
                <div className="col-span-1">#</div>
                <div className="col-span-8">Título / Pista</div>
                <div className="col-span-3 text-right">Duración</div>
              </div>

              {currentAlbum.songs.length === 0 ? (
                <div className="text-center py-24 text-zinc-600 border-2 border-dashed border-zinc-800/20 rounded-2xl">
                  <Music size={40} className="mx-auto mb-4 opacity-5" />
                  <p className="font-bold">No hay canciones en este álbum</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {currentAlbum.songs.map((song, idx) => (
                    <div 
                      key={song.id} 
                      onClick={() => playSong(song)}
                      className="grid grid-cols-12 px-6 py-4 hover:bg-zinc-800/40 rounded-xl transition-all group items-center cursor-pointer"
                    >
                      <div className="col-span-1 text-zinc-500 font-bold group-hover:text-indigo-400">
                        {currentSong?.id === song.id && isPlaying ? <div className="animate-pulse">●</div> : idx + 1}
                      </div>
                      <div className="col-span-8 flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden flex-shrink-0">
                          <img src={song.coverUrl || currentAlbum.coverUrl} className="w-full h-full object-cover" />
                        </div>
                        <p className={`font-bold transition-colors text-lg ${currentSong?.id === song.id ? 'text-indigo-400' : 'text-zinc-100'}`}>{song.title}</p>
                      </div>
                      <div className="col-span-3 text-right text-zinc-500 font-mono text-sm">{song.duration}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Reproductor Flotante Estilo Spotify */}
      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 h-24 bg-black border-t border-zinc-800 px-6 flex items-center justify-between z-[100] animate-in slide-in-from-bottom-full duration-500">
          <div className="flex items-center gap-4 w-[30%]">
            <div className="w-14 h-14 rounded-lg overflow-hidden shadow-2xl border border-zinc-800">
              <img src={currentSong.coverUrl || currentAlbum?.coverUrl || `https://picsum.photos/seed/${currentSong.id}/100/100`} className="w-full h-full object-cover" />
            </div>
            <div className="truncate">
              <h4 className="font-bold text-sm text-zinc-100 hover:underline cursor-pointer truncate">{currentSong.title}</h4>
              <p className="text-[11px] text-zinc-400 hover:text-white cursor-pointer truncate">{currentBand?.name}</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 flex-1 max-w-[40%]">
            <div className="flex items-center gap-6">
              <SkipBack className="text-zinc-400 hover:text-white transition-colors cursor-pointer" size={20} />
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-9 h-9 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause fill="black" size={20} /> : <Play fill="black" size={20} className="ml-0.5" />}
              </button>
              <SkipForward className="text-zinc-400 hover:text-white transition-colors cursor-pointer" size={20} />
            </div>
            <div className="w-full flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 w-8 text-right">0:{progress.toString().padStart(2, '0')}</span>
              <div className="flex-1 h-1 bg-zinc-800 rounded-full relative group cursor-pointer overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-indigo-500 group-hover:bg-indigo-400 transition-all" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="text-[10px] text-zinc-500 w-8">{currentSong.duration}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 w-[30%]">
             <Volume2 className="text-zinc-400" size={18} />
             <div className="w-24 h-1 bg-zinc-800 rounded-full relative group cursor-pointer">
                <div className="absolute top-0 left-0 h-full w-[80%] bg-zinc-400 group-hover:bg-indigo-400"></div>
             </div>
          </div>
        </div>
      )}

      {/* Modales */}
      {isCreatingBand && (
        <CreateBandModal 
          onClose={() => setIsCreatingBand(false)} 
          onSave={addBand} 
          setAiLoading={setAiLoading}
          aiLoading={aiLoading}
        />
      )}
      {isCreatingAlbum && selectedBandId && (
        <CreateAlbumModal 
          onClose={() => setIsCreatingAlbum(false)} 
          onSave={(album) => addAlbum(selectedBandId, album)} 
        />
      )}
      {isAddingSong && selectedBandId && selectedAlbumId && (
        <AddSongModal 
          genre={currentAlbum?.genre || ''}
          albumTitle={currentAlbum?.title || ''}
          albumCover={currentAlbum?.coverUrl || ''}
          onClose={() => setIsAddingSong(false)}
          onSave={(song) => addSong(selectedBandId, selectedAlbumId, song)}
        />
      )}
    </div>
  );
};

// Pantalla de Inicio de Sesión / Registro
const AuthScreen: React.FC<{ onAuthSuccess: (acc: UserAccount) => void }> = ({ onAuthSuccess }) => {
  const [bandName, setBandName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!bandName || !password) return setError('Completa todos los campos');

    const accounts: UserAccount[] = JSON.parse(localStorage.getItem('vibe_studio_accounts') || '[]');
    const existing = accounts.find(a => a.username.toLowerCase() === bandName.toLowerCase());

    if (existing) {
      if (existing.password === password) {
        onAuthSuccess(existing);
      } else {
        setError('Contraseña incorrecta');
      }
    } else {
      // Crear nueva cuenta
      const newAcc = { 
        username: bandName, 
        password: password, 
        id: Math.random().toString(36).substr(2, 9) 
      };
      localStorage.setItem('vibe_studio_accounts', JSON.stringify([...accounts, newAcc]));
      onAuthSuccess(newAcc);
    }
  };

  return (
    <div className="h-screen w-full bg-[#09090b] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,_#4f46e533,_transparent_40%)]"></div>
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,_#4f46e522,_transparent_40%)]"></div>
      
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative z-10 space-y-10 border-t-zinc-700/30">
        <div className="text-center space-y-4">
          <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-600/30 rotate-3">
            <Music size={40} className="text-white" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter">VibeStudio</h1>
          <p className="text-zinc-500 font-medium">Gestiona tu identidad musical profesional</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p className="text-red-400 text-xs font-bold text-center bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</p>}
          
          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" size={20} />
              <input 
                type="text"
                value={bandName}
                onChange={e => setBandName(e.target.value)}
                placeholder="Nombre de la Banda / Artista"
                className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold placeholder:font-normal placeholder:text-zinc-600"
                required
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" size={20} />
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña del Estudio"
                className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold placeholder:font-normal placeholder:text-zinc-600"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-white text-black py-4 rounded-2xl font-black text-lg hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-2xl shadow-white/10"
          >
            Entrar al Estudio
          </button>
          
          <p className="text-center text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
            Tus datos se guardan automáticamente en este navegador
          </p>
        </form>
      </div>
    </div>
  );
};

const CreateBandModal: React.FC<{ 
  onClose: () => void; 
  onSave: (band: Band) => void; 
  setAiLoading: (v: boolean) => void;
  aiLoading: boolean;
}> = ({ onClose, onSave, setAiLoading, aiLoading }) => {
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const handleAiBrainstorm = async () => {
    if (!genre) return alert('¡Indica un género primero!');
    setAiLoading(true);
    try {
      const result = await brainstormBandDetails(genre, "única y disruptiva");
      setName(result.bandName);
      setBio(result.bio);
    } catch (e) {
      alert('IA no disponible.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImage(URL.createObjectURL(file));
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[110] p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="text-2xl font-black">Crear Nueva Agrupación</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">Cerrar</button>
        </div>
        <form onSubmit={e => {
          e.preventDefault();
          onSave({ id: Math.random().toString(36).substr(2, 9), name, genre, bio, imageUrl: image || `https://picsum.photos/seed/${name}/600/600`, albums: [] });
        }} className="p-8 space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Estilo Predominante</label>
              <input value={genre} onChange={e => setGenre(e.target.value)} placeholder="Ej. Cyberpunk Rock" className="w-full bg-black/30 border border-zinc-800 rounded-xl p-3 outline-none focus:ring-1 focus:ring-indigo-500" required />
            </div>
            <div className="self-end">
              <button type="button" onClick={handleAiBrainstorm} disabled={aiLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl disabled:opacity-50 transition-all">
                <BrainCircuit size={20} />
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nombre del Proyecto</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Los Hologramas" className="w-full bg-black/30 border border-zinc-800 rounded-xl p-3 outline-none focus:ring-1 focus:ring-indigo-500" required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Foto de Perfil de Banda</label>
            <div className="relative group h-40 border-2 border-dashed border-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden hover:border-indigo-600 transition-colors">
              {image ? <img src={image} className="w-full h-full object-cover" /> : <ImageIcon className="text-zinc-700" size={32} />}
              <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>
          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-bold transition-all">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black transition-all shadow-xl">Guardar Banda</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateAlbumModal: React.FC<{ onClose: () => void; onSave: (album: Album) => void; }> = ({ onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [cover, setCover] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCover(URL.createObjectURL(file));
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[110] p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-zinc-800">
          <h3 className="text-2xl font-black">Nuevo Álbum de Estudio</h3>
        </div>
        <form onSubmit={e => {
          e.preventDefault();
          onSave({ id: Math.random().toString(36).substr(2, 9), bandId: '', title, genre, year, coverUrl: cover || `https://picsum.photos/seed/${title}/600/600`, songs: [] });
        }} className="p-8 space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Título de la Obra</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. El Silencio del Mañana" className="w-full bg-black/30 border border-zinc-800 rounded-xl p-3 outline-none focus:ring-1 focus:ring-indigo-500" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Género</label>
              <input value={genre} onChange={e => setGenre(e.target.value)} placeholder="Rock..." className="w-full bg-black/30 border border-zinc-800 rounded-xl p-3 outline-none" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Año</label>
              <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="w-full bg-black/30 border border-zinc-800 rounded-xl p-3 outline-none" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Portada Principal</label>
            <div className="mt-2 h-40 border-2 border-dashed border-zinc-800 rounded-2xl flex items-center justify-center relative overflow-hidden group hover:border-indigo-600 transition-colors">
              {cover ? <img src={cover} className="w-full h-full object-cover" /> : <ImageIcon className="text-zinc-700" size={32} />}
              <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>
          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-bold transition-all">Descartar</button>
            <button type="submit" className="flex-1 px-4 py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black transition-all shadow-xl">Finalizar Álbum</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddSongModal: React.FC<{ genre: string; albumTitle: string; albumCover: string; onClose: () => void; onSave: (song: Song) => void; }> = ({ albumTitle, genre, albumCover, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('3:45');
  const [songCover, setSongCover] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleAiSuggest = async () => {
    setIsAiLoading(true);
    try {
      const titles = await suggestTrackNames(albumTitle, genre);
      setSuggestions(titles);
    } catch (e) {
      alert('IA no disponible');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'image') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'audio') {
        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
      } else {
        setSongCover(URL.createObjectURL(file));
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[110] p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
        <div className="p-8 border-b border-zinc-800">
          <h3 className="text-2xl font-black">Registrar Nueva Pista</h3>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave({ id: Math.random().toString(36).substr(2, 9), albumId: '', title, duration, fileUrl: '#', coverUrl: songCover || albumCover }); }} className="p-8 space-y-6">
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Título de la Pista</label>
              <button type="button" onClick={handleAiSuggest} disabled={isAiLoading} className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded">
                <BrainCircuit size={12} /> {isAiLoading ? 'Generando...' : 'Ideas IA'}
              </button>
            </div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Horizonte Líquido" className="w-full bg-black/30 border border-zinc-800 rounded-xl p-3 outline-none focus:ring-1 focus:ring-indigo-500" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Archivo de Audio</label>
               <div className="relative h-12 bg-black/30 border border-zinc-800 rounded-xl flex items-center px-4 overflow-hidden group hover:border-indigo-600 transition-colors">
                  <Upload className="text-zinc-600 mr-3" size={16} />
                  <span className="text-xs text-zinc-500 truncate">Sube tu grabación</span>
                  <input type="file" accept="audio/*,video/*" onChange={e => handleFileChange(e, 'audio')} className="absolute inset-0 opacity-0 cursor-pointer" />
               </div>
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Portada Específica</label>
               <div className="relative h-12 bg-black/30 border border-zinc-800 rounded-xl flex items-center px-4 overflow-hidden group hover:border-indigo-600 transition-colors">
                  <ImageIcon className="text-zinc-600 mr-3" size={16} />
                  <span className="text-xs text-zinc-500 truncate">{songCover ? 'Imagen cargada' : 'Foto / Galería'}</span>
                  <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'image')} className="absolute inset-0 opacity-0 cursor-pointer" />
               </div>
             </div>
          </div>

          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 p-4 bg-black/40 rounded-2xl border border-zinc-800">
              {suggestions.map((s, idx) => (
                <button key={idx} type="button" onClick={() => setTitle(s)} className="text-[10px] px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-full hover:bg-zinc-700 transition-colors text-zinc-300 font-black">{s}</button>
              ))}
            </div>
          )}

          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-bold transition-all">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black transition-all shadow-xl">Añadir Canción</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;
