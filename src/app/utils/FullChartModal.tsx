import React from "react";

export interface FullChartModalProps {
    title: string;
    children: React.ReactNode;
    onClose?: () => void;
}

export function FullChartModal({ title, children, onClose }: FullChartModalProps) {
    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 sm:p-8 overflow-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-[90vw] sm:max-w-[75vw] min-w-[300px]
                            max-h-[90vh] sm:max-h-[80vh] p-6 sm:p-8 relative flex flex-col">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-xl cursor-pointer z-10"
                >
                    ✕
                </button>

                {/* Header */}
                <div className="flex flex-col mb-4">
                    <h2 className="text-xl sm:text-2xl text-gray-900">{title}</h2>
                    <p className="text-sm text-gray-500">Full-resolution view</p>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-auto min-h-0">
                    {children}
                </div>
            </div>
        </div>
    );
}