
import React from 'react';

interface HeaderProps {
    onOpenApiKeyModal: () => void;
    hasUserKey: boolean;
}

const Header: React.FC<HeaderProps> = ({ onOpenApiKeyModal, hasUserKey }) => {
    return (
        <header className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
                    <span className="text-zinc-900 font-bold text-xl">F</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                    FASHION AI BUILDER
                </h1>
            </div>

            <button
                onClick={onOpenApiKeyModal}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${hasUserKey
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:border-amber-500/50'
                    }`}
            >
                <span>API KEY</span>
                {hasUserKey ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <div className="w-2 h-2 rounded-full bg-zinc-500" />
                )}
            </button>
        </header>
    );
};

export default Header;
