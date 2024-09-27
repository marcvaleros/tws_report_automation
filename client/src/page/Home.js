import ConfigForm from '../components/ConfigForm'
import UserList from '../components/UserList'

function Home() {
  return (
    <div className="font-poppins grid grid-flow-row grid-cols-1 items-center sm:grid-cols-1 lg:grid-cols-2 ">
      <ConfigForm/>
      <UserList/>
    </div>
  );
}

export default Home;
