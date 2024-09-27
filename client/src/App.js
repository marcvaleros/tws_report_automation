import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './page/Home'
import Tutorial from './page/Tutorial'

function App() {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tutorial" element={<Tutorial />} />
        </Routes>
    </Router>
  );
}

export default App;
