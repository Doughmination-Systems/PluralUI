import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

export default function AuthSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    localStorage.setItem('plural_token', token);

    api.get('/api/me')
      .then(r => {
        if (!r.data?.system_name) {
          navigate('/settings/general?prompt=system_name', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      })
      .catch(() => navigate('/', { replace: true }));
  }, []);

  return <div className="loading-screen"><div className="spinner" /></div>;
}