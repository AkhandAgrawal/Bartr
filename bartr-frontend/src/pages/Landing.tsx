import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers, FiMessageCircle, FiSearch, FiArrowRight, FiCode, 
  FiMusic, FiBook, FiZap, FiShield, FiTrendingUp, FiHeart, FiStar,
  FiCheck, FiAward, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import { userService } from '../services/userService';
import { matchingService } from '../services/matchingService';

export const Landing = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [stats, setStats] = useState({ activeUsers: 0, matchesMade: 0 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate responsive dimensions based on screen width
  const getCardDimensions = () => {
    const width = window.innerWidth;
    if (width < 640) {
      // Extra small screens
      return { width: 200, height: 360, headerHeight: 'h-36', fontSize: 'text-xs', padding: 'p-2' };
    } else if (width < 768) {
      // Small screens
      return { width: 220, height: 380, headerHeight: 'h-40', fontSize: 'text-xs', padding: 'p-3' };
    } else if (width < 1024) {
      // Medium screens
      return { width: 240, height: 400, headerHeight: 'h-44', fontSize: 'text-xs', padding: 'p-3' };
    } else if (width < 1280) {
      // Large screens
      return { width: 260, height: 460, headerHeight: 'h-44', fontSize: 'text-sm', padding: 'p-4' };
    } else {
      // Extra large screens
      return { width: 280, height: 480, headerHeight: 'h-44', fontSize: 'text-sm', padding: 'p-4' };
    }
  };

  const [cardDimensions, setCardDimensions] = useState(getCardDimensions());

  useEffect(() => {
    const updateDimensions = () => {
      setCardDimensions(getCardDimensions());
    };
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Fetch stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [activeUsers, matchesMade] = await Promise.all([
          userService.getActiveUsersCount(),
          matchingService.getMatchesCount(),
        ]);
        setStats({ activeUsers, matchesMade });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Keep default values on error
      }
    };
    fetchStats();
  }, []);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (auth.isAuthenticated && !auth.isLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [auth.isAuthenticated, auth.isLoading, navigate]);

  // Show loading state while checking authentication
  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // Don't render landing page content if user is authenticated
  if (auth.isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  // FAQ Component
  const FAQAccordion = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
      {
        question: 'How does skill exchange work on Bartr?',
        answer: 'Bartr connects professionals who want to learn from each other. You can offer skills you\'re good at and request skills you want to learn. Our AI matches you with compatible partners for mutual skill exchange.',
      },
      {
        question: 'Is Bartr free to use?',
        answer: 'Yes! Bartr is completely free to start. You can create your profile, browse matches, and start exchanging skills at no cost. Premium features may be available in the future.',
      },
      {
        question: 'How are matches determined?',
        answer: 'Our intelligent matching algorithm analyzes your skills offered and skills wanted to find users who complement your learning goals. The more detailed your profile, the better matches you\'ll receive.',
      },
      {
        question: 'Is my data secure on Bartr?',
        answer: 'Absolutely. We use industry-standard encryption to protect your data. Your conversations are private, and we never share your information with third parties without your consent.',
      },
      {
        question: 'Can I exchange multiple skills with one person?',
        answer: 'Yes! Once you match with someone, you can exchange multiple skills. Many users form ongoing learning partnerships where they teach and learn various skills over time.',
      },
      {
        question: 'What happens after I match with someone?',
        answer: 'After matching, you\'ll see a celebration animation and can immediately start a chat with your new match. From there, you can discuss how you\'d like to exchange skills and schedule learning sessions.',
      },
    ];

    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden hover:border-blue-300 transition-colors"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <span className="font-semibold text-slate-900 pr-4">{faq.question}</span>
              <motion.div
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {openIndex === index ? (
                  <FiChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                ) : (
                  <FiChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                )}
              </motion.div>
            </button>
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 text-slate-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    );
  };

  // Example profiles data - spread deck style (only 3 cards)
  const exampleProfiles = [
    {
      name: 'Alex Kim',
      title: 'Product Manager',
      location: 'Seattle, WA',
      age: 30,
      skillsOffered: ['Product Strategy', 'Agile'],
      skillsWanted: ['Data Science', 'Design'],
      bio: 'Product leader seeking to expand technical skills.',
      avatar: 'AK',
      color: 'from-orange-500 to-red-500',
      rotation: -12,
      zIndex: 2, // Above background (0) but below Sarah Chen (5)
    },
    {
      name: 'Sarah Chen',
      title: 'Full Stack Developer',
      location: 'San Francisco, CA',
      age: 28,
      skillsOffered: ['React', 'Node.js', 'TypeScript'],
      skillsWanted: ['UI/UX Design', 'Photography'],
      bio: 'Passionate developer looking to learn design and photography.',
      avatar: 'SC',
      color: 'from-blue-500 to-indigo-500',
      rotation: -2,
      zIndex: 5, // Center card - highest z-index
    },
    {
      name: 'Marcus Johnson',
      title: 'Graphic Designer',
      location: 'New York, NY',
      age: 32,
      skillsOffered: ['UI/UX Design', 'Illustration'],
      skillsWanted: ['Web Development', 'Data Science'],
      bio: 'Creative designer eager to expand into tech.',
      avatar: 'MJ',
      color: 'from-purple-500 to-indigo-500',
      rotation: 2,
      zIndex: 4,
    },
  ];

  return (
    <div className="overflow-x-hidden bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section - Side by Side Layout */}
      <section className="min-h-screen flex items-center py-4 md:py-6 px-4 sm:px-6 lg:px-8 xl:px-12 relative overflow-x-visible overflow-y-visible">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          ></motion.div>
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, -60, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            className="absolute top-40 right-10 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          ></motion.div>
          <motion.div
            animate={{
              x: [0, 60, 0],
              y: [0, 80, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute -bottom-8 left-1/2 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          ></motion.div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-12 items-start lg:items-center py-4 lg:py-6">
            {/* Left Side - Branding and Description */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left flex flex-col justify-center order-1 lg:order-1 z-0 relative w-full"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-4"
              >
                <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 leading-none">
                  Bartr
                </h1>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4"
                ></motion.div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 text-slate-800 leading-tight"
              >
                Find Your Perfect Skill Exchange Partner
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-lg md:text-xl text-slate-600 mb-4 leading-relaxed"
              >
                Connect with professionals who want to learn what you know, and teach what you need. 
                Start your journey today and grow together.
              </motion.p>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex flex-wrap gap-4 md:gap-6 mb-4 justify-center lg:justify-start"
              >
                {[
                  { 
                    number: stats.activeUsers > 0 
                      ? (stats.activeUsers >= 1000 ? `${(stats.activeUsers / 1000).toFixed(1)}K+` : `${stats.activeUsers}+`)
                      : '10K+', 
                    label: 'Active Users' 
                  },
                  { 
                    number: stats.matchesMade > 0
                      ? (stats.matchesMade >= 1000 ? `${(stats.matchesMade / 1000).toFixed(1)}K+` : `${stats.matchesMade}+`)
                      : '50K+', 
                    label: 'Matches Made' 
                  },
                  { number: '95%', label: 'Success Rate' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                    whileHover={{ scale: 1.1, y: -5 }}
                    className="text-center"
                  >
                    <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">{stat.number}</div>
                    <div className="text-xs md:text-sm text-slate-600">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-4"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/signup"
                    className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-base md:text-lg shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 inline-flex items-center justify-center overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center">
                      Get Started Free
                      <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    ></motion.div>
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/login"
                    className="px-6 py-3 bg-white text-blue-600 rounded-xl font-bold text-base md:text-lg border-2 border-blue-600 shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all duration-300 inline-flex items-center"
                  >
                    Sign In
                  </Link>
                </motion.div>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="mt-4 flex flex-wrap gap-3 md:gap-4 justify-center lg:justify-start items-center"
              >
                <div className="flex items-center gap-2 text-slate-600">
                  <FiShield className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">Secure Platform</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <FiAward className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium">Verified Users</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <FiCheck className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">Free to Start</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Side - Spread Deck Profile Cards */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative w-full order-2 lg:order-2 mb-12 lg:mb-0 flex items-center justify-center overflow-visible"
              style={{ zIndex: 10 }}
            >
              {/* Cards Container - Spread Deck Layout */}
              <div className="relative w-full flex items-center justify-center overflow-visible" style={{ 
                minHeight: `${cardDimensions.height + 40}px`,
                maxHeight: `${cardDimensions.height + 80}px`,
                padding: cardDimensions.width < 220 ? '0.5rem' : '1rem 0',
              }}>
                <div className="relative w-full max-w-full mx-auto overflow-visible">
                  <div className="relative w-full h-full flex items-center justify-center overflow-visible" style={{ 
                    height: `${cardDimensions.height + 40}px`,
                    maxWidth: '100%',
                  }}>
                    {exampleProfiles.map((profile, index) => {
                      // Spread deck layout: center card fully visible, others peek from sides
                      const centerIndex = 1; // Sarah Chen is the center card
                      const isCenter = index === centerIndex;
                      
                      // Card dimensions - responsive based on screen size
                      const cardWidth = cardDimensions.width;
                      const cardHeight = cardDimensions.height;
                      
                      // Calculate horizontal spread
                      let xOffset = 0;
                      let scale = 1;
                      let opacity = 1;
                      let rotation = profile.rotation;
                      
                      const screenWidth = window.innerWidth;
                      const isSmallScreen = screenWidth < 640;
                      const isMediumScreen = screenWidth >= 640 && screenWidth < 1024;
                      const isLargeScreen = screenWidth >= 1024;
                      
                      // Calculate right half width to constrain all cards
                      const gridGap = isSmallScreen ? 24 : isMediumScreen ? 32 : 48; // gap-6 lg:gap-8 xl:gap-12
                      const rightHalfWidth = (screenWidth - gridGap) / 2;
                      // On desktop, use stricter constraints to prevent spilling
                      const padding = isLargeScreen ? 40 : 30; // More padding on desktop
                      const maxAllowedOffset = rightHalfWidth - cardWidth / 2 - padding; // Padding from edge
                      const minAllowedOffset = -(rightHalfWidth - cardWidth / 2 - padding); // Symmetric constraint
                      
                      if (isCenter) {
                        // Center card - fully visible, primary focus
                        // On mobile, center the card properly
                        if (isSmallScreen) {
                          xOffset = 0; // Center on mobile
                        } else if (isMediumScreen) {
                          xOffset = 0; // Center on medium screens
                        } else {
                          xOffset = 0; // Center on desktop
                        }
                        scale = 1;
                        opacity = 1;
                        rotation = 0;
                      } else if (index < centerIndex) {
                        // Cards to the left - Alex Kim - deck spread style, spread apart a little
                        const distanceFromCenter = centerIndex - index;
                        // Moderate peek amount - like a deck of cards spread apart
                        const peekAmount = 20; // Increased to show more of the card - deck spread effect
                        // Calculate base offset: position card so peekAmount is visible
                        // Use mobile card width (200px) as reference to maintain consistent spacing
                        const referenceCardWidth = 200; // Mobile card width - use as reference
                        const baseOffset = -referenceCardWidth + peekAmount;
                        // Moderate spacing - cards spread apart like a deck
                        const spacing = 12; // Increased spacing to create spread effect
                        xOffset = baseOffset - (distanceFromCenter - 1) * spacing;
                        // Constrain to fit within right half
                        xOffset = Math.max(xOffset, minAllowedOffset);
                        scale = Math.max(0.75, 0.88 - (distanceFromCenter - 1) * 0.06);
                        opacity = 1; // No opacity reduction - cards are fully visible
                        rotation = -8 - (distanceFromCenter - 1) * 1.5; // Moderate tilt for deck spread effect: -8°
                      } else {
                        // Cards to the right - Marcus Johnson - deck spread style, spread apart a little
                        const distanceFromCenter = index - centerIndex;
                        // Moderate peek amount - like a deck of cards spread apart
                        const peekAmount = 20; // Increased to show more of the card - deck spread effect
                        // Use mobile card width (200px) as reference to maintain consistent spacing
                        const referenceCardWidth = 200; // Mobile card width - use as reference
                        const baseOffset = referenceCardWidth - peekAmount;
                        // Moderate spacing - cards spread apart like a deck
                        const spacing = 12; // Increased spacing to create spread effect
                        // Calculate offset symmetrically - mirror the left side calculation
                        xOffset = baseOffset + (distanceFromCenter - 1) * spacing;
                        // Constrain to fit within right half
                        xOffset = Math.min(xOffset, maxAllowedOffset);
                        scale = Math.max(0.75, 0.88 - (distanceFromCenter - 1) * 0.06);
                        opacity = 1; // No opacity reduction - cards are fully visible
                        rotation = 8 + (distanceFromCenter - 1) * 1.5; // Moderate tilt for deck spread effect: +8° (symmetric)
                      }
                      
                      // Vertical stacking - cards below peek less (reduced offset and distance)
                      const verticalOffset = index === centerIndex ? 0 : 
                                           index < centerIndex ? (centerIndex - index) * 2 : 
                                           (index - centerIndex) * 2;
                      
                      return (
                        <motion.div
                          key={profile.name}
                          initial={{ opacity: 0, y: 50, rotate: rotation, scale: 0.8 }}
                          animate={{ 
                            opacity: opacity,
                            y: isCenter ? [0, -8, 0] : verticalOffset,
                            x: xOffset,
                            rotate: rotation,
                            scale: scale,
                            transition: { duration: 0.5, ease: "easeOut" }
                          }}
                          transition={{ 
                            duration: 0.6,
                            delay: 0.5 + index * 0.15,
                            y: isCenter ? {
                              duration: 3,
                              repeat: Infinity,
                              repeatType: "reverse",
                              ease: "easeInOut"
                            } : {}
                          }}
                          whileHover={{ 
                            scale: isCenter ? 1.05 : Math.min(scale * 1.15, 1),
                            rotate: 0,
                            zIndex: 20,
                            y: isCenter ? -10 : verticalOffset - 5,
                            x: isCenter ? (isMobile ? -25 : -70) : (index < centerIndex ? xOffset + 20 : xOffset - 20),
                            opacity: 1,
                            transition: { duration: 0.15, type: "spring", stiffness: 500, damping: 30 }
                          }}
                          className="absolute bg-white rounded-3xl border-2 border-gray-200 overflow-hidden cursor-pointer group"
                          style={{
                            width: `${cardWidth}px`,
                            height: `${cardHeight}px`,
                            left: '50%',
                            zIndex: profile.zIndex,
                            top: '50%',
                            marginTop: `-${cardHeight / 2}px`,
                            marginLeft: `-${cardWidth / 2}px`, // Center the card properly
                            boxShadow: isCenter 
                              ? '0 20px 40px -10px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
                              : `0 ${10 + (Math.abs(index - centerIndex) * 3)}px ${20 + (Math.abs(index - centerIndex) * 3)}px -8px rgba(0, 0, 0, ${0.3 - (Math.abs(index - centerIndex) * 0.05)}), 0 0 0 1px rgba(0, 0, 0, 0.08)`,
                            transformOrigin: 'center center',
                          }}
                        >
                          <div className="overflow-hidden rounded-3xl h-full flex flex-col">
                  {/* Profile Image/Header with gradient overlay */}
                  <div className={`${cardDimensions.headerHeight} bg-gradient-to-br ${profile.color} relative overflow-hidden rounded-t-3xl`}>
                    {/* Animated gradient overlay */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-transparent"
                      animate={{
                        opacity: [0.15, 0.3, 0.15],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    ></motion.div>
                    
                    {/* Decorative pattern */}
                    <div className="absolute inset-0 opacity-8">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                        backgroundSize: '40px 40px'
                      }}></div>
                    </div>

                    <div className={`absolute bottom-0 left-0 right-0 ${cardDimensions.padding} text-white z-10 ${cardDimensions.width < 240 ? 'pb-3' : 'pb-4'}`}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.15 }}
                        className="flex items-center justify-between mb-1"
                      >
                        <h3 className={`${cardDimensions.fontSize === 'text-xs' ? 'text-base' : 'text-xl'} font-bold truncate pr-1`}>{profile.name}</h3>
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 15 }}
                          className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-1.5 py-0.5 rounded-lg flex-shrink-0"
                        >
                          <FiStar className={`${cardDimensions.fontSize === 'text-xs' ? 'w-3 h-3' : 'w-4 h-4'} fill-yellow-400 text-yellow-400`} />
                          <span className={`font-semibold ${cardDimensions.fontSize === 'text-xs' ? 'text-[10px]' : 'text-xs'}`}>4.9</span>
                        </motion.div>
                      </motion.div>
                      <p className={`text-white/90 ${cardDimensions.fontSize} truncate ${cardDimensions.width < 240 ? 'mb-2' : 'mb-3'}`}>{profile.title}</p>
                      <p className={`text-white/80 ${cardDimensions.fontSize === 'text-xs' ? 'text-[9px]' : 'text-[10px]'} mt-0.5 flex items-center gap-1 truncate`}>
                        <span>{profile.location}</span>
                        <span>•</span>
                        <span>{profile.age}</span>
                      </p>
                    </div>
                  </div>

                  {/* Profile Content */}
                  <div className={`${cardDimensions.width < 240 ? 'pt-10' : 'pt-12'} ${cardDimensions.padding} pb-3 flex-1 flex flex-col relative z-20 min-h-0`}>
                    {/* Avatar Circle with animation */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1 + index * 0.15, type: "spring", stiffness: 200 }}
                      whileHover={{ 
                        scale: 1.1, 
                        rotate: 360,
                        transition: { duration: 0.6 }
                      }}
                      className={`absolute -top-4 left-3 rounded-full bg-gradient-to-br ${profile.color} border-3 border-white shadow-xl flex items-center justify-center text-white font-bold z-30`}
                      style={{ 
                        width: cardDimensions.width < 240 ? '48px' : '64px', 
                        height: cardDimensions.width < 240 ? '48px' : '64px',
                        fontSize: cardDimensions.width < 240 ? '0.75rem' : '1rem'
                      }}
                    >
                      {profile.avatar}
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 + index * 0.15 }}
                      className={`text-slate-700 mb-2 leading-relaxed ${cardDimensions.fontSize} line-clamp-2 flex-1 min-h-0`}
                    >
                      {profile.bio}
                    </motion.p>
                    
                    <div className="space-y-1.5 mb-2 flex-shrink-0">
                      <div>
                        <div className={`${cardDimensions.fontSize === 'text-xs' ? 'text-[9px]' : 'text-[10px]'} font-bold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1`}>
                          <FiCode className={cardDimensions.fontSize === 'text-xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                          Skills I Offer
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {profile.skillsOffered.slice(0, 2).map((skill, skillIndex) => (
                            <motion.span
                              key={skill}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 1.4 + index * 0.15 + skillIndex * 0.1 }}
                              whileHover={{ scale: 1.1, y: -2 }}
                              className={`px-1.5 py-0.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-md ${cardDimensions.fontSize === 'text-xs' ? 'text-[9px]' : 'text-[10px]'} font-semibold border border-blue-200 cursor-default shadow-sm truncate max-w-full`}
                            >
                              {skill}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className={`${cardDimensions.fontSize === 'text-xs' ? 'text-[9px]' : 'text-[10px]'} font-bold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1`}>
                          <FiHeart className={`${cardDimensions.fontSize === 'text-xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-rose-500`} />
                          Skills I Want
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {profile.skillsWanted.slice(0, 2).map((skill, skillIndex) => (
                            <motion.span
                              key={skill}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 1.6 + index * 0.15 + skillIndex * 0.1 }}
                              whileHover={{ scale: 1.1, y: -2 }}
                              className={`px-1.5 py-0.5 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 rounded-md ${cardDimensions.fontSize === 'text-xs' ? 'text-[9px]' : 'text-[10px]'} font-semibold border border-purple-200 cursor-default shadow-sm truncate max-w-full`}
                            >
                              {skill}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1.5 flex-shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex-1 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-semibold ${cardDimensions.fontSize} hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-1`}
                      >
                        <FiHeart className={cardDimensions.fontSize === 'text-xs' ? 'w-3 h-3' : 'w-4 h-4'} />
                        Match
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex-1 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-semibold ${cardDimensions.fontSize} hover:bg-slate-200 transition-all duration-200 flex items-center justify-center gap-1`}
                      >
                        <svg className={cardDimensions.fontSize === 'text-xs' ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>

                          {/* Shine effect on hover */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"
                            style={{ pointerEvents: 'none' }}
                          ></motion.div>
                          </div>
                        </motion.div>
                      );
                    })}
                    
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="min-h-screen flex items-center bg-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Video/Image placeholder background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-slate-900">
              How <span className="text-blue-600">Bartr</span> Works
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Three simple steps to find your perfect skill exchange partner
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                icon: FiSearch,
                title: 'Create Your Profile',
                description: 'Tell us about your skills and what you want to learn. The more details, the better matches you\'ll get.',
                color: 'from-blue-500 to-indigo-500',
                image: '👤',
              },
              {
                step: '02',
                icon: FiUsers,
                title: 'Browse & Match',
                description: 'Discover professionals who complement your skills. Our AI finds the perfect matches for you.',
                color: 'from-indigo-500 to-purple-500',
                image: '💫',
              },
              {
                step: '03',
                icon: FiMessageCircle,
                title: 'Start Learning',
                description: 'Connect and start exchanging skills. Build meaningful relationships while growing professionally.',
                color: 'from-purple-500 to-pink-500',
                image: '🚀',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ scale: 1.05, y: -15, rotateY: 5 }}
                className="group relative"
              >
                <div className="bg-white rounded-3xl p-8 border-2 border-slate-200 hover:border-blue-300 transition-all duration-300 h-full shadow-lg hover:shadow-2xl relative overflow-hidden">
                  {/* Decorative background */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-5 rounded-bl-full`}></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}
                      >
                        <item.icon className="w-8 h-8 text-white" />
                      </motion.div>
                      <motion.span
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-6xl font-bold text-slate-100"
                      >
                        {item.step}
                      </motion.span>
                    </div>
                    <div className="text-6xl mb-4">{item.image}</div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with Video Placeholder */}
      <section className="min-h-screen flex items-center bg-gradient-to-b from-slate-50 to-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-slate-900">
              Why Choose <span className="text-blue-600">Bartr</span>?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Everything you need for successful skill exchange
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: FiZap, title: 'Lightning Fast Matching', description: 'Get matched in seconds with our AI-powered algorithm', emoji: '⚡' },
              { icon: FiShield, title: 'Secure & Private', description: 'Your data is encrypted and your privacy is protected', emoji: '🔒' },
              { icon: FiCode, title: 'Tech Skills Exchange', description: 'Programming, design, development, and more', emoji: '💻' },
              { icon: FiMusic, title: 'Creative Arts', description: 'Music, photography, writing, and creative skills', emoji: '🎨' },
              { icon: FiBook, title: 'Language Learning', description: 'Learn languages with native speakers worldwide', emoji: '🌍' },
              { icon: FiTrendingUp, title: 'Career Growth', description: 'Advance your career through skill development', emoji: '📈' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.9, rotateX: -15 }}
                whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.08, y: -10, rotateY: 5, z: 50 }}
                className="bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 cursor-pointer relative overflow-hidden group"
              >
                {/* Animated background gradient */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                ></motion.div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <feature.icon className="w-10 h-10 text-blue-600" />
                    </motion.div>
                    <span className="text-3xl">{feature.emoji}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900 group-hover:text-blue-600 transition-colors">{feature.title}</h3>
                  <p className="text-slate-600 text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center text-slate-900">
              Frequently Asked Questions
            </h2>
            <FAQAccordion />
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Animated particles */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {[...Array(20)].map((_, i) => {
            const randomX = Math.random() * 100;
            const randomY = Math.random() * 100;
            return (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/30 rounded-full"
                initial={{
                  x: `${randomX}%`,
                  y: `${randomY}%`,
                }}
                animate={{
                  y: [`${randomY}%`, `${(randomY + 30) % 100}%`],
                  x: [`${randomX}%`, `${(randomX + 20) % 100}%`],
                }}
                transition={{
                  duration: Math.random() * 10 + 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-20 max-w-4xl mx-auto text-center"
        >
          <motion.h2
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 relative z-20"
          >
            Ready to Start Your <span className="text-yellow-300">Bartr</span> Journey?
          </motion.h2>
          <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed max-w-2xl mx-auto relative z-20">
            Join thousands of professionals already using Bartr to exchange skills and accelerate their growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/signup"
                className="inline-flex items-center px-12 py-6 bg-white text-blue-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-white/50 transition-all duration-300"
              >
                Create Free Account
                <FiArrowRight className="ml-2" />
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/login"
                className="inline-flex items-center px-12 py-6 bg-white/10 backdrop-blur-lg border-2 border-white/30 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-all duration-300"
              >
                Sign In
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
