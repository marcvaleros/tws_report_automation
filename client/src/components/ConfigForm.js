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
      await axios.post(`/api/store-credentials`, account);
      // await axios.post(`${process.env.REACT_APP_BASE_URL}/api/store-credentials`, account);
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
    <div className="flex justify-center items-center  min-h-screen md:bg-gradient-to-b from-darkorange to-coolerorange sm:bg-white">
      <div className="w-full max-w-lg p-6 bg-white shadow-md rounded-lg md:my-2 sm:mx-4">
        <img src='/ringcentral-blk.png' alt='' width={350} height={350} className='mx-auto sm:w-48 md:w-60 lg:w-72'/>
        <h2 className="text-2xl font-bold mb-6 text-[#007DB8] sm:text-lg md:text-xl lg:text-2xl">Add a user to join the party!</h2>
        <form onSubmit={handleSubmit} className="space-y-4 ">
          <div className="flex flex-col">
            <label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-1 sm:text-xs md:text-sm lg:text-base">Name</label>
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
            <label htmlFor="jwt" className="text-sm font-semibold text-gray-700 mb-1 sm:text-xs md:text-sm lg:text-base">RingCentral JWT</label>
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
            className="w-full py-2 px-4 bg-[#007DB8] text-white font-semibold rounded-lg shadow-md hover:bg-[#275f79] focus:outline-none focus:ring-2 focus:bg-[#63a4c2] ease-in-out  sm:text-sm md:text-base lg:text-lg"
          >
            Save Configuration
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConfigForm;