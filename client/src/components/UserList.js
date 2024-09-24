import React, { useEffect, useState } from 'react';
import axios from 'axios';


const UserList = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    //do a fetch of all users in the database
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_BASE_URL}/rc/users`);
        console.log(res.data);
        setUsers(res.data);
      } catch (error) {
        console.log(`Error Fetching Users: ${error}`);
      }
    }

    fetchUsers();
  }
  ,[]);

  const deleteUser = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_BASE_URL}/rc/user/${id}`);
      setUsers(users.filter(user => user.id !== id)); // Remove the deleted user from the list
    } catch (error) {
      console.log(`Error Deleting User: ${error}`);
    }
  }

  return (
    <div className="container mx-auto my-8">
      {users?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <tr>
                <th className="py-3 px-6 text-left">ID</th>
                <th className="py-3 px-6 text-left">Name</th>
                <th className="py-3 px-6 text-left">Extension ID</th>
                <th className="py-3 px-6 text-left">JWT</th>
                <th className="py-3 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {users.map((user, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left whitespace-nowrap">{user.id}</td>
                  <td className="py-3 px-6 text-left">{user.name}</td>
                  <td className="py-3 px-6 text-left">{user.extensionID}</td>
                  <td className="py-3 px-6 text-left max-w-xs truncate overflow-hidden">{user.jwt}</td>
                  <td className="py-3 px-6 text-center">
                    <button 
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200"
                      onClick={() => deleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500">No Users Found</p>
      )}
    </div>
  );
} 

export default UserList;