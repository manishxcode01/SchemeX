import { useEffect, useState } from 'react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Schemes from './pages/Schemes';
import SchemeDetail from './pages/SchemeDetail';
import Onboarding from './pages/Onboarding';
import Assistant from './pages/Assistant';
import Admin from './pages/Admin';
import { hydrateData, SCHEMES } from './data/schemes';
import { fetchBootstrapData } from './data/api';
import { supabase } from './data/api';
import { getCurrentProfile } from './data/auth';
import Auth from './pages/Auth';
import PublicPage from './pages/PublicPage';
import Profile from './pages/Profile';
import FloatingAssistant from './components/FloatingAssistant';

type Page = 'landing' | 'home' | 'contact' | 'services' | 'login' | 'dashboard' | 'profile' | 'schemes' | 'scheme-detail' | 'onboarding' | 'assistant' | 'admin' | 'matches';

function AppContent() {
  const [page, setPage] = useState<Page>('landing');
  const [schemeId, setSchemeId] = useState<string>('');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [, setDataVersion] = useState(0);

  useEffect(() => {
    fetchBootstrapData()
      .then(data => {
        hydrateData(data);
        setDataVersion(version => version + 1);
      })
      .catch(() => {
        // The bundled dataset keeps the UI usable while the API is unavailable.
      });
  }, []);

  useEffect(() => {
    if (window.location.pathname !== '/auth/callback') return;
    supabase?.auth.getSession().then(({ data }) => {
      if (data.session) setPage('onboarding');
      else setPage('login');
      window.history.replaceState({}, document.title, '/');
    });
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange(() => {
      getCurrentProfile().then(profile => {
        if (profile) {
          hydrateData({ schemes: SCHEMES, profile });
          setDataVersion(version => version + 1);
        }
      }).catch(() => undefined);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const navigate = (p: string, id?: string) => {
    if (p === 'assistant') {
      setAssistantOpen(true);
      return;
    }
    setPage(p as Page);
    if (id) setSchemeId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  let content = <Landing onNavigate={navigate} />;
  if (page === 'home' || page === 'contact' || page === 'services') content = <PublicPage page={page} onNavigate={navigate} />;
  if (page === 'login') content = <Auth onNavigate={navigate} />;
  if (page === 'dashboard' || page === 'matches') content = <Dashboard onNavigate={navigate} />;
  if (page === 'profile') content = <Profile onNavigate={navigate} />;
  if (page === 'schemes') content = <Schemes onNavigate={navigate} />;
  if (page === 'scheme-detail') content = <SchemeDetail schemeId={schemeId} onNavigate={navigate} />;
  if (page === 'onboarding') content = <Onboarding onNavigate={navigate} />;
  if (page === 'assistant') content = <Assistant onNavigate={navigate} />;
  if (page === 'admin') content = <Admin onNavigate={navigate} />;

  return <>{content}<FloatingAssistant open={assistantOpen} onOpen={() => setAssistantOpen(true)} onClose={() => setAssistantOpen(false)} /></>;
}

export default AppContent;
