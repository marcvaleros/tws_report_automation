import React, { useState } from 'react';
import axios from 'axios';

const ConfigForm = () => {
  const [account, setAccount] = useState({
    jwt: '',
    name: '',
  });

  const handleChange = (e) => {
    setAccount({ ...account, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // console.log(account);
      await axios.post(`/api/store-credentials`, account); // This will be proxied to Node.js backend
      // await axios.post(`${process.env.REACT_APP_BASE_URL}/api/store-credentials`, account); // This will be proxied to Node.js backend
      setAccount({
        jwt: '',
        name: '',
      });
      alert('Configuration updated successfully!');
    } catch (error) {
      setAccount({
        jwt: '',
        name: '',
      });
      console.error('Error updating configuration', error);
      alert('Failed to update configuration');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Subscribe to RC Recording Automation</h2>
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
            <label htmlFor="jwt" className="text-sm font-semibold text-gray-700 mb-1">Enter RingCentral JWT:</label>
            <input
              id="jwt"
              name="jwt"
              type="text"
              value={account.jwt}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter JWT Credential"
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
