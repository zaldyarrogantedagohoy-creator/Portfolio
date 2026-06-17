// src/HomePage.js
import React from 'react';
import './HomePage.css';

const HomePage = () => {
    const [isBlue, setIsBlue] = React.useState(false);

    const toggleColor = () => {
        setIsBlue(!isBlue);
    };

    return (
        <div className={`home-page ${isBlue ? 'blue' : 'red'}`}>
            <h1>Welcome to Our Landing Page</h1>
            <p>This is a simple landing page built with React.</p>
            <button onClick={toggleColor}>
                Toggle Color
            </button>
        </div>
    );
}

export default HomePage; 