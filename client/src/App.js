import ConfigForm from './components/ConfigForm'
import UserList from './components/UserList'

function App() {
  return (
    <div className="font-poppins grid grid-flow-row grid-cols-2 items-center ">
        <ConfigForm/>
        <UserList/>
    </div>
  );
}

export default App;
