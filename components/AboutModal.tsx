import React, { Fragment } from 'react';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
    return (
        <Fragment>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Modal Dialog */}
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="about-modal-title"
            >
                <div className={`bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}>
                    <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
                        <h2 id="about-modal-title" className="text-xl font-bold text-gray-800 dark:text-slate-200">About This App</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-green-600">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="p-6 space-y-4 text-gray-600 dark:text-slate-300">
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-slate-200">Developed & Created by:</span>
                            <span>Suhail Zubair</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-slate-200">Version:</span>
                            <span>1.0.0</span>
                        </div>
                         <div className="text-center pt-2">
                            <p className="font-semibold text-gray-700 dark:text-slate-200 mb-1">Purpose</p>
                            <p className="text-sm">To preserve and enrich the correct Qibla.</p>
                        </div>
                        <div className="pt-2 border-t border-gray-200 dark:border-slate-800 space-y-2">
                             <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-700 dark:text-slate-200">Email:</span>
                                <a href="mailto:msuhailcsubair@gmail.com" className="text-green-700 dark:text-green-500 hover:underline">msuhailcsubair@gmail.com</a>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-700 dark:text-slate-200">Website:</span>
                                <a href="https://islam360versal.com" target="_blank" rel="noopener noreferrer" className="text-green-700 dark:text-green-500 hover:underline">islam360versal.com</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    )
}

export default AboutModal;