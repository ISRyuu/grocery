import logo from './logo.svg';
import './App.css';
import { SvgGrid } from './svg_grid';


function App() {
  return (
    <div className="App">
      <SvgGrid width={800} height={800} cellsize={30}/>
    </div>
  );
}

export default App;
