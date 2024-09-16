import React, { useState } from 'react';
import axios from 'axios';

const ConfigForm = () => {
  const [account, setAccount] = useState({
    server: '',
    clientId: '',
    clientSecret: '',
    jwt: '',
  });

  const handleChange = (e) => {
    setAccount({ ...account, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/configure', account); // This will be proxied to Node.js backend
      alert('Configuration updated successfully!');
    } catch (error) {
      console.error('Error updating configuration', error);
      alert('Failed to update configuration');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Server:
        <input name="server" value={account.server} onChange={handleChange} />
      </label>
      <label>
        Client ID:
        <input name="clientId" value={account.clientId} onChange={handleChange} />
      </label>
      <label>
        Client Secret:
        <input name="clientSecret" value={account.clientSecret} onChange={handleChange} />
      </label>
      <label>
        JWT:
        <input name="jwt" value={account.jwt} onChange={handleChange} />
      </label>
      <button type="submit">Save Configuration</button>
    </form>
  );
};

export default ConfigForm;