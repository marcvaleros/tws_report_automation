import { useState } from 'react';
import './App.css';
import ConfigForm from './components/ConfigForm'
import UserList from './components/UserList'
import axios from 'axios';

function App() {
  const [data, setData] = useState([]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_BASE_URL}/rc/users`);
      console.log(res.data);
      setData(res.data);
    } catch (error) {
      console.log(`Error Fetching Users: ${error}`);
    }
  }
  return (
    <div className="App">
        <ConfigForm onFormSubmit={fetchUsers}/>
        <UserList data={data}/>
    </div>
  );
}

export default App;
