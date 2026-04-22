import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './components/Dashboard';
import FaceAnalysis from './components/FaceAnalysis';
import FaceRecognition from './components/FaceRecognition';
import History from './components/History';
import Auth from './components/Auth';
import Landing from './components/Landing';

export type Page = 'landing' | 'dashboard' | 'analysis' | 'recognition' | 'history';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      // Only redirect once when auth state is first determined
      if (user && window.location.pathname === '/' && currentPage === 'landing') {
        setCurrentPage('dashboard');
      }
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'analysis': return <FaceAnalysis />;
      case 'recognition': return <FaceRecognition />;
      case 'history': return <History />;
      default: return <Landing onStart={() => setCurrentPage('dashboard')} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex flex-col font-sans">
      {currentPage === 'landing' && !user ? (
        <Landing onStart={() => setCurrentPage('dashboard')} /> 
      ) : user ? (
        <>
          <Navbar user={user} />
          <div className="flex flex-1 overflow-hidden relative">
            <Sidebar activePage={currentPage} onNavigate={setCurrentPage} />
            <main className="flex-1 overflow-y-auto p-6 md:p-10 pb-32 md:pb-10">
              {renderPage()}
            </main>
            <MobileNav activePage={currentPage} onNavigate={setCurrentPage} />
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col">
           <Navbar user={{} as any} />
           <div className="flex-1 flex items-center justify-center p-6">
             <Auth />
           </div>
        </div>
      )}
    </div>
  );
}
