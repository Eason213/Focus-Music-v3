import React, { useState, useEffect, useMemo } from 'react';
import { Artist } from '../types';

// Updated: Removed imageUrl, focusing on text/chips style
const AVAILABLE_ARTISTS: Omit<Artist, 'imageUrl'>[] = [
    // K-Pop
    { id: 'bts', name: 'BTS', category: 'kpop', tags: ['boygroup', 'dance', 'global'] },
    { id: 'bp', name: 'BLACKPINK', category: 'kpop', tags: ['girlgroup', 'dance', 'fashion'] },
    { id: 'newjeans', name: 'NewJeans', category: 'kpop', tags: ['girlgroup', 'y2k', 'fresh'] },
    { id: 'twice', name: 'TWICE', category: 'kpop', tags: ['girlgroup', 'cute', 'pop'] },
    { id: 'ive', name: 'IVE', category: 'kpop', tags: ['girlgroup', 'elegant', 'pop'] },
    { id: 'svt', name: 'SEVENTEEN', category: 'kpop', tags: ['boygroup', 'self-produced'] },
    { id: 'aespa', name: 'aespa', category: 'kpop', tags: ['girlgroup', 'sci-fi', 'strong'] },
    { id: 'skz', name: 'Stray Kids', category: 'kpop', tags: ['boygroup', 'hiphop', 'noise'] },
    { id: 'iu', name: 'IU', category: 'kpop', tags: ['solo', 'ballad', 'songwriter'] },
    { id: 'idle', name: '(G)I-DLE', category: 'kpop', tags: ['girlgroup', 'self-produced'] },
    
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
            try {
                setSelectedIds(JSON.parse(saved));
            } catch(e) {}
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
            <div className="relative bg-zinc-900 md:border border-white/10 rounded-t-3xl md:rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
                
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/95 backdrop-blur z-10 rounded-t-3xl">
                    <div>
                        <h2 className="text-xl font-bold text-white">Customize Artists</h2>
                        <p className="text-zinc-400 text-xs mt-0.5">Select to boost recommendations</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-zinc-950">
                    <div className="flex flex-wrap gap-2">
                        {sortedArtists.map(artist => {
                            const isSelected = selectedIds.includes(artist.id);
                            return (
                                <button
                                    key={artist.id}
                                    onClick={() => toggleArtist(artist.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                                        isSelected 
                                            ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-900/30' 
                                            : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600'
                                    }`}
                                >
                                    {artist.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 bg-zinc-900/95 backdrop-blur z-10 flex gap-3 pb-safe-bottom">
                    <button 
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl text-zinc-400 font-medium hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-1 px-4 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors"
                    >
                        Save Preferences
                    </button>
                </div>

            </div>
        </div>
    );
};