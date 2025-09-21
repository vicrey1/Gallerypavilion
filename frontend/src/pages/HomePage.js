import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Professional photography showcase images
const fallbackImages = [
  {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    alt: 'Wildlife photography - lion in the savannah',
    category: 'Wildlife',
    photographer: 'Nature Masters'
  },
  {
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    alt: 'Portrait photography - professional headshot',
    category: 'Portraits',
    photographer: 'Studio Elite'
  },
  {
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    alt: 'Event photography - luxury wedding moment',
    category: 'Events',
    photographer: 'Premier Events'
  },
  {
    url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    alt: 'Fine art photography - gallery print',
    category: 'Fine Art',
    photographer: 'Artistic Vision'
  },
  {
    url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    alt: 'Landscape photography - mountain sunrise',
    category: 'Landscapes',
    photographer: 'Earth Collective'
  },
  {
    url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    alt: 'Fashion photography - editorial campaign',
    category: 'Fashion',
    photographer: 'Studio Elite'
  },
  {
    url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    alt: 'AI & generative inspired visuals - abstract product scene',
    category: 'AI',
    photographer: 'Creative Labs'
  }
];

const companyLogos = [
  {
    name: 'Adobe Creative',
    logo: (
      <svg className="w-12 h-12" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#FF0000" rx="8"/>
        <text x="50" y="35" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">Aa</text>
        <text x="50" y="70" textAnchor="middle" fontSize="8" fill="white">ADOBE</text>
      </svg>
    ),
    description: 'Creative Partner',
  },
  {
    name: 'Canon Professional',
    logo: (
      <svg className="w-12 h-12" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#E60012" rx="8"/>
        <circle cx="50" cy="40" r="15" fill="white"/>
        <circle cx="50" cy="40" r="10" fill="#E60012"/>
        <text x="50" y="70" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">CANON</text>
      </svg>
    ),
    description: 'Camera Partner',
  },
  {
    name: 'Sony Alpha',
    logo: (
      <svg className="w-12 h-12" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#000000" rx="8"/>
        <text x="50" y="40" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white">SONY</text>
        <text x="50" y="65" textAnchor="middle" fontSize="10" fill="#FFD700">α</text>
      </svg>
    ),
    description: 'Technology Partner',
  },
  {
    name: 'National Geographic',
    logo: (
      <svg className="w-12 h-12" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#FFD700" rx="8"/>
        <rect x="10" y="20" width="80" height="40" fill="#000000" rx="4"/>
        <text x="50" y="45" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#FFD700">NAT GEO</text>
        <text x="50" y="75" textAnchor="middle" fontSize="6" fill="#000000">EXPLORER</text>
      </svg>
    ),
    description: 'Media Partner',
  },
];

const HomePage = () => {

  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroImages, setHeroImages] = useState([]);
  const [loading, setLoading] = useState(true);
  // Access Gallery (Invite Only) modal state
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [accessError, setAccessError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // For now, use fallback images. In production, this would fetch from Unsplash API
    setHeroImages(fallbackImages);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (heroImages.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroImages.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [heroImages.length]);

  // Smooth scroll to section when hash is present in the URL
  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location.hash]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  // Handle Access Gallery (Invite Only) submission
  const handleAccessSubmit = (e) => {
    e.preventDefault();
    const token = (inviteToken || '').trim();
    if (!token) {
      setAccessError('Please enter a valid invite token.');
      return;
    }
    const password = (invitePassword || '').trim();
    const query = password ? `?password=${encodeURIComponent(password)}` : '';
    setShowAccessModal(false);
    navigate(`/gallery/${encodeURIComponent(token)}${query}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {/* Background Slideshow */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <motion.div
              key={index}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: index === currentSlide ? 1 : 0 }}
              transition={{ duration: 1 }}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
              
              {/* Image Info Overlay */}
              <div className="absolute bottom-20 left-8 text-white z-20">
                <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <p className="text-sm text-gold-400 font-medium mb-1">{image.category}</p>
                  <p className="text-xs text-gray-300">by {image.photographer}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gold-400 transition-colors z-10"
        >
          <ChevronLeftIcon className="h-8 w-8" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gold-400 transition-colors z-10"
        >
          <ChevronRightIcon className="h-8 w-8" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-gold-400' : 'bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center justify-center text-center text-white px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            <div className="mb-6">
              <span className="inline-block bg-gold-400/20 text-gold-400 px-4 py-2 rounded-full text-sm font-medium mb-4 backdrop-blur-sm border border-gold-400/30">
                Est. 2018 • Global Photography Network
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-serif font-bold mb-6 text-shadow-lg leading-tight">
              Gallery Pavilion
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl mb-4 text-shadow font-light">
              Gallery Pavilion — Where Photography Meets Exclusivity.
            </p>
            <p className="text-lg md:text-xl mb-8 text-gray-200 max-w-3xl mx-auto leading-relaxed">
              Connecting elite photographers with discerning clients across 50+ countries. 
              Over 10,000 professional artists. Millions of exclusive moments captured.
            </p>
            
            {/* Statistics */}
            <div className="flex flex-wrap justify-center gap-8 mb-10 text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4 border border-white/20">
                <div className="text-3xl font-bold text-gold-400">10K+</div>
                <div className="text-sm text-gray-300">Professional Artists</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4 border border-white/20">
                <div className="text-3xl font-bold text-gold-400">50+</div>
                <div className="text-sm text-gray-300">Countries</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4 border border-white/20">
                <div className="text-3xl font-bold text-gold-400">1M+</div>
                <div className="text-sm text-gray-300">Exclusive Moments</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                to="/signup"
                className="btn-gold text-base sm:text-lg px-6 sm:px-10 py-3 sm:py-4 hover:scale-105 transform transition-all duration-300 shadow-2xl z-20"
              >
                Sign Up as Photographer
              </Link>
              <button
                className="btn-secondary bg-white/15 backdrop-blur-sm text-white border-white/30 hover:bg-white/25 text-base sm:text-lg px-6 sm:px-10 py-3 sm:py-4 transition-all duration-300 z-20"
                onClick={() => {
                  setInviteToken('');
                  setInvitePassword('');
                  setAccessError('');
                  setShowAccessModal(true);
                }}
              >
                Access Gallery (Invite Only)
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block bg-gold-400/10 text-gold-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
              Global Network
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our exclusive platform partners with the world's most prestigious photography brands and publications, 
              ensuring our network maintains the highest standards of excellence.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-8 items-center">
            {companyLogos.map((company, index) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 group-hover:border-gold-300">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:from-gold-50 group-hover:to-gold-100 transition-all duration-300 overflow-hidden">
                    {company.logo}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-center mb-2">{company.name}</h3>
                  <p className="text-sm text-gold-600 text-center font-medium">{company.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional Portfolio Showcase */}
      <section id="portfolio" className="py-24 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-gold-400/20 text-gold-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            Portfolio Excellence
          </span>
          <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6">
            Diverse Artistry
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            From intimate portraits to sweeping landscapes, explore the range of professional photography genres
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                category: 'Portraits',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                count: '3,000+ sessions'
              },
              {
                category: 'Landscapes',
                image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                count: '1,800+ locations'
              },
              {
                category: 'Fashion & Editorial',
                image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                count: '2,500+ shoots'
              },
              {
                category: 'Fine Art & Gallery',
                image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                count: '800+ exhibitions'
              }
            ].map((item, index) => (
               <motion.div
                 key={index}
                 initial={{ opacity: 0, scale: 0.9 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 transition={{ duration: 0.6, delay: index * 0.1 }}
                 className="group relative overflow-hidden rounded-2xl aspect-[3/4] cursor-pointer"
               >
                 <img
                   src={item.image}
                   alt={item.category}
                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                   referrerPolicy="no-referrer"
                   crossOrigin="anonymous"
                   loading="lazy"
                   decoding="async"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                 <div className="absolute bottom-6 left-6 right-6">
                   <h3 className="text-xl font-serif font-bold mb-2 text-white">{item.category}</h3>
                   <p className="text-gold-400 text-sm font-medium">{item.count}</p>
                 </div>
                 <div className="absolute inset-0 bg-gold-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
               </motion.div>
             ))}
           </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12"
          >
            <div className="text-center mt-12">
              <Link to="/login" className="btn-gold px-8 py-4 text-lg hover:scale-105 transform transition-all duration-300">
                Explore Full Portfolio
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three simple steps to showcase your photography in a premium, private environment
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Create Your Account',
                description: 'Sign up as a photographer and wait for admin approval to ensure quality standards.'
              },
              {
                step: '02',
                title: 'Upload & Organize',
                description: 'Create galleries, upload your best work, and organize them into collections.'
              },
              {
                step: '03',
                title: 'Share Privately',
                description: 'Generate secure share links with optional passwords for exclusive client access.'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-serif font-semibold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards & Recognition Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block bg-gold-400/20 text-gold-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
              Industry Recognition
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Award-Winning Platform
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Recognized by industry leaders for innovation, security, and excellence in professional photography services
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                award: 'Best Photography Platform',
                year: '2023',
                organization: 'Digital Photography Awards',
                icon: '🏆'
              },
              {
                award: 'Innovation in Visual Arts',
                year: '2023',
                organization: 'Creative Industry Council',
                icon: '🎨'
              },
              {
                award: 'Security Excellence',
                year: '2022',
                organization: 'Tech Security Institute',
                icon: '🔒'
              },
              {
                award: 'Professional Choice',
                year: '2022',
                organization: 'Photography Professional Guild',
                icon: '⭐'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 group-hover:border-gold-400/30 transition-all duration-300 group-hover:bg-white/10">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.award}</h3>
                  <p className="text-gold-400 font-medium mb-2">{item.year}</p>
                  <p className="text-sm text-gray-400">{item.organization}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Certifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 text-center"
          >
            <h3 className="text-2xl font-serif font-bold mb-8">Certified & Compliant</h3>
            <div className="flex flex-wrap justify-center gap-8 items-center">
              {[
                'ISO 27001 Security',
                'GDPR Compliant',
                'SOC 2 Type II',
                'Privacy Shield Certified'
              ].map((cert, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/20">
                  <span className="text-sm font-medium text-gray-300">{cert}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* For Photographers Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-serif font-bold text-gray-900 mb-6">
                For Photographers
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Showcase your work in a premium environment designed for professional photographers. 
                Control access, protect your images with watermarks, and provide clients with an 
                exclusive viewing experience.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Watermarked previews protect your originals',
                  'Private galleries with secure share links',
                  'Professional presentation tools',
                  'Client inquiry management',
                  'Mobile-optimized viewing experience'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <svg className="h-5 w-5 text-primary-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="btn-primary text-lg px-8 py-3">
                Start Your Gallery
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1502920917128-1aa500764cbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&h=700&q=80"
                alt="Photographer at work"
                className="rounded-lg shadow-xl w-full h-auto"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                loading="lazy"
                decoding="async"
              />
            </motion.div>
           </div>
         </div>
       </section>

      {/* For Clients Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <img
                src="https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&h=700&q=80"
                alt="Client in an art museum"
                className="rounded-lg shadow-xl w-full h-auto"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                loading="lazy"
                decoding="async"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-4xl font-serif font-bold text-gray-900 mb-6">
                For Clients
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Experience photography like never before. Access exclusive galleries through 
                secure invite links and enjoy a premium viewing experience designed for 
                discerning clients.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Exclusive access via secure invite links',
                  'Beautiful masonry grid layouts',
                  'Full-screen lightbox viewing',
                  'Mobile-optimized touch controls',
                  'Direct inquiry and purchase options'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <svg className="h-5 w-5 text-accent-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="bg-gradient-to-r from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">
              Trusted by Leading Photographers
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of professional photographers who trust Gallery Pavilion 
              to showcase their most precious work
            </p>
          </div>
          
          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                quote: "Gallery Pavilion transformed how I present my work to clients. The private galleries and watermarking give me complete control.",
                author: "Sarah Chen",
                role: "Wedding Photographer",
                rating: 5
              },
              {
                quote: "The secure sharing features and professional presentation have elevated my business. My clients love the experience.",
                author: "Marcus Rodriguez",
                role: "Portrait Photographer", 
                rating: 5
              },
              {
                quote: "Finally, a platform that understands the needs of professional photographers. The quality and security are unmatched.",
                author: "Emma Thompson",
                role: "Fashion Photographer",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "10,000+", label: "Professional Photographers" },
              { number: "500K+", label: "Photos Shared Securely" },
              { number: "99.9%", label: "Uptime Guarantee" },
              { number: "24/7", label: "Premium Support" }
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsor Logos Section */}
      <section className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-lg font-semibold text-gray-600 mb-8">
              Trusted by industry leaders and featured in
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center opacity-60">
              {[
                { name: "Adobe", width: "w-24" },
                { name: "Canon", width: "w-20" },
                { name: "Nikon", width: "w-20" },
                { name: "Sony", width: "w-16" },
                { name: "Fujifilm", width: "w-24" },
                { name: "Leica", width: "w-20" }
              ].map((brand, index) => (
                <div key={index} className="flex justify-center">
                  <div className={`${brand.width} h-12 bg-gray-300 rounded flex items-center justify-center`}>
                    <span className="text-gray-600 font-semibold text-sm">{brand.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Luxury Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-2">
              <div className="mb-8">
                <h3 className="text-3xl font-serif font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Gallery Pavilion
                </h3>
                <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
                  The premier platform for professional photographers to showcase their work 
                  in a private, premium environment. Elevating photography through secure, 
                  elegant presentation.
                </p>
              </div>
              <div className="mb-8">
                <h4 className="font-semibold mb-4 text-gray-200">Connect With Us</h4>
                <div className="flex space-x-6">
                  {[
                    { name: 'Instagram', icon: '📷' },
                    { name: 'Twitter', icon: '🐦' },
                    { name: 'Facebook', icon: '📘' },
                    { name: 'LinkedIn', icon: '💼' }
                  ].map((social) => (
                    <button
                      key={social.name}
                      className="group flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                      onClick={() => console.log(`Navigate to ${social.name}`)}
                    >
                      <span className="text-xl">{social.icon}</span>
                      <span className="hidden md:block">{social.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-gray-200 border-b border-gray-700 pb-2">Platform</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link to="/signup" className="hover:text-white transition-colors duration-300 hover:pl-2">Sign Up</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors duration-300 hover:pl-2">Login</Link></li>
                <li><button className="hover:text-white transition-colors duration-300 hover:pl-2" onClick={() => console.log('Navigate to Features')}>Features</button></li>
                <li><button className="hover:text-white transition-colors duration-300 hover:pl-2" onClick={() => console.log('Navigate to Pricing')}>Pricing</button></li>
                <li><button className="hover:text-white transition-colors duration-300 hover:pl-2" onClick={() => console.log('Navigate to API')}>API</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-gray-200 border-b border-gray-700 pb-2">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><button className="hover:text-white transition-colors duration-300 hover:pl-2" onClick={() => console.log('Navigate to Help Center')}>Help Center</button></li>
                <li><button className="hover:text-white transition-colors duration-300 hover:pl-2" onClick={() => console.log('Navigate to Contact')}>Contact</button></li>
                <li><button className="hover:text-white transition-colors duration-300 hover:pl-2" onClick={() => console.log('Navigate to Privacy')}>Privacy Policy</button></li>
                <li><button className="hover:text-white transition-colors duration-300 hover:pl-2" onClick={() => console.log('Navigate to Terms')}>Terms of Service</button></li>
                <li><button className="hover:text-white transition-colors duration-300 hover:pl-2" onClick={() => console.log('Navigate to Security')}>Security</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-16 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 mb-4 md:mb-0">
                <p>&copy; 2024 Gallery Pavilion. All rights reserved.</p>
                <p className="mt-1 text-sm">Crafted with ❤️ for photographers worldwide</p>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  All systems operational
                </span>
                <span>Images courtesy of Unsplash photographers</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Access Gallery Modal */}
      {showAccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-serif font-bold text-gray-900">
                Access Gallery
              </h3>
              <button
                onClick={() => setShowAccessModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAccessSubmit} className="space-y-4">
              <div>
                <label htmlFor="inviteToken" className="block text-sm font-medium text-gray-700 mb-1">
                  Invite Token *
                </label>
                <input
                  type="text"
                  id="inviteToken"
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  placeholder="Enter your invite token"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="invitePassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Password (Optional)
                </label>
                <input
                  type="password"
                  id="invitePassword"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  placeholder="Enter password if required"
                />
              </div>
              
              {accessError && (
                <div className="text-red-600 text-sm">
                  {accessError}
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAccessModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-gold px-4 py-2"
                >
                  Access Gallery
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HomePage;