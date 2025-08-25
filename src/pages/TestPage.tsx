import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function TestPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Home className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          应用正常运行！
        </h1>
        
        <p className="text-gray-600 mb-6">
          如果您能看到这个页面，说明应用已经成功部署并正常工作。
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
          
          <div className="text-sm text-gray-500">
            <p>当前时间: {new Date().toLocaleString()}</p>
            <p>环境: {import.meta.env.MODE}</p>
            <p>URL: {window.location.href}</p>
          </div>
        </div>
      </div>
    </div>
  );
}