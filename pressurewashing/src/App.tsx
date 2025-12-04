import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import {
  Phone,
  Mail,
  Clock,
  MapPin,
  Menu,
  X,
  ChevronRight,
  Star,
  CheckCircle,
} from "lucide-react";

interface FormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
}

interface Service {
  title: string;
  description: string;
  icon: string;
}

interface GalleryImage {
  id: number;
  title: string;
  before: boolean;
}

type PageType = "home" | "services" | "gallery" | "about" | "contact";

const PressureWashingWebsite: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });

  // Scroll to top whenever page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const services: Service[] = [
    {
      title: "House Washing",
      description:
        "Restore your home's beauty with our gentle yet effective soft wash system. We safely remove dirt, mildew, and algae without damaging your siding.",
      icon: "🏠",
    },
    {
      title: "Driveway Cleaning",
      description:
        "Remove oil stains, tire marks, and years of built-up grime. Our high-pressure cleaning brings your concrete and pavers back to life.",
      icon: "🚗",
    },
    {
      title: "Roof Washing",
      description:
        "Extend your roof's lifespan and improve curb appeal. We use specialized low-pressure techniques to safely remove algae and black streaks.",
      icon: "🏘️",
    },
    {
      title: "Deck & Fence Cleaning",
      description:
        "Revitalize your outdoor living spaces. We carefully clean and prepare wood surfaces, perfect for staining or sealing.",
      icon: "🪵",
    },
    {
      title: "Commercial Pressure Washing",
      description:
        "Keep your business looking professional. We handle storefronts, parking lots, sidewalks, and building exteriors.",
      icon: "🏢",
    },
    {
      title: "Patio & Pool Deck",
      description:
        "Create a safe, clean environment around your pool and patio. We remove slippery algae and restore surfaces to like-new condition.",
      icon: "🏊",
    },
  ];

  const galleryImages: GalleryImage[] = [
    { id: 1, title: "Roof Cleaning Results", before: true },
    { id: 2, title: "Sidewalk Restoration", before: true },
    { id: 3, title: "House Exterior Revival", before: true },
    { id: 4, title: "Patio Renewal", before: true },
    { id: 5, title: "Driveway Transformation", before: true },
    { id: 6, title: "Our equipment", before: true },
  ];

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    alert("Thank you for your inquiry! We'll contact you within 24 hours.");
    setFormData({ name: "", email: "", phone: "", service: "", message: "" });
  };

  const navigateToPage = (page: PageType): void => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  const NavBar: React.FC = () => (
    <nav className="bg-white shadow-md fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl font-bold text-blue-600">
                Twins Pressure Pros
                <span className="text-gray-700 text-sm block">
                  Pressure Washing
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex space-x-8">
            {(
              ["home", "services", "gallery", "about", "contact"] as PageType[]
            ).map((page) => (
              <button
                key={page}
                onClick={() => navigateToPage(page)}
                className={`${
                  currentPage === page
                    ? "text-blue-600 font-semibold"
                    : "text-gray-700"
                } hover:text-blue-600 transition capitalize text-lg`}
              >
                {page === "about" ? "About Us" : page}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Phone className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-800">(555) 123-4567</span>
          </div>

          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-3">
            {(
              ["home", "services", "gallery", "about", "contact"] as PageType[]
            ).map((page) => (
              <button
                key={page}
                onClick={() => navigateToPage(page)}
                className={`block w-full text-left px-3 py-2 rounded ${
                  currentPage === page
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-gray-700"
                } capitalize`}
              >
                {page === "about" ? "About Us" : page}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );

  const HomePage: React.FC = () => (
    <div className="pt-20">
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div class="mb-16">
              <img
                src="logo.png"
                alt="Company Logo"
                className="mx-auto h-96 w-96"
              />
            </div>
            <div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Transform Your Property with Professional Pressure Washing
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Family-owned and trusted by Florda homeowners and businesses
                since day one.
              </p>

              <button
                onClick={() => navigateToPage("contact")}
                className="mb-16 bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition shadow-lg inline-flex items-center"
              >
                Get Your Free Quote <ChevronRight className="ml-2" />
              </button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose Machuca & Doe?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're not just another pressure washing company. We're your
            neighbors, dedicated to making every property shine.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Family-Owned
            </h3>
            <p className="text-gray-600">
              As a local, family-run business, we treat every property like it's
              our own. Your satisfaction is personal to us.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Professional Results
            </h3>
            <p className="text-gray-600">
              State-of-the-art equipment and proven techniques ensure stunning
              results without damage to your property.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              100% Satisfaction
            </h3>
            <p className="text-gray-600">
              We're not done until you're thrilled. Our guarantee backs every
              job we complete.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Our Core Services
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.slice(0, 6).map((service, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-4 bg-white p-6 rounded-lg shadow"
              >
                <div className="text-3xl">{service.icon}</div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {service.description.substring(0, 80)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button
              onClick={() => navigateToPage("services")}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center"
            >
              View All Services <ChevronRight className="ml-2" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to See the Difference?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join hundreds of satisfied customers across the DFW metroplex.
          </p>
          <button
            onClick={() => navigateToPage("contact")}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition shadow-lg inline-flex items-center"
          >
            Get Your Free Estimate Today <ChevronRight className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );

  const ServicesPage: React.FC = () => (
    <div className="pt-20">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">Our Services</h1>
          <p className="text-xl text-blue-100">
            Comprehensive pressure washing solutions for residential and
            commercial properties
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition"
            >
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 flex items-center">
                <div className="text-5xl mr-4">{service.icon}</div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {service.title}
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {service.description}
                </p>
                <div className="flex items-start space-x-2 text-sm text-gray-500">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Eco-friendly cleaning solutions</span>
                </div>
                <div className="flex items-start space-x-2 text-sm text-gray-500 mt-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Professional-grade equipment</span>
                </div>
                <div className="flex items-start space-x-2 text-sm text-gray-500 mt-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Fully insured and licensed</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-blue-50 rounded-xl p-8 md:p-12 border-2 border-blue-100">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Custom Solutions Available
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Don't see what you're looking for? We offer customized pressure
              washing services tailored to your specific needs. From fleet
              washing to graffiti removal, we've got you covered.
            </p>
            <button
              onClick={() => navigateToPage("contact")}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center"
            >
              Request a Custom Quote <ChevronRight className="ml-2" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Property?
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            Contact us today for a free, no-obligation estimate.
          </p>
          <button
            onClick={() => navigateToPage("contact")}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg inline-flex items-center"
          >
            Get Your Free Estimate <ChevronRight className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );

  const GalleryPage: React.FC = () => (
    <div className="pt-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-5xl font-bold text-gray-900 mb-6 text-center">
          Gallery
        </h1>
        <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
          See the remarkable transformations we've achieved for our clients
          across the Orlando, Florida area.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {galleryImages.map((image) => (
            <div
              key={image.id}
              className="relative group overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition"
            >
              <img
                src={`image${image.id}.png`}
                alt={image.title}
                className="w-full h-64 object-cover group-hover:scale-105 transition transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end justify-center pb-4">
                <div className="text-center">
                  <p className="text-white font-bold text-lg">{image.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready for Your Transformation?
          </h2>
          <p className="text-gray-600 mb-6">
            Let us show you what we can do for your property.
          </p>
          <button
            onClick={() => navigateToPage("contact")}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Schedule Your Service Today
          </button>
        </div>
      </div>
    </div>
  );

  const AboutPage: React.FC = () => (
    <div className="pt-20">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">About Us</h1>
          <p className="text-xl text-blue-100">
            Meet the team behind Orlando, Florida's most trusted pressure
            washing service
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">
            Our Story
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            Machuca & Doe Pressure Washing was born from a simple belief: every
            property deserves to look its absolute best. What started as two
            friends with a shared passion for quality work has grown into the
            DFW area's most reliable pressure washing service.
          </p>
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            As a family-owned business, we understand the importance of trust,
            integrity, and exceptional results. We're not satisfied until you're
            completely thrilled with the transformation of your property. That's
            the Machuca & Doe promise.
          </p>
          <p className="text-lg text-gray-600 leading-relaxed">
            Whether it's a residential driveway or a commercial storefront, we
            bring the same dedication to excellence and attention to detail to
            every single project. When you choose us, you're not just getting a
            service—you're gaining partners who care about your property as much
            as you do.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 aspect-square flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-8xl mb-4">👨‍💼</div>
                <p className="text-2xl font-bold">Jorge Machuca</p>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Jorge Machuca
              </h3>
              <p className="text-blue-600 font-semibold mb-4">
                Co-Owner & Operations Manager
              </p>
              <p className="text-gray-600 leading-relaxed">
                Jorge brings years of experience and an unwavering commitment to
                customer satisfaction. His attention to detail and dedication to
                using the best techniques ensure every job exceeds expectations.
                When he's not transforming properties, Jorge enjoys spending
                time with family and staying active in the local community.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-gray-500 to-gray-700 aspect-square flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-8xl mb-4">👨‍💼</div>
                <p className="text-2xl font-bold">John Doe</p>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                John Doe
              </h3>
              <p className="text-blue-600 font-semibold mb-4">
                Co-Owner & Service Director
              </p>
              <p className="text-gray-600 leading-relaxed">
                John's passion for delivering outstanding results is matched
                only by his friendly, professional approach. He takes pride in
                building lasting relationships with clients and ensuring every
                surface sparkles. Outside of work, John is an avid outdoorsman
                who understands the importance of maintaining beautiful
                properties.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why We're Different
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Star className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Local Expertise
              </h3>
              <p className="text-gray-600">
                We know DFW weather, surfaces, and what it takes to keep
                properties looking great year-round.
              </p>
            </div>
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Quality Guarantee
              </h3>
              <p className="text-gray-600">
                We stand behind every job with a satisfaction guarantee. If
                you're not happy, we make it right.
              </p>
            </div>
            <div className="text-center">
              <Phone className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Personal Service
              </h3>
              <p className="text-gray-600">
                Talk directly with the owners. We're always available to answer
                questions and provide expert advice.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Work With Us?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Experience the difference of working with a team that truly cares.
          </p>
          <button
            onClick={() => navigateToPage("contact")}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition shadow-lg inline-flex items-center"
          >
            Get Your Free Quote Today <ChevronRight className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );

  const ContactPage: React.FC = () => (
    <div className="pt-20">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-blue-100">
            Get your free quote today—we respond to all inquiries within 24
            hours
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Get in Touch
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Ready to transform your property? Fill out the form and we'll
              provide you with a detailed, no-obligation quote tailored to your
              needs.
            </p>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Phone className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Phone</h3>
                  <p className="text-gray-600">(555) 123-4567</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Call or text for fastest response
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Mail className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Email</h3>
                  <p className="text-gray-600">
                    info@machucadoepressurewash.com
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    We respond within 24 hours
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Clock className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">
                    Business Hours
                  </h3>
                  <p className="text-gray-600">Monday – Saturday</p>
                  <p className="text-gray-600">8:00 AM – 6:00 PM</p>
                  <p className="text-sm text-gray-500 mt-1">Closed Sundays</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <MapPin className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Service Area</h3>
                  <p className="text-gray-600">Orlando, Florida</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Serving all surrounding areas
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 rounded-lg p-6 border-2 border-blue-100">
              <h3 className="font-bold text-gray-900 mb-2">
                Emergency Services Available
              </h3>
              <p className="text-gray-600 text-sm">
                Need immediate assistance? We offer emergency pressure washing
                services for urgent situations. Contact us for availability.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Request Your Free Quote
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Service Needed *
                </label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="">Select a service...</option>
                  <option value="house">House Washing</option>
                  <option value="driveway">Driveway Cleaning</option>
                  <option value="roof">Roof Washing</option>
                  <option value="deck">Deck & Fence Cleaning</option>
                  <option value="commercial">
                    Commercial Pressure Washing
                  </option>
                  <option value="patio">Patio & Pool Deck</option>
                  <option value="other">Other / Multiple Services</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Additional Details
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Tell us about your project, property size, and any specific concerns..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition shadow-lg"
              >
                Get My Free Quote
              </button>

              <p className="text-sm text-gray-500 text-center">
                By submitting this form, you agree to be contacted by Machuca &
                Doe Pressure Washing regarding your quote request.
              </p>
            </form>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Our Service Area
          </h2>
          <div className="bg-gray-200 rounded-xl overflow-hidden shadow-lg">
            <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <p className="text-2xl font-bold text-gray-800">Orlando, FL</p>
                <p className="text-gray-600 mt-2">
                  Google Maps Embed Placeholder
                </p>
                <p className="text-sm text-gray-500 mt-4 max-w-md mx-auto">
                  Replace this placeholder with an embedded Google Map showing
                  the DFW service area
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Proudly serving Dallas, Fort Worth, Arlington, Plano, Irving,
              Garland, Frisco, McKinney, and surrounding communities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const Footer: React.FC = () => (
    <footer className="bg-gray-900 text-white pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">M&D Pressure Washing</h3>
            <p className="text-gray-400 mb-4">
              Family-owned and trusted throughout the Orlando, Florida area.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition"
              >
                f
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition"
              >
                ig
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigateToPage("home")}
                  className="text-gray-400 hover:text-white transition"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToPage("services")}
                  className="text-gray-400 hover:text-white transition"
                >
                  Services
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToPage("gallery")}
                  className="text-gray-400 hover:text-white transition"
                >
                  Gallery
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToPage("about")}
                  className="text-gray-400 hover:text-white transition"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToPage("contact")}
                  className="text-gray-400 hover:text-white transition"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4">Services</h4>
            <ul className="space-y-2 text-gray-400">
              <li>House Washing</li>
              <li>Driveway Cleaning</li>
              <li>Roof Washing</li>
              <li>Deck & Fence</li>
              <li>Commercial</li>
              <li>Patio & Pool Deck</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4">Contact Info</h4>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm">info@machucadoepressurewash.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Mon-Sat: 8AM-6PM</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Orlando, FL</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center text-gray-400 text-sm">
          <p>
            &copy; {new Date().getFullYear()} Machuca & Doe Pressure Washing.
            All rights reserved.
          </p>
          <p className="mt-2">
            Licensed, Insured & Locally Owned | Serving the DFW Metroplex
          </p>
        </div>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      {currentPage === "home" && <HomePage />}
      {currentPage === "services" && <ServicesPage />}
      {currentPage === "gallery" && <GalleryPage />}
      {currentPage === "about" && <AboutPage />}
      {currentPage === "contact" && <ContactPage />}
      <Footer />
    </div>
  );
};

export default PressureWashingWebsite;
