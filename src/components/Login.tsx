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
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
          />
        </svg>
        <span>Sign in with Google</span>
      </button>
    </div>
  );
};

export default Login;
