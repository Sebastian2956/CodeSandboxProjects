import React, { useState, useCallback } from "react";

const CELESTIAL_BODIES = [
  {
    name: "Sun",
    type: "Star",
    size: 200,
    distanceFromSun: "0 km",
    distanceFromEarth: "149.6M km",
    temp: "5,500°C (surface), 15.7M°C (core)",
    discovery:
      "Known since prehistoric times, studied by ancient civilizations including Egyptians, Greeks, and Chinese astronomers.",
    description:
      "The Sun is the star at the center of our Solar System, a nearly perfect sphere of hot plasma. It is by far the most important source of energy for life on Earth, providing the light and heat that sustains all life on our planet.",
    color: "yellow-orange",
    images: [
      "https://th.bing.com/th/id/R.b491065fa9479b1320faca21972b9b64?rik=JmsDpAEdSJTOLA&pid=ImgRaw&r=0",
      "https://th.bing.com/th/id/R.779d24df3fbc8147e033f0691e0f302a?rik=g0Q0OwkvJDKegQ&pid=ImgRaw&r=0",
    ],
  },
  {
    name: "Mercury",
    type: "Planet",
    size: 20,
    distanceFromSun: "58M km",
    distanceFromEarth: "91M km",
    temp: "427°C (day), -173°C (night)",
    discovery:
      "Known since at least 3000 BCE by ancient Sumerians. Being so close to the Sun, it was difficult to observe. The ancient Greeks believed it was two separate objects - one visible at sunrise and another at sunset.",
    description:
      "Mercury is the smallest and innermost planet in the Solar System. It has no atmosphere to retain heat, causing extreme temperature variations. Its surface is heavily cratered, resembling our Moon.",
    color: "gray",
    images: [
      "https://scitechdaily.com/images/NASA-Image-of-the-Day-A-Colorful-View-of-Mercury.jpg",
      "https://vedichealing.com/wp-content/uploads/2014/05/Mercury-NASA.jpg",
    ],
  },
  {
    name: "Venus",
    type: "Planet",
    size: 48,
    distanceFromSun: "108M km",
    distanceFromEarth: "41M km",
    temp: "462°C (surface)",
    discovery:
      "One of the brightest objects in the sky, Venus has been known since prehistoric times. Ancient civilizations often associated it with their goddesses of love and beauty due to its brightness.",
    description:
      "Venus is often called Earth's 'sister planet' due to similar size and mass. However, it has a toxic atmosphere of carbon dioxide with clouds of sulfuric acid, creating a runaway greenhouse effect that makes it the hottest planet in our solar system.",
    color: "yellow",
    images: [
      "https://th.bing.com/th/id/OIP.oIJgF6hcf1uYrRKKkex0CQHaHa?rs=1&pid=ImgDetMain",
      "https://wallpapercave.com/wp/wp2248865.jpg",
    ],
  },
  {
    name: "Earth",
    type: "Planet",
    size: 50,
    distanceFromSun: "150M km",
    distanceFromEarth: "0 km",
    temp: "15°C (average)",
    discovery:
      "As humanity's home planet, Earth's nature as a planet similar to others was gradually understood through the development of astronomy. The first photos of Earth from space were taken in 1946 using captured V2 rockets.",
    description:
      "Earth is the third planet from the Sun and the only astronomical object known to harbor life. About 71% of its surface is covered by water. Its atmosphere consists primarily of nitrogen and oxygen, and its magnetic field protects it from solar radiation.",
    color: "blue-green",
    images: [
      "https://pixelz.cc/wp-content/uploads/2018/07/planet-earth-from-space-uhd-4k-wallpaper.jpg",
      "https://wallup.net/wp-content/uploads/2016/01/229478-Earth-space-planet-Solar_System.jpg",
    ],
  },
  {
    name: "Mars",
    type: "Planet",
    size: 27,
    distanceFromSun: "228M km",
    distanceFromEarth: "78M km",
    temp: "-153°C (min), 20°C (max)",
    discovery:
      "Known to ancient Egyptian astronomers as early as 1534 BCE. Its distinctive reddish appearance made it easily identifiable. Galileo was the first to observe Mars with a telescope in the early 1600s.",
    description:
      "Mars is often called the 'Red Planet' due to iron oxide (rust) on its surface. It has polar ice caps, seasons, canyons, extinct volcanoes, and evidence suggesting liquid water once flowed on its surface, making it a prime target in the search for extraterrestrial life.",
    color: "red",
    images: [
      "https://th.bing.com/th/id/R.8381a70538915a170df0e4d980d684bb?rik=UbsK9adlHv8Iuw&riu=http%3a%2f%2fnssdc.gsfc.nasa.gov%2fimage%2fplanetary%2fmars%2fmarsglobe2.jpg&ehk=LOQSHdDyMfMtMIttohS33aNSnua2uQjMoE7sEp%2bjLP4%3d&risl=&pid=ImgRaw&r=0",
      "https://static.independent.co.uk/2020/10/05/15/mars%20full%20bright.jpg?quality=75&width=1200&auto=webp",
    ],
  },
  {
    name: "Jupiter",
    type: "Planet",
    size: 140,
    distanceFromSun: "778M km",
    distanceFromEarth: "628M km",
    temp: "-145°C (cloud tops)",
    discovery:
      "Known since prehistoric times due to its brightness. Named after the king of the Roman gods. Galileo's discovery of Jupiter's four largest moons in 1610 was revolutionary evidence supporting the heliocentric model.",
    description:
      "Jupiter is the largest planet in our Solar System and a gas giant primarily composed of hydrogen and helium. Its most distinctive feature is the Great Red Spot, a giant storm that has been raging for at least 400 years. It has a strong magnetic field and at least 79 moons.",
    color: "yellow-brown",
    images: [
      "https://th.bing.com/th/id/OIP.LpBfevDcTNls7u-pLQ22rAHaHa?rs=1&pid=ImgDetMain",
      "https://th.bing.com/th/id/R.5d4e21407ad8b5eb0d433735bbca1042?rik=U2JLC5vhhtNISg&riu=http%3a%2f%2fplanetfacts.org%2fwp-content%2fuploads%2f2010%2f03%2fJupiter.jpg&ehk=jiwXbkMSAjlwk8B0vo%2b0RXprwfMnHdZNv%2bv8cn3PVrk%3d&risl=&pid=ImgRaw&r=0",
    ],
  },
  {
    name: "Saturn",
    type: "Planet",
    size: 120,
    distanceFromSun: "1.4B km",
    distanceFromEarth: "1.3B km",
    temp: "-184°C (cloud tops)",
    discovery:
      "Known to ancient civilizations including Babylonian astronomers who recorded its movements. Galileo first observed its rings in 1610, though he couldn't identify what they were. Christian Huygens correctly identified them as rings in 1659.",
    description:
      "Saturn is known for its spectacular ring system, composed primarily of ice particles with a smaller amount of rocky debris. Like Jupiter, it's a gas giant primarily composed of hydrogen and helium. Saturn has at least 82 moons, including Titan, the only moon in our solar system with a dense atmosphere.",
    color: "yellow-tan",
    images: [
      "https://th.bing.com/th/id/R.f2b9899c1589c70705a9540f3e6e3ade?rik=U3Lnb0wn3ZSDQg&riu=http%3a%2f%2fnssdc.gsfc.nasa.gov%2fplanetary%2fimage%2fsaturn.jpg&ehk=YU3holZFQ5u1qhHNSznYFAxqUz4qUV%2bWH8OOBV0aK70%3d&risl=&pid=ImgRaw&r=0",
      "https://i.redd.it/5b9j0qcz8mwx.png",
    ],
  },
  {
    name: "Uranus",
    type: "Planet",
    size: 60,
    distanceFromSun: "2.9B km",
    distanceFromEarth: "2.7B km",
    temp: "-224°C (cloud tops)",
    discovery:
      "William Herschel discovered Uranus on March 13, 1781, while surveying stars. Initially, he thought it was a comet or star, but its orbit revealed it was a planet. It was the first planet discovered with a telescope rather than with the naked eye.",
    description:
      "Uranus is an ice giant primarily composed of elements heavier than hydrogen and helium. It rotates on its side, likely due to a massive collision in its early history. Its atmosphere contains methane, giving it a blue-green color. Uranus has 27 known moons and a system of rings.",
    color: "blue-teal",
    images: [
      "https://th.bing.com/th/id/OIP.vqfpWACSI91kB0fQntfd0QHaE7?rs=1&pid=ImgDetMain",
      "https://wallpaperaccess.com/full/1661644.jpg",
    ],
  },
  {
    name: "Neptune",
    type: "Planet",
    size: 58,
    distanceFromSun: "4.5B km",
    distanceFromEarth: "4.4B km",
    temp: "-201°C (cloud tops)",
    discovery:
      "Neptune was the first planet located through mathematical predictions rather than observation. Urbain Le Verrier and John Couch Adams independently predicted its position due to irregularities in Uranus's orbit. Johann Gottfried Galle observed it on September 23, 1846.",
    description:
      "Neptune is the eighth and farthest known planet from the Sun. Like Uranus, it's classified as an ice giant. It has the strongest winds in the Solar System, reaching speeds of 2,100 km/h. Its atmosphere contains methane, giving it a vivid blue appearance. Neptune has 14 known moons.",
    color: "deep-blue",
    images: [
      "https://cdn.shopify.com/s/files/1/0535/0532/7303/products/G1361-Neptune-from-Voyager-PRINT-sq-web.jpg?v=1615396124",
      "https://images.fineartamerica.com/images-medium-large/voyager-2-image-of-the-planet-neptune-nasa.jpg",
    ],
  },
] as const;

// Get a color for each planet based on their actual appearance
const getPlanetColor = (name: string): string => {
  switch (name) {
    case "Sun":
      return "linear-gradient(to bottom right, #FFF5B8, #FFD700, #FFA500)";
    case "Mercury":
      return "linear-gradient(to bottom right, #D3D3D3, #A9A9A9, #808080)";
    case "Venus":
      return "linear-gradient(to bottom right, #FFF8DC, #F0E68C, #DAA520)";
    case "Earth":
      return "linear-gradient(to bottom right, #87CEEB, #4169E1, #006400)";
    case "Mars":
      return "linear-gradient(to bottom right, #FFA07A, #CD5C5C, #8B0000)";
    case "Jupiter":
      return "linear-gradient(to bottom right, #F5DEB3, #DAA520, #8B4513)";
    case "Saturn":
      return "linear-gradient(to bottom right, #FAEBD7, #F4A460, #CD853F)";
    case "Uranus":
      return "linear-gradient(to bottom right, #E0FFFF, #48D1CC, #20B2AA)";
    case "Neptune":
      return "linear-gradient(to bottom right, #ADD8E6, #1E90FF, #00008B)";
    default:
      return "linear-gradient(to bottom right, #808080, #A9A9A9)";
  }
};

type CelestialBody = (typeof CELESTIAL_BODIES)[number];

const PlanetIcon: React.FC<{ body: CelestialBody; onClick: () => void }> = ({
  body,
  onClick,
}) => (
  <div
    className="cursor-pointer transition-all duration-300 hover:scale-110 flex flex-col items-center py-4 px-2"
    onClick={onClick}
  >
    <div
      className="rounded-full overflow-hidden shadow-lg"
      style={{
        width: `${body.size}px`,
        height: `${body.size}px`,
        background: getPlanetColor(body.name),
        boxShadow:
          body.name === "Sun" ? "0 0 60px rgba(255, 215, 0, 0.5)" : "none",
      }}
    />
    <p className="text-white text-center mt-2 text-sm font-semibold">
      {body.name}
    </p>
  </div>
);

const CelestialBodyModal: React.FC<{
  body: CelestialBody | null;
  onClose: () => void;
}> = ({ body, onClose }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [hoveredImage, setHoveredImage] = useState<number | null>(null);

  if (!body) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-3xl text-white font-bold">{body.name}</h2>
          <button
            className="text-white hover:text-gray-300 text-xl"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white">
          <div>
            <p className="mb-2">
              <span className="font-bold text-blue-300">Type:</span> {body.type}
            </p>
            <p className="mb-2">
              <span className="font-bold text-blue-300">
                Distance from Sun:
              </span>{" "}
              {body.distanceFromSun}
            </p>
            <p className="mb-2">
              <span className="font-bold text-blue-300">
                Distance from Earth:
              </span>{" "}
              {body.distanceFromEarth}
            </p>
            <p className="mb-2">
              <span className="font-bold text-blue-300">Temperature:</span>{" "}
              {body.temp}
            </p>

            <div className="mt-4">
              <h3 className="text-xl font-bold text-blue-300 mb-2">
                Discovery
              </h3>
              <p className="mb-4">{body.discovery}</p>

              <h3 className="text-xl font-bold text-blue-300 mb-2">
                About {body.name}
              </h3>
              <p>{body.description}</p>
            </div>
          </div>

          <div className="flex flex-col justify-start items-center space-y-4">
            {/* Main image */}
            <div className="w-full flex justify-center">
              <img
                src={body.images[currentImage]}
                alt={`${body.name} - ${currentImage + 1}`}
                className="w-64 h-64 object-cover rounded-lg shadow-lg"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-12 pt-4">
              {body.images.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative transition-all duration-300 ${
                    currentImage === idx ? "border-2 border-blue-400 z-10" : ""
                  }`}
                  onMouseEnter={() => {
                    setCurrentImage(idx);
                    setHoveredImage(idx);
                  }}
                  onMouseLeave={() => {
                    setHoveredImage(null);
                  }}
                  style={{
                    transformOrigin: "center",
                    transform: hoveredImage === idx ? "scale(1.5)" : "scale(1)",
                    zIndex: hoveredImage === idx ? 20 : 10,
                  }}
                >
                  <img
                    src={img}
                    alt={`${body.name} ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded-md shadow cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [selectedBody, setSelectedBody] = useState<CelestialBody | null>(null);

  const handleBodyClick = useCallback((body: CelestialBody) => {
    setSelectedBody(body);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedBody(null);
  }, []);

  const sun = CELESTIAL_BODIES[0];
  const planets = CELESTIAL_BODIES.slice(1);

  return (
    <div className="min-h-screen bg-black overflow-hidden flex flex-col relative">
      {/* Starry background */}
      <div className="fixed inset-0">
        {Array.from({ length: 200 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random(),
            }}
          />
        ))}
      </div>
      <header className="relative z-10 text-white text-center py-4">
        <h1 className="text-3xl font-bold">Solar System</h1>
        {/* Information section */}
        <div className="relative z-10 text-white text-center p-4 max-w-4xl mx-auto mb-8">
          <p>
            Our solar system consists of the Sun, eight planets, dwarf planets,
            moons, asteroids, comets, and other objects. The Sun contains 99.8%
            of the solar system's mass and exerts gravitational forces that keep
            all celestial bodies in orbit. Click on any object above to learn
            more about its characteristics and discovery history.
          </p>
        </div>
        <p className="text-gray-300">
          Click on any celestial body to view detailed information
        </p>
      </header>

      {/* Main content area */}
      <div className="flex-grow flex flex-col">
        {/* Sun Container */}
        <div className="relative z-10 flex flex-col items-center pt-8">
          <div className="mb-6">
            <PlanetIcon body={sun} onClick={() => handleBodyClick(sun)} />
          </div>
        </div>

        {/* Planets scrollable container */}
        <div className="w-full relative z-10 mb-8">
          <div className="overflow-x-auto overflow-y-visible px-4 pb-4">
            <div className="flex space-x-8 md:space-x-12 lg:space-x-16 min-w-max justify-center pt-6 pb-6">
              {planets.map((planet) => (
                <PlanetIcon
                  key={planet.name}
                  body={planet}
                  onClick={() => handleBodyClick(planet)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <CelestialBodyModal body={selectedBody} onClose={handleCloseModal} />
    </div>
  );
};

export default App;
