import React from 'react';
import logo from './logo.svg';
import './App.css';
import someCourses from './res/someCourses.json';
import { CourseUnit } from './models';

const courseUnits: CourseUnit = someCourses;

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          {courseUnits.length}
        </a>
      </header>
    </div>
  );
}

export default App;
