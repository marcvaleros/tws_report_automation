import React, { useEffect, useState } from 'react';
import axios from 'axios';


const UserList = () => {
  const [users, setUsers] = useState([]);

    //do a fetch of all users in the database
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`/rc/users`);
      // const res = await axios.get(`${process.env.REACT_APP_BASE_URL}/rc/users`);
      console.log(res.data);
      setUsers(res.data);
    } catch (error) {
      console.log(`Error Fetching Users: ${error}`);
    }
  }

  useEffect(() => {
    fetchUsers();
  }
  ,[]);

  const deleteUser = async (id) => {
    try {
      await axios.delete(`/rc/user/${id}`);
      // await axios.delete(`${process.env.REACT_APP_BASE_URL}/rc/user/${id}`);
      setUsers(users.filter(user => user.id !== id)); // Remove the deleted user from the list
      fetchUsers();
    } catch (error) {
      console.log(`Error Deleting User: ${error}`);
    }
  }

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-white mx-2 cursor-pointer">
      {users?.length > 0 ? (
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="bg-[#007DB8] text-white uppercase text-[12px] leading-normal">
              <tr>
                <th className="py-3 px-6 text-left">ID</th>
                <th className="py-3 px-6 text-left">Name</th>
                <th className="py-3 px-6 text-left">Extension ID</th>
                <th className="py-3 px-6 text-left">JWT</th>
                <th className="py-3 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-[#007DB8] text-sm font-light">
              {users.map((user, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left whitespace-nowrap">{user.id}</td>
                  <td className="py-3 px-6 text-left">{user.name}</td>
                  <td className="py-3 px-6 text-left">{user.extensionID}</td>
                  <td className="py-3 px-6 text-left max-w-xs truncate overflow-hidden">{user.jwt}</td>
                  <td className="py-3 px-6 text-center">
                    <button 
                      className="bg-primaryOrange text-white px-4 py-2 rounded-md hover:bg-darkorange transition duration-200"
                      onClick={() => deleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      ) : (
        <p className="text-center text-gray-500">No Users Found</p>
      )}
    </div>
  );
} 

export default UserList;