import React from "react";

export interface FullChartModalProps {
    title: string;
    children: React.ReactNode;
    onClose?: () => void;
}

export function FullChartModal({ title, children, onClose }: FullChartModalProps) {
    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
            <div className="bg-white w-[75vw] h-[65vh] rounded-2xl shadow-xl p-8 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-xl cursor-pointer"
                >
                    ✕
                </button>
                <h2 className="text-xl text-gray-900 mb-2">{title}</h2>
                <p className="text-sm text-gray-500 mb-4">Full-resolution view</p>
                <div className="w-full h-[calc(100%-80px)]">{children}</div>
            </div>
        </div>
    );
}
