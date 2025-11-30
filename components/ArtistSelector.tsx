import React, { useState, useEffect, useMemo } from 'react';
import { Artist } from '../types';

// Enhanced Artist Pool with Images and Recommendation Tags
const AVAILABLE_ARTISTS: Artist[] = [
    // K-Pop
    { id: 'bts', name: 'BTS', category: 'kpop', tags: ['boygroup', 'dance', 'global'], imageUrl: 'https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?auto=format&fit=crop&w=300&q=80' },
    { id: 'bp', name: 'BLACKPINK', category: 'kpop', tags: ['girlgroup', 'dance', 'fashion'], imageUrl: 'https://images.unsplash.com/photo-1619983081563-430f63602796?auto=format&fit=crop&w=300&q=80' },
    { id: 'newjeans', name: 'NewJeans', category: 'kpop', tags: ['girlgroup', 'y2k', 'fresh'], imageUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&q=80' },
    { id: 'twice', name: 'TWICE', category: 'kpop', tags: ['girlgroup', 'cute', 'pop'], imageUrl: 'https://images.unsplash.com/photo-1596906296173-b3c990dc6210?auto=format&fit=crop&w=300&q=80' },
    { id: 'ive', name: 'IVE', category: 'kpop', tags: ['girlgroup', 'elegant', 'pop'], imageUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&w=300&q=80' },
    { id: 'svt', name: 'SEVENTEEN', category: 'kpop', tags: ['boygroup', 'self-produced', 'performance'], imageUrl: 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?auto=format&fit=crop&w=300&q=80' },
    { id: 'aespa', name: 'aespa', category: 'kpop', tags: ['girlgroup', 'sci-fi', 'strong'], imageUrl: 'https://images.unsplash.com/photo-1496337589254-7e19d01cec44?auto=format&fit=crop&w=300&q=80' },
    { id: 'skz', name: 'Stray Kids', category: 'kpop', tags: ['boygroup', 'hiphop', 'noise'], imageUrl: 'https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=300&q=80' },
    { id: 'iu', name: 'IU', category: 'kpop', tags: ['solo', 'ballad', 'songwriter'], imageUrl: 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?auto=format&fit=crop&w=300&q=80' },
    { id: 'idle', name: '(G)I-DLE', category: 'kpop', tags: ['girlgroup', 'self-produced', 'bold'], imageUrl: 'https://images.unsplash.com/photo-1512413914633-b5043f4041ea?auto=format&fit=crop&w=300&q=80' },
    
    // Mandopop
    { id: 'jay', name: 'Jay Chou', category: 'mandopop', tags: ['male', 'rnb', 'classic'], imageUrl: 'https://images.unsplash.com/photo-1517230874863-439db005e155?auto=format&fit=crop&w=300&q=80' },
    { id: 'jj', name: 'JJ Lin', category: 'mandopop', tags: ['male', 'ballad', 'vocal'], imageUrl: 'https://images.unsplash.com/photo-1525994886773-080587e161c2?auto=format&fit=crop&w=300&q=80' },
    { id: 'gem', name: 'G.E.M.', category: 'mandopop', tags: ['female', 'power', 'rock'], imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' },
    { id: 'eason', name: 'Eason Chan', category: 'mandopop', tags: ['male', 'emotional', 'classic'], imageUrl: 'https://images.unsplash.com/photo-1474976335319-63369b221f97?auto=format&fit=crop&w=300&q=80' },
    { id: 'jolin', name: 'Jolin Tsai', category: 'mandopop', tags: ['female', 'dance', 'icon'], imageUrl: 'https://images.unsplash.com/photo-1520872024865-3ff2805d8bb3?auto=format&fit=crop&w=300&q=80' },
    { id: 'eric', name: 'Eric Chou', category: 'mandopop', tags: ['male', 'ballad', 'newgen'], imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80' },
    { id: 'mayday', name: 'Mayday', category: 'mandopop', tags: ['band', 'rock', 'anthem'], imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=300&q=80' },
    { id: 'hebe', name: 'Hebe Tien', category: 'mandopop', tags: ['female', 'indie-pop', 'vocal'], imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=300&q=80' },
    { id: 'ronghao', name: 'Li Ronghao', category: 'mandopop', tags: ['male', 'songwriter', 'chill'], imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' },
    { id: 'soda', name: 'Sodagreen', category: 'mandopop', tags: ['band', 'indie', 'poetic'], imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80' },
];

interface ArtistSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (selectedArtists: string[]) => void;
}

export const ArtistSelector: React.FC<ArtistSelectorProps> = ({ isOpen, onClose, onSave }) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('user_favorite_artists_ids');
        if (saved) {
            setSelectedIds(JSON.parse(saved));
        }
    }, []);

    const toggleArtist = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    // ----------------------------------------------------------------------------------
    // Recommendation Engine: Sort artists based on similarity to selected artists
    // ----------------------------------------------------------------------------------
    const sortedArtists = useMemo(() => {
        // 1. Gather tags from currently selected artists
        const selectedTags = new Set<string>();
        AVAILABLE_ARTISTS.filter(a => selectedIds.includes(a.id)).forEach(a => {
            a.tags?.forEach(t => selectedTags.add(t));
        });

        // 2. Clone list to sort
        return [...AVAILABLE_ARTISTS].sort((a, b) => {
            const aSelected = selectedIds.includes(a.id);
            const bSelected = selectedIds.includes(b.id);

            // Selected items always stay near top for visibility? 
            // The user asked for "recommendation list", so arguably unselected but relevant should be high.
            // Let's keep selected at top to show what I have, then relevant ones.
            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;

            // Calculate similarity score
            const scoreA = a.tags?.filter(t => selectedTags.has(t)).length || 0;
            const scoreB = b.tags?.filter(t => selectedTags.has(t)).length || 0;

            // Sort by score descending
            return scoreB - scoreA;
        });
    }, [selectedIds]);

    const handleSave = () => {
        localStorage.setItem('user_favorite_artists_ids', JSON.stringify(selectedIds));
        const selectedNames = AVAILABLE_ARTISTS.filter(a => selectedIds.includes(a.id)).map(a => a.name);
        onSave(selectedNames);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose}></div>
            <div className="relative bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/95 backdrop-blur z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Select Artists</h2>
                        <p className="text-zinc-400 text-sm mt-1">Tap artists you like. We'll recommend similar ones.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {sortedArtists.map(artist => {
                            const isSelected = selectedIds.includes(artist.id);
                            return (
                                <button
                                    key={artist.id}
                                    onClick={() => toggleArtist(artist.id)}
                                    className={`relative group rounded-2xl overflow-hidden aspect-[3/4] transition-all duration-300 ${
                                        isSelected 
                                            ? 'ring-4 ring-pink-500 scale-[0.98]' 
                                            : 'hover:scale-105 hover:ring-2 hover:ring-white/20'
                                    }`}
                                >
                                    {/* Image */}
                                    <img 
                                        src={artist.imageUrl} 
                                        alt={artist.name} 
                                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isSelected ? 'opacity-100 saturate-100' : 'opacity-70 grayscale-[0.5] group-hover:grayscale-0 group-hover:opacity-100'}`}
                                    />
                                    
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90"></div>

                                    {/* Selection Checkmark */}
                                    <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-pink-500 scale-100' : 'bg-white/20 scale-0 group-hover:scale-100'}`}>
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>

                                    {/* Info */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                                        <h3 className={`font-bold text-lg leading-tight ${isSelected ? 'text-white' : 'text-zinc-200'}`}>{artist.name}</h3>
                                        <p className="text-xs text-zinc-400 mt-1 capitalize opacity-0 group-hover:opacity-100 transition-opacity">
                                            {artist.tags?.slice(0, 2).join(', ')}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-zinc-900/95 backdrop-blur z-10 flex justify-between items-center">
                    <div className="text-sm text-zinc-400 hidden sm:block">
                        {selectedIds.length} artists selected
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button 
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-6 py-3 rounded-full text-zinc-300 font-medium hover:text-white transition-colors hover:bg-white/5"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            className="flex-1 sm:flex-none px-8 py-3 rounded-full bg-white text-black font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10"
                        >
                            Done
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};