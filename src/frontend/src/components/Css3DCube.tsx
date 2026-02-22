export default function Css3DCube() {
  return (
    <div className="fixed bottom-8 right-8 z-10 pointer-events-none">
      <div className="perspective-container">
        <div className="cube-container">
          <div className="cube">
            <div className="cube-face cube-front"></div>
            <div className="cube-face cube-back"></div>
            <div className="cube-face cube-right"></div>
            <div className="cube-face cube-left"></div>
            <div className="cube-face cube-top"></div>
            <div className="cube-face cube-bottom"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
