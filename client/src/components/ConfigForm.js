import React, { useState } from 'react';
import axios from 'axios';

const ConfigForm = () => {
  const [account, setAccount] = useState({
    server: '',
    clientId: '',
    clientSecret: '',
    jwt: '',
    name: '',
  });

  const handleChange = (e) => {
    setAccount({ ...account, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/store-credentials', account); // This will be proxied to Node.js backend
      alert('Configuration updated successfully!');
    } catch (error) {
      console.error('Error updating configuration', error);
      alert('Failed to update configuration');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Update Configuration</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-1">Name:</label>
            <input
              id="name"
              name="name"
              type="text"
              value={account.name}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Account Name"
            />
          </div>
          
          <div className="flex flex-col">
            <label htmlFor="server" className="text-sm font-semibold text-gray-700 mb-1">Server:</label>
            <input
              id="server"
              name="server"
              type="text"
              value={account.server}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter server URL"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="clientId" className="text-sm font-semibold text-gray-700 mb-1">Client ID:</label>
            <input
              id="clientId"
              name="clientId"
              type="text"
              value={account.clientId}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Client ID"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="clientSecret" className="text-sm font-semibold text-gray-700 mb-1">Client Secret:</label>
            <input
              id="clientSecret"
              name="clientSecret"
              type="password"
              value={account.clientSecret}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Client Secret"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="jwt" className="text-sm font-semibold text-gray-700 mb-1">JWT:</label>
            <input
              id="jwt"
              name="jwt"
              type="text"
              value={account.jwt}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter JWT"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Configuration
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConfigForm;
