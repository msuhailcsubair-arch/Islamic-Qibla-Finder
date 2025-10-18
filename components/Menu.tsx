import React, { Fragment } from 'react';

type Theme = 'auto' | 'light' | 'dark';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onChangeLocation: () => void;
  currentTheme: Theme;
  onChangeTheme: (theme: Theme) => void;
  onAbout: () => void;
}

const ThemeIcon: React.FC<{ theme: Theme }> = ({ theme }) => {
    if (theme === 'light') return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
    if (theme === 'dark') return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
    return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onChangeLocation, currentTheme, onChangeTheme, onAbout }) => {
  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-slate-800 shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
      >
        <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
          <h2 id="sidebar-title" className="text-lg font-semibold text-slate-800 dark:text-slate-200">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Close menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="p-4">
          <ul>
            <li className="mb-2">
              <button onClick={onChangeLocation} className="w-full flex items-center p-3 text-left rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Change Location
              </button>
            </li>
             <li className="mb-2">
              <button onClick={onAbout} className="w-full flex items-center p-3 text-left rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                About
              </button>
            </li>
          </ul>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
             <label className="px-3 text-sm font-semibold text-slate-500 dark:text-slate-400">Theme</label>
             <div className="mt-2 flex rounded-md bg-slate-100 dark:bg-slate-900 p-1">
                 {(['auto', 'light', 'dark'] as Theme[]).map(theme => (
                     <button
                        key={theme}
                        onClick={() => onChangeTheme(theme)}
                        className={`w-1/3 py-2 text-sm font-medium rounded capitalize transition-colors ${currentTheme === theme ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
                     >
                        <div className="flex justify-center items-center">
                            <ThemeIcon theme={theme} />
                        </div>
                     </button>
                 ))}
             </div>
          </div>
        </nav>
      </div>
    </Fragment>
  );
};

export default Sidebar;