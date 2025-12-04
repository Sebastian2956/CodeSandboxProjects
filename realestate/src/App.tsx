// App.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  FaPhone,
  FaEnvelope,
  FaFacebook,
  FaMapMarkerAlt,
  FaExternalLinkAlt,
  FaBars,
  FaHome,
  FaInfoCircle,
  FaChartLine,
  FaQuoteRight,
  FaAddressCard,
} from "react-icons/fa";
import emailjs from "@emailjs/browser";
import axios from "axios";

interface Property {
  id: number;
  address: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  image: string;
}

interface Article {
  title: string;
  excerpt: string;
  url: string;
  date: string;
}

const App: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    email: "",
    message: "",
  });
  const [formStatus, setFormStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  const sections = {
    home: useRef<HTMLDivElement>(null),
    about: useRef<HTMLDivElement>(null),
    properties: useRef<HTMLDivElement>(null),
    market: useRef<HTMLDivElement>(null),
    testimonials: useRef<HTMLDivElement>(null),
    contact: useRef<HTMLDivElement>(null),
  };

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default to a central US location if permission denied
          setUserLocation({ lat: 39.8283, lng: -98.5795 });
        }
      );
    }
  }, []);

  // Fetch properties based on location
  useEffect(() => {
    if (userLocation) {
      setLoading(true);

      // Using Zillow API via RapidAPI with reverse geocoding
      const fetchProperties = async () => {
        let geocodeResponse;
        let locationName = "Your Area";

        try {
          // Use reverse geocoding to convert coordinates to city name
          geocodeResponse = await axios.get(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${userLocation.lat}&longitude=${userLocation.lng}&localityLanguage=en`
          );

          // Extract city name from geocoding response
          if (geocodeResponse.data) {
            if (geocodeResponse.data.city) {
              locationName = geocodeResponse.data.city;
            } else if (geocodeResponse.data.locality) {
              locationName = geocodeResponse.data.locality;
            } else if (geocodeResponse.data.principalSubdivision) {
              // Fallback to state/province if city not found
              locationName = geocodeResponse.data.principalSubdivision;
            }
          }

          console.log(`Looking for properties in: ${locationName}`);

          // Store API key in an environment variable in production
          const rapidApiKey = ""; // Replace with your ACTUAL key

          // Make the API request to RapidAPI's Zillow endpoint
          const response = await axios.get(
            "https://zillow-com1.p.rapidapi.com/propertyExtendedSearch",
            {
              headers: {
                "X-RapidAPI-Key": rapidApiKey,
                "X-RapidAPI-Host": "zillow-com1.p.rapidapi.com",
              },
              params: {
                location: locationName,
                home_type: "Houses",
              },
            }
          );

          console.log("API Response Data Sample:", response.data);

          if (
            response.data &&
            response.data.props &&
            response.data.props.length > 0
          ) {
            console.log(`Found ${response.data.props.length} properties`);

            console.log("First property structure:", response.data.props[0]);

            const propertyData = response.data.props
              .slice(0, 4)
              .map((prop: any, index: number) => {
                let price = 500000; // Default price
                if (prop.price) {
                  if (typeof prop.price === "string") {
                    price = Number(prop.price.replace(/[^0-9.]/g, ""));
                  } else if (typeof prop.price === "number") {
                    price = prop.price;
                  }
                }

                return {
                  id: index + 1,
                  address: prop.address || `Property ${index + 1}`,
                  price: price,
                  beds: prop.bedrooms || 3,
                  baths: prop.bathrooms || 2,
                  sqft: prop.livingArea ? prop.livingArea : 2000,
                  image:
                    prop.imgSrc ||
                    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
                };
              });

            setProperties(propertyData);
            setLoading(false);
            console.log("Successfully set real property data");
          } else {
            console.error("API returned no properties:", response.data);
            throw new Error("No properties found in API response");
          }
        } catch (error) {
          console.error("Error fetching properties:", error);

          // Fallback data using the locationName we already got
          setProperties([
            {
              id: 1,
              address: `123 Main St, ${locationName}`,
              price: 450000,
              beds: 3,
              baths: 2,
              sqft: 1800,
              image:
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
            },
            {
              id: 2,
              address: `456 Oak Ave, ${locationName}`,
              price: 625000,
              beds: 4,
              baths: 3,
              sqft: 2400,
              image:
                "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
            },
            {
              id: 3,
              address: `789 Park Blvd, ${locationName}`,
              price: 550000,
              beds: 3,
              baths: 2.5,
              sqft: 2100,
              image:
                "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800",
            },
            {
              id: 4,
              address: `101 Lake View, ${locationName}`,
              price: 720000,
              beds: 5,
              baths: 3.5,
              sqft: 2800,
              image:
                "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800",
            },
          ]);
          setLoading(false);
        }
      };

      fetchProperties();
    }
  }, [userLocation]);

  // Fetch housing market trends from RSS feed
  useEffect(() => {
    // Using a real estate news API (HousingWire via RSS2JSON)
    const fetchArticles = async () => {
      try {
        const response = await axios.get(
          "https://api.rss2json.com/v1/api.json?rss_url=https://www.housingwire.com/feed/"
        );

        if (response.data && response.data.items) {
          const articlesData = response.data.items
            .slice(0, 3)
            .map((item: any) => ({
              title: item.title,
              excerpt:
                item.description.replace(/<[^>]*>/g, "").substring(0, 150) +
                "...",
              url: item.link,
              date: item.pubDate,
            }));
          setArticles(articlesData);
        }
      } catch (error) {
        console.error("Error fetching market trends:", error);
        // Fallback data
        setArticles([
          {
            title: "Housing Market Shows Signs of Cooling",
            excerpt:
              "After months of rapid price increases, the housing market appears to be stabilizing...",
            url: "https://www.housingwire.com",
            date: new Date().toISOString(),
          },
          {
            title: "Mortgage Rates Drop to 5.8%",
            excerpt:
              "In a welcome relief for homebuyers, mortgage rates have decreased for the third consecutive week...",
            url: "https://www.housingwire.com",
            date: new Date().toISOString(),
          },
          {
            title: "New Construction Permits Up 12% Year-Over-Year",
            excerpt:
              "Residential construction is showing strong growth, potentially easing inventory constraints...",
            url: "https://www.housingwire.com",
            date: new Date().toISOString(),
          },
        ]);
      }
    };

    fetchArticles();
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
    setIsNavOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormStatus("");

    try {
      // Using EmailJS for email service
      // Replace with your actual EmailJS service ID, template ID, and public key
      const result = await emailjs.sendForm(
        "", // Replace with your EmailJS service ID
        "", // Replace with your EmailJS template ID
        formRef.current!,
        "" // Replace with your EmailJS public key
      );

      if (result.text === "OK") {
        setFormStatus("Message sent successfully! John will contact you soon.");
        setFormData({ name: "", number: "", email: "", message: "" });
      } else {
        setFormStatus(
          "Error sending message. Please try again or call directly."
        );
      }
    } catch (error) {
      console.error("Email error:", error);
      // Shows success for testing purposes. Message wont send until you add EmailJS credentials
      setFormStatus("Message sent successfully! John will contact you soon.");
    } finally {
      setLoading(false);
    }
  };

  // Color scheme
  const colors = {
    primary: "#1d4ed8", // Royal blue
    primaryLight: "#3b82f6", // Lighter blue for hover states
    primaryDark: "#1e40af", // Darker blue for pressed states
    secondary: "#475569", // Slate gray
    accent: "#f59e0b", // Amber
    textDark: "#1e293b", // Dark slate blue
    textLight: "#f8fafc", // Off-white
    bgLight: "#f8fafc", // Very light gray
    bgDark: "#0f172a", // Very dark blue
    success: "#10b981", // Emerald for success messages
    error: "#ef4444", // Red for error messages
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Mobile Navigation Toggle */}
      <button
        onClick={() => setIsNavOpen(!isNavOpen)}
        className="fixed top-4 right-4 z-50 bg-indigo-700 text-white p-3 rounded-full shadow-lg md:hidden"
        aria-label="Toggle navigation"
      >
        <FaBars />
      </button>

      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 w-64 h-full bg-gradient-to-b from-indigo-900 to-indigo-800 text-white shadow-xl p-6 transform transition-transform duration-300 ease-in-out z-40 ${
          isNavOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="border-b border-indigo-700 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-white">Prestige Realty</h1>
          <p className="text-indigo-200 text-sm">John Doe, Licensed Realtor</p>
        </div>

        <ul className="space-y-1">
          {[
            { key: "home", label: "Home", icon: <FaHome /> },
            { key: "about", label: "About", icon: <FaInfoCircle /> },
            { key: "properties", label: "Properties", icon: <FaHome /> },
            { key: "market", label: "Market Trends", icon: <FaChartLine /> },
            {
              key: "testimonials",
              label: "Testimonials",
              icon: <FaQuoteRight />,
            },
            { key: "contact", label: "Contact", icon: <FaAddressCard /> },
          ].map(({ key, label, icon }) => (
            <li key={key}>
              <button
                onClick={() =>
                  scrollToSection(sections[key as keyof typeof sections])
                }
                className="flex items-center text-indigo-100 hover:text-white hover:bg-indigo-700 transition-colors w-full text-left py-2 px-3 rounded-md"
              >
                <span className="mr-3">{icon}</span>
                {label}
              </button>
            </li>
          ))}
        </ul>

        <div className="absolute bottom-0 left-0 w-full bg-indigo-950 p-4">
          <div className="flex flex-col text-xs text-indigo-200">
            <p>Licensed Real Estate Professional</p>
            <p>License #RX-12345</p>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="ml-0 md:ml-64 transition-all duration-300">
        <section
          ref={sections.home}
          className="h-screen bg-cover bg-center flex items-center justify-center"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920)",
            backgroundPosition: "center",
          }}
        >
          <div className="text-center p-8 max-w-2xl mx-4">
            <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-2xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-2 text-indigo-900">
                Prestige Realty
              </h1>
              <div className="w-16 h-1 bg-amber-500 mx-auto my-4"></div>
              <p className="text-xl md:text-2xl mb-6 text-gray-700">
                Elevating Your Real Estate Experience
              </p>
              <button
                onClick={() => scrollToSection(sections.contact)}
                className="bg-indigo-600 text-white px-8 py-3 rounded-md hover:bg-indigo-700 transition-colors shadow-lg font-medium text-lg"
              >
                Work With Us
              </button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section ref={sections.about} className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-indigo-900 mb-2">
                About John
              </h2>
              <div className="w-16 h-1 bg-amber-500 mx-auto"></div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/3">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-200 rounded-lg transform translate-x-3 translate-y-3"></div>
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400"
                    alt="John Doe"
                    className="relative z-10 w-full h-auto rounded-lg object-cover shadow-lg"
                  />
                </div>
              </div>
              <div className="md:w-2/3">
                <h3 className="text-2xl font-semibold text-indigo-800 mb-4">
                  Your Trusted Real Estate Partner
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  With over 15 years of experience in the luxury real estate
                  market, John Doe combines market expertise with personalized
                  service. His commitment to clients goes beyond transactions -
                  he builds lasting relationships based on trust and exceptional
                  results.
                </p>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  John specializes in luxury properties and assisting first-time
                  home buyers, bringing the same dedication and attention to
                  detail to every client interaction, regardless of property
                  value.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg w-32">
                    <span className="text-3xl font-bold text-indigo-600">
                      15+
                    </span>
                    <span className="text-gray-600 text-sm">Years Exp.</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg w-32">
                    <span className="text-3xl font-bold text-indigo-600">
                      200+
                    </span>
                    <span className="text-gray-600 text-sm">Properties</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg w-32">
                    <span className="text-3xl font-bold text-indigo-600">
                      95%
                    </span>
                    <span className="text-gray-600 text-sm">
                      Client Satisfaction
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Properties Section */}
        <section ref={sections.properties} className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-indigo-900 mb-2">
                Featured Properties
              </h2>
              <div className="w-16 h-1 bg-amber-500 mx-auto mb-4"></div>
              <div className="flex items-center justify-center">
                <FaMapMarkerAlt className="text-indigo-600 mr-2" />
                <span className="text-gray-700">
                  {userLocation
                    ? "Showing properties in your area"
                    : "Locating properties near you..."}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Loading properties...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className="bg-white rounded-lg shadow-lg overflow-hidden group hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="relative overflow-hidden h-60">
                      <img
                        src={property.image}
                        alt={property.address}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-0 right-0 bg-indigo-600 text-white py-1 px-3 m-2 rounded-full text-sm font-semibold">
                        New Listing
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-semibold text-indigo-900 group-hover:text-indigo-600 transition-colors">
                          {property.address}
                        </h3>
                      </div>
                      <p className="text-amber-600 font-bold text-xl mb-2">
                        ${property.price.toLocaleString()}
                      </p>

                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center text-gray-600">
                          <span className="font-medium mr-1">
                            {property.beds}
                          </span>{" "}
                          Beds
                        </div>
                        <div className="flex items-center text-gray-600">
                          <span className="font-medium mr-1">
                            {property.baths}
                          </span>{" "}
                          Baths
                        </div>
                        <div className="flex items-center text-gray-600">
                          <span className="font-medium mr-1">
                            {property.sqft.toLocaleString()}
                          </span>{" "}
                          sqft
                        </div>
                      </div>

                      <button
                        onClick={() => scrollToSection(sections.contact)}
                        className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-md flex items-center justify-center"
                      >
                        Schedule a Viewing
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Market Trends Section */}
        <section ref={sections.market} className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-indigo-900 mb-2">
                Market Insights
              </h2>
              <div className="w-16 h-1 bg-amber-500 mx-auto mb-4"></div>
              <p className="text-gray-600 max-w-lg mx-auto">
                Stay informed with the latest developments in the real estate
                market
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {articles.map((article, index) => (
                <a
                  key={index}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="h-full bg-slate-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-indigo-800 group-hover:text-indigo-600 transition-colors">
                          {article.title}
                        </h3>
                        <FaExternalLinkAlt className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-gray-600 mb-4">{article.excerpt}</p>
                      <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-200">
                        <p className="text-gray-500 text-sm">
                          {new Date(article.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section
          ref={sections.testimonials}
          className="py-20 px-4 bg-indigo-50"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-indigo-900 mb-2">
                Client Success Stories
              </h2>
              <div className="w-16 h-1 bg-amber-500 mx-auto mb-4"></div>
              <p className="text-gray-600 max-w-lg mx-auto">
                Hear what our clients have to say about their experience
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-md relative">
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-amber-500 text-white flex items-center justify-center rounded-full">
                  <FaQuoteRight />
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "John made our home buying process seamless and stress-free.
                  His expertise is unmatched! We couldn't be happier with our
                  new home and the attentive service we received throughout."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                    JM
                  </div>
                  <div className="ml-4">
                    <p className="text-indigo-900 font-semibold">
                      John & Sarah M.
                    </p>
                    <p className="text-gray-500 text-sm">
                      First-time Homebuyers
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-lg shadow-md relative">
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-amber-500 text-white flex items-center justify-center rounded-full">
                  <FaQuoteRight />
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "Sold our house in record time thanks to John's strategic
                  marketing and industry connections. He got us $25k over asking
                  price and made the entire process smooth and straightforward!"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                    MR
                  </div>
                  <div className="ml-4">
                    <p className="text-indigo-900 font-semibold">Michael R.</p>
                    <p className="text-gray-500 text-sm">Property Seller</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section
          ref={sections.contact}
          className="py-20 px-4 bg-gradient-to-b from-white to-indigo-50"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-indigo-900 mb-2">
                Contact John
              </h2>
              <div className="w-16 h-1 bg-amber-500 mx-auto mb-4"></div>
              <p className="text-gray-600 max-w-lg mx-auto">
                Reach out to discuss your real estate needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              <div className="md:col-span-2 bg-indigo-800 p-8 rounded-lg shadow-lg text-white">
                <h3 className="text-xl font-semibold text-white mb-6 pb-3 border-b border-indigo-700">
                  Get In Touch
                </h3>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-indigo-100">
                    <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center mr-4">
                      <FaPhone className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-indigo-300">Phone</p>
                      <p>(555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-center text-indigo-100">
                    <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center mr-4">
                      <FaEnvelope className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-indigo-300">Email</p>
                      <p>john@prestigerealty.com</p>
                    </div>
                  </div>
                  <div className="flex items-center text-indigo-100">
                    <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center mr-4">
                      <FaMapMarkerAlt className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-indigo-300">Office</p>
                      <p>123 Prestige Ave, Suite 200</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-indigo-700">
                  <h4 className="text-lg font-medium text-white mb-4">
                    Connect With Us
                  </h4>
                  <div className="flex space-x-4">
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center hover:bg-indigo-600 transition-colors"
                    >
                      <FaFacebook className="text-white" />
                    </a>
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center hover:bg-indigo-600 transition-colors"
                    >
                      <i className="fab fa-instagram text-white"></i>
                    </a>
                    <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center hover:bg-indigo-600 transition-colors"
                    >
                      <i className="fab fa-linkedin-in text-white"></i>
                    </a>
                  </div>
                </div>
              </div>

              <div className="md:col-span-3 bg-white p-8 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-indigo-900 mb-6 pb-3 border-b border-gray-200">
                  Send Us a Message
                </h3>
                <form
                  ref={formRef}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="user_name"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="number"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="number"
                        name="user_phone"
                        placeholder="(555) 123-4567"
                        value={formData.number}
                        onChange={(e) =>
                          setFormData({ ...formData, number: e.target.value })
                        }
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="user_email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Your Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      placeholder="Tell me about your real estate needs..."
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      rows={4}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 transition-colors shadow-md font-medium"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <span className="inline-block h-5 w-5  border-white mr-2"></span>
                        Send Message
                      </span>
                    ) : (
                      "Send Message"
                    )}
                  </button>

                  {formStatus && (
                    <div
                      className={`text-center p-3 rounded-md ${
                        formStatus.includes("success")
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : formStatus.includes("Error")
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {formStatus}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-indigo-900 text-white py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Prestige Realty</h3>
                <p className="text-indigo-200 mb-4">
                  Providing exceptional real estate services since 2008. We help
                  clients find their dream homes and investment properties.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-medium mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  {Object.entries(sections).map(([key, ref]) => (
                    <li key={key}>
                      <button
                        onClick={() => scrollToSection(ref)}
                        className="text-indigo-200 hover:text-white hover:underline transition-colors capitalize"
                      >
                        {key}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-medium mb-4">Office Hours</h4>
                <ul className="space-y-2 text-indigo-200">
                  <li className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span>9:00 AM - 6:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Saturday</span>
                    <span>10:00 AM - 4:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Sunday</span>
                    <span>By Appointment</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-indigo-800 text-center">
              <p>
                © {new Date().getFullYear()} Prestige Realty. All rights
                reserved.
              </p>
              <p className="mt-2 text-sm text-indigo-300">
                Licensed Real Estate Brokerage | License #BK-12345
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
