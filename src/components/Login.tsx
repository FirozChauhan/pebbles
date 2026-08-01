import React from 'react';
import { useAuth } from '../AuthContext.tsx';

const Login: React.FC = () => {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) {
    return <div className="relative flex items-center justify-center h-screen">Loading...</div>;
  }

  if (user) {
    return (
      <div className="relative flex items-center space-x-4 p-4 bg-white shadow rounded-lg">
        <img 
          src={user.photoURL || '/default-avatar.png'} 
          alt="Profile" 
          className="w-10 h-10 rounded-full"
        />
        <div>
          <p className="font-medium">{user.displayName || user.email}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <button
          onClick={signOut}
          className="ml-auto px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className=" relative flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold mb-4">Resume Optimizer</h1>
      <button
        onClick={signIn}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center space-x-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.21 11.19.6.11.82-.25.82-.57 0-.28-.01-1.03-.02-2.01-3.34.71-4.04-1.59-4.04-1.59-.55-1.37-1.34-1.73-1.34-1.73-1.09-.73.08-.72.08-.72 1.2.08 1.84 1.22 1.84 1.22 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.58-2.67-.3-5.47-1.31-5.47-5.84 0-1.29.47-2.35 1.24-3.18-.13-.3-.54-1.51.11-3.15 0 0 1.01-.32 3.3 1.21.96-.26 1.98-.39 3-.4 1.02 0 2.05.14 3 .4 2.28-1.53 3.29-1.21 3.29-1.21.65 1.64.24 2.85.12 3.15.77.83 1.23 1.89 1.23 3.18 0 4.54-2.81 5.53-5.49 5.83.43.36.81 1.09.81 2.2 0 1.59-.01 2.87-.01 3.26 0 .32.21.69.82.57C20.56 21.92 24 17.5 24 12.29 24 5.78 18.63.5 12 .5z" />
        </svg>
        <span>Sign in with GitHub</span>
      </button>
    </div>
  );
};

export default Login;
