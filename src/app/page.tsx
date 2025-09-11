'use client'

import { motion } from 'framer-motion'
import { Camera, Shield, Users, ArrowRight, Star, Check, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Lock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import NewsletterSubscription from '@/components/NewsletterSubscription'

export default function Home() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const totalTestimonials = 4

  // Auto-slide testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % totalTestimonials)
    }, 5000) // Change every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="relative z-50 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-2"
          >
            <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            <span className="text-lg sm:text-2xl font-bold text-white">Gallery Pavilion</span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center space-x-2 sm:space-x-4"
          >
            <Link 
              href="/auth/photographer-login" 
              className="text-white hover:text-purple-300 transition-colors"
            >
              For Photographers
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Dynamic Background Images */}
        <div className="absolute inset-0">
          <div className="relative w-full h-full">
            {/* Multiple background layers with smooth cycling */}
            <Image 
              src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80" 
              alt="Professional Photography Studio" 
              fill
              className="object-cover hero-background hero-bg-1"
              priority
            />
            <Image 
              src="https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
              alt="Wedding Photography Session" 
              fill
              className="object-cover hero-background hero-bg-2"
            />
            <Image 
              src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
              alt="Portrait Photography Setup" 
              fill
              className="object-cover hero-background hero-bg-3"
            />
            <Image 
              src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
              alt="Fashion Photography Shoot" 
              fill
              className="object-cover hero-background hero-bg-4"
            />
            <Image 
              src="https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2032&q=80" 
              alt="Nature Photography Landscape" 
              fill
              className="object-cover hero-background hero-bg-5"
            />
            <Image 
              src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2064&q=80" 
              alt="Event Photography Coverage" 
              fill
              className="object-cover hero-background hero-bg-6"
            />
          </div>
        </div>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div 
            variants={staggerChildren}
            initial="initial"
            animate="animate"
            className="text-center"
          >
            <motion.h1 
              variants={fadeInUp}
              className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 sm:mb-8 leading-tight tracking-tight"
            >
              Curated Photography
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                for Discerning Clients
              </span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed font-light px-4"
            >
              Where exceptional photographers showcase their finest work to an exclusive clientele. 
              Experience bespoke galleries, personalized service, and uncompromising quality in every interaction.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col gap-4 sm:gap-6 justify-center items-center px-4"
            >
              <Link 
                href="/auth/photographer-signup"
                className="group bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 text-white px-6 py-3 sm:px-10 sm:py-5 rounded-full font-semibold text-base sm:text-lg hover:from-purple-700 hover:via-purple-800 hover:to-pink-700 transition-all duration-500 flex items-center space-x-3 shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 w-full sm:w-auto justify-center"
              >
                <span>Apply as Photographer</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-2 transition-transform duration-300" />
              </Link>
              
              <Link 
                href="/invite"
                className="group border-2 border-white/80 text-white px-6 py-3 sm:px-10 sm:py-5 rounded-full font-semibold text-base sm:text-lg hover:bg-white/10 hover:border-white transition-all duration-500 flex items-center space-x-3 backdrop-blur-sm hover:backdrop-blur-md w-full sm:w-auto justify-center"
              >
                <span>Access Gallery Pavilion</span>
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-12 transition-transform duration-300" />
              </Link>
            </motion.div>
            
            {/* Elegant subtitle */}
            <motion.div 
              variants={fadeInUp}
              className="mt-16 text-center"
            >
              <p className="text-sm md:text-base text-gray-400 font-light tracking-wider uppercase">
                Trusted by Award-Winning Photographers Worldwide
              </p>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-600/5 to-pink-600/5 rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Why Choose Gallery Pavilion?
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto px-4">
              Built for photographers who value exclusivity, security, and premium client experiences.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: Shield,
                title: "Maximum Security",
                description: "Invite-only access, watermarked previews, and secure file delivery ensure your work stays protected."
              },
              {
                icon: Users,
                title: "Exclusive Access",
                description: "No public browsing. Clients can only access galleries through personalized invitations you control."
              },
              {
                icon: Star,
                title: "Luxury Experience",
                description: "Premium interface designed for high-end photography with sophisticated client interaction tools."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <feature.icon className="h-10 w-10 sm:h-12 sm:w-12 text-purple-400 mb-4 sm:mb-6" />
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Showcase Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Showcase Your Professional Work
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              From intimate portraits to grand events, our platform is designed to present your photography with the elegance it deserves.
            </p>
          </motion.div>
          
          {/* Photography Grid */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12"
          >
            {/* Portrait Photography */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-purple-400/50 transition-all duration-300"
            >
              <Image 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80" 
                alt="Professional Portrait Photography" 
                width={400}
                height={256}
                className="w-full h-48 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="font-semibold text-base sm:text-lg">Portrait Photography</h3>
                <p className="text-xs sm:text-sm text-gray-300">Intimate & Professional</p>
              </div>
            </motion.div>
            
            {/* Wedding Photography */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-purple-400/50 transition-all duration-300"
            >
              <Image 
                src="https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                alt="Wedding Photography" 
                width={400}
                height={256}
                className="w-full h-48 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="font-semibold text-base sm:text-lg">Wedding Photography</h3>
                <p className="text-xs sm:text-sm text-gray-300">Romantic & Timeless</p>
              </div>
            </motion.div>
            
            {/* Landscape Photography */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-purple-400/50 transition-all duration-300"
            >
              <Image 
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                alt="Landscape Photography" 
                width={400}
                height={256}
                className="w-full h-48 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="font-semibold text-base sm:text-lg">Landscape Photography</h3>
                <p className="text-xs sm:text-sm text-gray-300">Breathtaking Views</p>
              </div>
            </motion.div>
            
            {/* Event Photography */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-purple-400/50 transition-all duration-300"
            >
              <Image 
                src="https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80" 
                alt="Event Photography" 
                width={400}
                height={256}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="font-semibold text-lg">Event Photography</h3>
                <p className="text-sm text-gray-300">Memorable Moments</p>
              </div>
            </motion.div>
            
            {/* Fashion Photography */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-purple-400/50 transition-all duration-300"
            >
              <Image 
                src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                alt="Fashion Photography" 
                width={400}
                height={256}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="font-semibold text-lg">Fashion Photography</h3>
                <p className="text-sm text-gray-300">Style & Elegance</p>
              </div>
            </motion.div>
            
            {/* Nature Photography */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-purple-400/50 transition-all duration-300"
            >
              <Image 
                src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80" 
                alt="Nature Photography" 
                width={400}
                height={256}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="font-semibold text-lg">Nature Photography</h3>
                <p className="text-sm text-gray-300">Natural Beauty</p>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Call to Action */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-lg text-gray-300 mb-6">
              Ready to showcase your work with the same level of professionalism?
            </p>
            <Link 
              href="/auth/photographer-signup"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg"
            >
              <span>Join Our Platform</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>



      {/* Trusted Partners Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Trusted by Professional Photographers
            </h2>
            <p className="text-xl text-gray-300">
              Join hundreds of photographers who trust us with their most valuable work.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center"
          >
            <Image 
              src="/vogue-logo.svg" 
              alt="Vogue" 
              width={120}
              height={40}
              className="h-10 w-auto opacity-60 hover:opacity-100 transition-opacity rounded"
            />
            <Image 
              src="/natgeo-wild-logo.svg" 
              alt="National Geographic Wild" 
              width={120}
              height={40}
              className="h-10 w-auto opacity-60 hover:opacity-100 transition-opacity rounded"
            />
            <Image 
              src="/aperture-logo.svg" 
              alt="Aperture" 
              width={120}
              height={40}
              className="h-10 w-auto opacity-60 hover:opacity-100 transition-opacity rounded"
            />
            <Image 
              src="/getty-images-logo.svg" 
              alt="Getty Images" 
              width={120}
              height={40}
              className="h-10 w-auto opacity-60 hover:opacity-100 transition-opacity rounded"
            />
          </motion.div>
          
          {/* Enhanced Testimonials Carousel */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <div className="relative">
              {/* Testimonials Container */}
              <div className="overflow-hidden rounded-2xl">
                <motion.div 
                  className="flex transition-transform duration-500 ease-in-out"
                  animate={{ x: `-${currentTestimonial * 100}%` }}
                  style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
                >
                  {/* Testimonial 1 */}
                  <div className="w-full flex-shrink-0 px-4">
                    <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300 shadow-2xl">
                      <div className="flex items-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">JS</span>
                        </div>
                        <div className="ml-6">
                          <h4 className="font-bold text-white text-xl">Jessica Smith</h4>
                          <p className="text-purple-300 font-medium">Wedding Photographer</p>
                          <div className="flex mt-2">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="text-yellow-400 text-sm">⭐</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-200 text-lg leading-relaxed italic">
                        &quot;This platform has completely transformed how I share galleries with my clients. The security features and elegant presentation are absolutely unmatched in the industry.&quot;
                      </p>
                    </div>
                  </div>
                  
                  {/* Testimonial 2 */}
                  <div className="w-full flex-shrink-0 px-4">
                    <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300 shadow-2xl">
                      <div className="flex items-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">MJ</span>
                        </div>
                        <div className="ml-6">
                          <h4 className="font-bold text-white text-xl">Michael Johnson</h4>
                          <p className="text-blue-300 font-medium">Portrait Photographer</p>
                          <div className="flex mt-2">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="text-yellow-400 text-sm">⭐</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-200 text-lg leading-relaxed italic">
                        &quot;My clients absolutely love the exclusive experience. The invite system makes every gallery feel special, private, and truly premium.&quot;
                      </p>
                    </div>
                  </div>
                  
                  {/* Testimonial 3 */}
                  <div className="w-full flex-shrink-0 px-4">
                    <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300 shadow-2xl">
                      <div className="flex items-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">EB</span>
                        </div>
                        <div className="ml-6">
                          <h4 className="font-bold text-white text-xl">Emily Brown</h4>
                          <p className="text-green-300 font-medium">Event Photographer</p>
                          <div className="flex mt-2">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="text-yellow-400 text-sm">⭐</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-200 text-lg leading-relaxed italic">
                        &quot;The detailed analytics help me understand exactly what my clients love most about my work. It&apos;s absolutely invaluable for continuously improving my craft.&quot;
                      </p>
                    </div>
                  </div>
                  
                  {/* Testimonial 4 */}
                  <div className="w-full flex-shrink-0 px-4">
                    <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300 shadow-2xl">
                      <div className="flex items-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">DW</span>
                        </div>
                        <div className="ml-6">
                          <h4 className="font-bold text-white text-xl">David Wilson</h4>
                          <p className="text-pink-300 font-medium">Fashion Photographer</p>
                          <div className="flex mt-2">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="text-yellow-400 text-sm">⭐</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-200 text-lg leading-relaxed italic">
                        &quot;The platform&apos;s sophisticated design perfectly matches the high-end nature of my fashion work. My clients are consistently impressed with the presentation.&quot;
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Navigation Dots */}
              <div className="flex justify-center mt-8 space-x-3">
                {[0, 1, 2, 3].map((index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                      currentTestimonial === index ? 'bg-white' : 'bg-white/30 hover:bg-white/60'
                    }`}
                  ></button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Advanced Features Showcase */}
      <section className="px-6 py-20 bg-gradient-to-br from-black via-purple-900/20 to-black relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-20 w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
            <div className="absolute top-40 right-32 w-1 h-1 bg-pink-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-green-400 rounded-full animate-ping" style={{animationDelay: '3s'}}></div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Next-Generation Features
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Experience cutting-edge technology designed specifically for professional photographers and their discerning clients.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Features List */}
            <div className="space-y-8">
              {[
                {
                  icon: "🤖",
                  title: "AI-Powered Organization",
                  description: "Automatically tag and categorize your photos using advanced machine learning algorithms.",
                  color: "from-purple-500 to-pink-500"
                },
                {
                  icon: "⚡",
                  title: "Real-Time Collaboration",
                  description: "Work seamlessly with clients and team members with instant sync and live editing capabilities.",
                  color: "from-blue-500 to-purple-500"
                },
                {
                  icon: "🔒",
                  title: "Military-Grade Security",
                  description: "End-to-end encryption and blockchain verification ensure your work is always protected.",
                  color: "from-green-500 to-blue-500"
                },
                {
                  icon: '📊',
                  title: 'Advanced Analytics',
                  description: 'Deep insights into client engagement, popular styles, and business performance metrics.',
                  color: 'from-orange-500 to-red-500'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02, x: 10 }}
                  className="flex items-start space-x-6 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-300 group"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Right Column - Interactive Demo */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="bg-black/50 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-gray-400 text-sm">Dashboard Preview</span>
                  </div>
                  
                  {/* Simulated Dashboard */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Gallery Views Today</span>
                      <motion.span 
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-green-400 font-bold"
                      >
                        +247
                      </motion.span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '78%' }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                      ></motion.div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      {[1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: i * 0.2 }}
                          viewport={{ once: true }}
                          className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-3 text-center"
                        >
                          <div className="w-full h-16 bg-gray-600 rounded mb-2"></div>
                          <span className="text-xs text-gray-300">Photo {i}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-3">Live Dashboard</h3>
                  <p className="text-gray-300">Real-time insights at your fingertips</p>
                </div>
              </div>
              
              {/* Floating Elements */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 w-8 h-8 bg-purple-500 rounded-full blur-sm opacity-60"
              ></motion.div>
              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-500 rounded-full blur-sm opacity-60"
              ></motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-purple-900 to-pink-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Elevate Your Photography Business?
            </h2>
            <p className="text-xl text-gray-200 mb-8">
              Join the exclusive community of photographers who prioritize security and luxury.
            </p>
            <Link 
              href="/auth/photographer-signup"
              className="inline-flex items-center space-x-2 bg-white text-purple-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors shadow-2xl"
            >
              <span>Start Your Application</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="px-6 py-20 bg-gradient-to-br from-slate-900 to-purple-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              About <span className="gradient-text">Gallery Pavilion</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We revolutionize how professional photographers share their work with clients through secure, private galleries that protect your creative assets while delivering an exceptional viewing experience.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Image 
                src="https://images.unsplash.com/photo-1502920917128-1aa500764cbd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                alt="Professional photographer at work" 
                width={500}
                height={384}
                className="rounded-2xl shadow-2xl w-full h-96 object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Military-Grade Security</h3>
                  <p className="text-gray-300">Your photos are protected with end-to-end encryption and secure access controls.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Client-Focused Experience</h3>
                  <p className="text-gray-300">Intuitive galleries that make it easy for clients to view, favorite, and request photos.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Professional Tools</h3>
                  <p className="text-gray-300">Advanced features designed specifically for professional photographers&apos; workflows.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="px-6 py-20 bg-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Our <span className="gradient-text">Services</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Comprehensive solutions for every aspect of your photography business
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="glass-card p-8 text-center hover:scale-105 transition-transform duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Private Galleries</h3>
              <p className="text-gray-300 mb-6">Secure, password-protected galleries for sharing your work with clients</p>
              <ul className="text-left space-y-2 text-gray-400">
                <li className="flex items-center"><Check className="h-4 w-4 text-green-400 mr-2" />Unlimited photo uploads</li>
                <li className="flex items-center"><Check className="h-4 w-4 text-green-400 mr-2" />Custom branding</li>
                <li className="flex items-center"><Check className="h-4 w-4 text-green-400 mr-2" />Download controls</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-8 text-center hover:scale-105 transition-transform duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Client Management</h3>
              <p className="text-gray-300 mb-6">Streamlined tools for managing client relationships and projects</p>
              <ul className="text-left space-y-2 text-gray-400">
                <li className="flex items-center"><Check className="h-4 w-4 text-green-400 mr-2" />Client portal access</li>
                <li className="flex items-center"><Check className="h-4 w-4 text-green-400 mr-2" />Project organization</li>
                <li className="flex items-center"><Check className="h-4 w-4 text-green-400 mr-2" />Communication tools</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="glass-card p-8 text-center hover:scale-105 transition-transform duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Analytics & Insights</h3>
              <p className="text-gray-300 mb-6">Detailed analytics to understand client engagement and preferences</p>
              <ul className="text-left space-y-2 text-gray-400">
                <li className="flex items-center"><Check className="h-4 w-4 text-green-400 mr-2" />View tracking</li>
                <li className="flex items-center"><Check className="h-4 w-4 text-green-400 mr-2" />Engagement metrics</li>
                <li className="flex items-center"><Check className="h-4 w-4 text-green-400 mr-2" />Performance reports</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>



      {/* FAQ Section */}
      <section className="px-6 py-20 bg-black">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-xl text-gray-300">
              Everything you need to know about Gallery Pavilion
            </p>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="glass-card p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-3">How secure are my photos?</h3>
              <p className="text-gray-300">Your photos are protected with military-grade encryption, secure cloud storage, and access controls. We use the same security standards as major financial institutions to ensure your creative work is completely safe.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-3">Can I customize the galleries with my branding?</h3>
              <p className="text-gray-300">Absolutely! All plans include custom branding options. You can add your logo, choose color schemes, and even use a custom domain with our Professional and Enterprise plans.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="glass-card p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-3">What file formats do you support?</h3>
              <p className="text-gray-300">We support all major image formats including JPEG, PNG, TIFF, and RAW files. Our platform automatically optimizes images for web viewing while preserving the original quality for downloads.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="glass-card p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-3">How do clients access their galleries?</h3>
              <p className="text-gray-300">Clients receive a secure link and password to access their gallery. They can view, favorite, and download photos (if you allow it) from any device without needing to create an account.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="glass-card p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-3">Can I track how clients interact with my galleries?</h3>
              <p className="text-gray-300">Yes! Our analytics dashboard shows you detailed insights including which photos clients view most, download activity, time spent in galleries, and engagement patterns to help you understand client preferences.</p>
            </motion.div>


          </div>
        </div>
      </section>

      {/* Statistics & Social Proof Section */}
      <section className="px-6 py-16 bg-gradient-to-br from-slate-900 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trusted by <span className="gradient-text">Thousands</span> of Photographers
            </h2>
            <p className="text-lg text-gray-300">
              Join the growing community of professionals who trust Gallery Pavilion
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">5,000+</div>
              <div className="text-gray-300">Active Photographers</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">2M+</div>
              <div className="text-gray-300">Photos Shared Securely</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">99.9%</div>
              <div className="text-gray-300">Uptime Guarantee</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">4.9/5</div>
              <div className="text-gray-300">Average Rating</div>
            </motion.div>
          </div>
          
          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center items-center gap-8 mt-16"
          >
            <div className="flex items-center space-x-2 text-gray-300">
              <Shield className="h-6 w-6 text-green-400" />
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Lock className="h-6 w-6 text-blue-400" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <CheckCircle className="h-6 w-6 text-purple-400" />
              <span>SOC 2 Certified</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Star className="h-6 w-6 text-yellow-400" />
              <span>Award Winning</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Newsletter Signup Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-purple-900 to-pink-900">
        <div className="max-w-4xl mx-auto text-center">
          <NewsletterSubscription />
        </div>
      </section>

      {/* Contact Section */}
      <section className="px-6 py-20 bg-gradient-to-br from-black via-purple-900/20 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Get in <span className="gradient-text">Touch</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Ready to elevate your photography business? Contact us today and discover how Gallery Pavilion can transform your client experience.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Send us a Message</h3>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">First Name</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Last Name</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Photography Type</label>
                  <select className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="" className="bg-gray-800">Select your specialty</option>
                    <option value="wedding" className="bg-gray-800">Wedding Photography</option>
                    <option value="portrait" className="bg-gray-800">Portrait Photography</option>
                    <option value="event" className="bg-gray-800">Event Photography</option>
                    <option value="fashion" className="bg-gray-800">Fashion Photography</option>
                    <option value="landscape" className="bg-gray-800">Landscape Photography</option>
                    <option value="wildlife" className="bg-gray-800">Wildlife Photography</option>
                    <option value="other" className="bg-gray-800">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Message</label>
                  <textarea 
                    rows={5}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Tell us about your photography business and how we can help..."
                  ></textarea>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Send Message
                </motion.button>
              </form>
            </motion.div>

            {/* Contact Information & Location */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              {/* Contact Info */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-6">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-300">Email</p>
                      <p className="text-white font-semibold">hello@gallerypavilion.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-300">WhatsApp</p>
                      <p className="text-white font-semibold">+1 (289) 532-4337</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-300">Address</p>
                      <p className="text-white font-semibold">Near ARC - Architectural Photography<br />1188 Richards St, Vancouver, BC V6B 3E6, Canada</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-6">Business Hours</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Monday - Friday</span>
                    <span className="text-white font-semibold">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Saturday</span>
                    <span className="text-white font-semibold">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Sunday</span>
                    <span className="text-white font-semibold">Closed</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-purple-600/20 rounded-lg border border-purple-500/30">
                  <p className="text-purple-300 text-sm">
                    <strong>Note:</strong> We offer 24/7 technical support for all premium subscribers.
                  </p>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-6">Our Location</h3>
                <div className="bg-gray-800 rounded-lg h-48 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                    <p className="text-gray-300">Interactive Map</p>
                    <p className="text-sm text-gray-400">Vancouver, BC, Canada</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:shadow-purple-500/25 transition-all duration-300 group"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Camera className="h-8 w-8 group-hover:scale-110 transition-transform duration-300" />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 z-50 origin-left"
        style={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        transition={{ duration: 0.3 }}
      ></motion.div>

      {/* Footer */}
      <footer className="px-6 py-16 bg-black relative overflow-hidden">
        {/* Footer Background Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/3 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Camera className="h-8 w-8 text-white" />
                </motion.div>
                <span className="text-2xl font-bold text-white gradient-text">Gallery Pavilion</span>
              </motion.div>
              <p className="text-gray-400 leading-relaxed">
                The premier platform for professional photographers to securely share their work with clients through private, branded galleries.
              </p>
              <div className="flex space-x-4">
                <motion.a 
                  href="#" 
                  whileHover={{ scale: 1.2, color: "#3b82f6" }}
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </motion.a>
                <motion.a 
                  href="#" 
                  whileHover={{ scale: 1.2, color: "#1da1f2" }}
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </motion.a>
                <motion.a 
                  href="#" 
                  whileHover={{ scale: 1.2, color: "#e1306c" }}
                  className="text-gray-400 hover:text-pink-400 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </motion.a>
                <motion.a 
                  href="#" 
                  whileHover={{ scale: 1.2, color: "#0077b5" }}
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </motion.a>

              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-semibold text-white mb-6">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link href="/auth/photographer-login" className="text-gray-400 hover:text-white transition-colors">For Photographers</Link>
                  </motion.div>
                </li>
                <li>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link href="/invite" className="text-gray-400 hover:text-white transition-colors">Client Access</Link>
                  </motion.div>
                </li>

                <li>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link href="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link>
                  </motion.div>
                </li>
                <li>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link href="/gallery-examples" className="text-gray-400 hover:text-white transition-colors">Gallery Examples</Link>
                  </motion.div>
                </li>
                <li>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link>
                  </motion.div>
                </li>
              </ul>
            </motion.div>

            {/* Support */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-semibold text-white mb-6">Support</h3>
              <ul className="space-y-3">
                <li>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link href="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link>
                  </motion.div>
                </li>
              </ul>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-semibold text-white mb-6">Contact Us</h3>
              <div className="space-y-4">
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex items-center space-x-3 text-gray-400"
                >
                  <Mail className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <a href="mailto:support@gallerypavilion.com" className="hover:text-white transition-colors">
                  support@gallerypavilion.com
                    </a>
                  </div>
                </motion.div>
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex items-center space-x-3 text-gray-400"
                >
                  <Phone className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-500">WhatsApp</p>
                    <a href="https://wa.me/12895324337" className="hover:text-white transition-colors">
                      +1 (289) 532-4337
                    </a>
                  </div>
                </motion.div>
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex items-start space-x-3 text-gray-400"
                >
                  <MapPin className="h-5 w-5 text-purple-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="hover:text-white transition-colors">
                      Near ARC - Architectural Photography<br />
                      1188 Richards St<br />
                      Vancouver, BC V6B 3E6, Canada
                    </p>
                  </div>
                </motion.div>
                <div className="pt-4">
                  <p className="text-sm text-gray-500 mb-2">Business Hours</p>
                  <p className="text-gray-400 text-sm">
                    Monday - Friday: 9:00 AM - 6:00 PM PST<br />
                    Saturday: 10:00 AM - 4:00 PM PST<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="border-t border-gray-800 pt-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-gray-400">
                <p>&copy; 2024 Gallery Pavilion. All rights reserved.</p>
                <div className="flex space-x-4 text-sm">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
                  </motion.div>
                </div>
              </div>
              <motion.div 
                className="flex items-center space-x-4 text-sm text-gray-500"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <span>Powered by cutting-edge technology</span>
                <span className="text-purple-400">•</span>
                <span>Secured with military-grade encryption</span>
                <span className="text-purple-400">•</span>
                <span>99.9% uptime guarantee</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
