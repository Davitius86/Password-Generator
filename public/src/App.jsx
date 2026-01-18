import React, { useState, useEffect } from 'react';
import { Wifi, Clock, Trash2, Key, AlertCircle } from 'lucide-react';

const ModemPasswordGenerator = () => {
  const [macAddress, setMacAddress] = useState('');
  const [passwords, setPasswords] = useState([]);
  const [error, setError] = useState('');
  const [currentPassword, setCurrentPassword] = useState(null);

  useEffect(() => {
    loadPasswords();
  }, []);

  const loadPasswords = () => {
    try {
      const stored = localStorage.getItem('modemPasswords');
      if (stored) {
        setPasswords(JSON.parse(stored).sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch (err) {
      console.log('No saved passwords yet');
    }
  };

  const savePasswords = (newPasswords) => {
    localStorage.setItem('modemPasswords', JSON.stringify(newPasswords));
    setPasswords(newPasswords.sort((a, b) => b.timestamp - a.timestamp));
  };

  const validateMacAddress = (mac) => {
    const cleanMac = mac.replace(/[:\-\s]/g, '').toUpperCase();
    return /^[0-9A-F]{12}$/.test(cleanMac);
  };

  const generatePassword = (mac, timestamp) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let seed = 0;
    const input = mac + timestamp.toString();
    
    for (let i = 0; i < input.length; i++) {
      seed = ((seed << 5) - seed) + input.charCodeAt(i);
      seed = seed & seed;
    }
    
    let password = '';
    for (let i = 0; i < 16; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      password += chars[seed % chars.length];
    }
    
    return password;
  };

  const handleGenerate = () => {
    const cleanMac = macAddress.replace(/[:\-\s]/g, '').toUpperCase();
    
    if (!validateMacAddress(macAddress)) {
      setError('არასწორი MAC მისამართი! გამოიყენეთ ფორმატი: 0C4933764EB0');
      setCurrentPassword(null);
      return;
    }

    setError('');
    
    const existingPassword = passwords.find(p => p.mac === cleanMac && !isExpired(p.expiryDate));
    
    if (existingPassword) {
      const daysLeft = getDaysRemaining(existingPassword.expiryDate);
      setError(`ამ MAC მისამართს უკვე აქვს აქტიური პაროლი! დარჩენილია ${daysLeft} დღე.`);
      setCurrentPassword(existingPassword);
      setMacAddress('');
      return;
    }
    
    const timestamp = Date.now();
    const expiryDate = new Date(timestamp + 30 * 24 * 60 * 60 * 1000);
    const password = generatePassword(cleanMac, timestamp);

    const newPassword = {
      mac: cleanMac,
      password: password,
      timestamp: timestamp,
      expiryDate: expiryDate.getTime(),
      createdAt: new Date(timestamp).toLocaleString('ka-GE')
    };

    const updatedPasswords = [...passwords, newPassword];
    savePasswords(updatedPasswords);
    setCurrentPassword(newPassword);
    setMacAddress('');
  };

  const handleDelete = (mac, timestamp) => {
    const updatedPasswords = passwords.filter(p => !(p.mac === mac && p.timestamp === timestamp));
    savePasswords(updatedPasswords);
  };

  const isExpired = (expiryDate) => {
    return Date.now() > expiryDate;
  };

  const getDaysRemaining = (expiryDate) => {
    const diff = expiryDate - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Wifi className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">მოდემის პაროლის გენერატორი</h1>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MAC მისამართი
              </label>
              <input
                type="text"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value.toUpperCase())}
                placeholder="0C4933764EB0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                maxLength="17"
              />
              <p className="mt-1 text-sm text-gray-500">
                ფორმატი: 12 სიმბოლო (0-9, A-F)
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {currentPassword && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-300 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-indigo-900">გენერირებული პაროლი</h3>
                </div>
                
                <div className="bg-white rounded-lg p-4 mb-3">
                  <p className="text-xs text-gray-500 mb-1">MAC მისამართი:</p>
                  <p className="font-mono text-lg font-bold text-gray-800 mb-3">
                    {currentPassword.mac}
                  </p>
                  
                  <p className="text-xs text-gray-500 mb-1">პაროლი:</p>
                  <p className="font-mono text-2xl font-bold text-indigo-600 break-all">
                    {currentPassword.password}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">შექმნილია:</p>
                    <p className="font-medium text-gray-800">{currentPassword.createdAt}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">ვადა ამოიწურება:</p>
                    <p className="font-medium text-gray-800">
                      {new Date(currentPassword.expiryDate).toLocaleString('ka-GE')}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-indigo-200">
                  <p className="text-sm text-center">
                    <span className="text-gray-600">დარჩენილი: </span>
                    <span className="font-bold text-green-600">
                      {getDaysRemaining(currentPassword.expiryDate)} დღე
                    </span>
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Key className="w-5 h-5" />
              პაროლის გენერირება
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-800">ისტორია</h2>
          </div>

          {passwords.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Wifi className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>ჯერ არ გაქვთ გენერირებული პაროლები</p>
            </div>
          ) : (
            <div className="space-y-3">
              {passwords.map((item, index) => {
                const expired = isExpired(item.expiryDate);
                const daysLeft = getDaysRemaining(item.expiryDate);
                
                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      expired ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-lg font-semibold text-gray-800">
                            {item.mac}
                          </span>
                          {expired && (
                            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                              ვადაგასული
                            </span>
                          )}
                        </div>
                        
                        <div className="bg-white border border-gray-300 rounded-lg p-3 mb-2">
                          <p className="text-xs text-gray-500 mb-1">პაროლი:</p>
                          <p className="font-mono text-lg font-bold text-indigo-600 break-all">
                            {item.password}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500">შექმნის თარიღი:</p>
                            <p className="font-medium text-gray-700">{item.createdAt}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">ვადის ამოწურვა:</p>
                            <p className={`font-medium ${expired ? 'text-red-600' : 'text-gray-700'}`}>
                              {new Date(item.expiryDate).toLocaleString('ka-GE')}
                            </p>
                          </div>
                        </div>
                        
                        {!expired && (
                          <div className="mt-2">
                            <p className="text-sm">
                              <span className="text-gray-500">დარჩენილი დღეები: </span>
                              <span className={`font-semibold ${
                                daysLeft <= 7 ? 'text-orange-600' : 'text-green-600'
                              }`}>
                                {daysLeft} დღე
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleDelete(item.mac, item.timestamp)}
                        className="ml-4 p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                        title="წაშლა"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModemPasswordGenerator;
