import logo from './logo.svg';
import React, {useState} from 'react';
import BoundingBox from './bounding_box.js';
import './App.css';

function App() {
  
  const [phantom, setPhantom] = useState([]);

  function refresh(params) {
      setPhantom(Math.random());
  }
  return (
      <React.Fragment>
	    <BoundingBox p={phantom}/>
      <button onClick={refresh}> Refresh </button>
      </React.Fragment>
  );
}

export default App;
