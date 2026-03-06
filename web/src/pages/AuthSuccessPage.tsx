import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AuthSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      localStorage.setItem('plural_token', token);
      refresh().then(() => navigate('/dashboard', { replace: true }));
    } else {
      navigate('/', { replace: true });
    }
  }, []);

  return <div className="loading-screen"><div className="spinner" /></div>;
}
