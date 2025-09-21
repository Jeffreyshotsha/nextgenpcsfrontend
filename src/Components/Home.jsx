import React from "react";
import homeVideo from "./assetss/Nextgenhome.mp4";
import "./Home.css";

function Home() {
  return (
    <div className="home-container">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="home-background-video"
      >
        <source src={homeVideo} type="video/mp4" />
      </video>
    </div>
  );
}

export default Home;
