
import React, { useState, useEffect, useMemo } from 'react';
import { Artist } from '../types';

const AVAILABLE_ARTISTS: Artist[] = [
    // K-Pop
    { id: 'bts', name: 'BTS', category: 'kpop', tags: ['boygroup', 'dance', 'global'] },
    { id: 'bp', name: 'BLACKPINK', category: 'kpop', tags: ['girlgroup', 'dance', 'fashion'] },
    { id: 'newjeans', name: 'NewJeans', category: 'kpop', tags: ['girlgroup', 'y2k', 'fresh'] },
    { id: 'twice', name: 'TWICE', category: 'kpop', tags: ['girlgroup', 'cute', 'pop'] },
    { id: 'ive', name: 'IVE', category: 'kpop', tags: ['girlgroup', 'elegant', 'pop'] },
    { id: 'svt', name: 'SEVENTEEN', category: 'kpop', tags: ['boygroup', 'self-produced', 'performance'] },
    { id: 'aespa', name: 'aespa', category: 'kpop', tags: ['girlgroup', 'sci-fi', 'strong'] },
    { id: 'skz', name: 'Stray Kids', category: 'kpop', tags: ['boygroup', 'hiphop', 'noise'] },
    { id: 'iu', name: 'IU', category: 'kpop', tags: ['solo', 'ballad', 'songwriter'] },
    { id: 'idle', name: '(G)I-DLE', category: 'kpop', tags: ['girlgroup', 'self-produced', 'bold'] },
    
    // Mandopop
    { id: 'jay', name: 'Jay Chou', category: 'mandopop', tags: ['male', 'rnb', 'classic'] },
    { id: 'jj', name: 'JJ Lin', category: 'mandopop', tags: ['male', 'ballad', 'vocal'] },
    { id: 'gem', name: 'G.E.M.', category: 'mandopop', tags: ['female', 'power', 'rock'] },
    { id: 'eason', name: 'Eason Chan', category: 'mandopop', tags: ['male', 'emotional', 'classic'] },
    { id: 'jolin', name: 'Jolin Tsai', category: 'mandopop', tags: ['female', 'dance', 'icon'] },
    { id: 'eric', name: 'Eric Chou', category: 'mandopop', tags: ['male', 'ballad', 'newgen'] },
    { id: 'mayday', name: 'Mayday', category: 'mandopop', tags: ['band', 'rock', 'anthem'] },
    { id: 'hebe', name: 'Hebe Tien', category: 'mandopop', tags: ['female', 'indie-pop', 'vocal'] },
    { id: 'ronghao', name: 'Li Ronghao', category: 'mandopop', tags: ['male', 'songwriter', 'chill'] },
    { id: 'soda', name: 'Sodagreen', category: 'mandopop', tags: ['band', 'indie', 'poetic'] },
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

    const sortedArtists = useMemo(() => {
        const selectedTags = new Set<string>();
        AVAILABLE_ARTISTS.filter(a => selectedIds.includes(a.id)).forEach(a => {
            a.tags?.forEach(t => selectedTags.add(t));
        });

        // Simple sort: Selected first, then by relevance to tags
        return [...AVAILABLE_ARTISTS].sort((a, b) => {
            const aSelected = selectedIds.includes(a.id);
            const bSelected = selectedIds.includes(b.id);
            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;
            
            const scoreA = a.tags?.filter(t => selectedTags.has(t)).length || 0;
            const scoreB = b.tags?.filter(t => selectedTags.has(t)).length || 0;
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
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose}></div>
            <div className="relative bg-zinc-900 border-t md:border border-white/10 rounded-t-3xl md:rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden">
                
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/95 backdrop-blur z-10 sticky top-0">
                    <div>
                        <h2 className="text-xl font-bold text-white">Customize Recommendations</h2>
                        <p className="text-zinc-400 text-xs mt-1">Select artists to tune your playlist</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                        <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
                    <div className="flex flex-wrap gap-3">
                        {sortedArtists.map(artist => {
                            const isSelected = selectedIds.includes(artist.id);
                            return (
                                <button
                                    key={artist.id}
                                    onClick={() => toggleArtist(artist.id)}
                                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                                        isSelected 
                                            ? 'bg-pink-600 border-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] scale-105' 
                                            : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600'
                                    }`}
                                >
                                    {artist.name}
                                </button>
                            );
                        })}
                    </div>
                    
                    <div className="mt-8 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                        <h3 className="text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Dynamic Rules</h3>
                        <ul className="text-xs text-zinc-500 space-y-1 list-disc pl-4">
                            <li>Selected artists prioritize similar genres.</li>
                            <li>"Quick Picks" & "K-Pop" categories strictly filter for female artists/groups.</li>
                            <li>Songs filtered for duration (2m - 4m).</li>
                        </ul>
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 bg-zinc-900/95 backdrop-blur z-10 flex gap-3 pb-safe-bottom">
                     <button 
                        onClick={() => { setSelectedIds([]); }}
                        className="px-6 py-3 rounded-xl text-zinc-400 font-medium hover:text-white transition-colors hover:bg-white/5 text-sm"
                    >
                        Reset
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-1 px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 active:scale-95 transition-all shadow-lg"
                    >
                        Apply Changes
                    </button>
                </div>

            </div>
        </div>
    );
};
