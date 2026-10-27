export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 relative overflow-hidden">
      {/* Background Image with reduced opacity */}
      <div className="absolute inset-0">
        <img 
          src="/hero.jpg" 
          alt="Background"
          className="w-full h-full object-cover opacity-90"
        />
        {/* Gradient overlay - more subtle */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-black/50 to-gray-900/60" />
      </div>

      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/3 left-1/2 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl animate-pulse delay-500" />

      {/* Navigation */}
      <nav className="relative px-6 sm:px-8 lg:px-12 py-6 z-20">  
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo with glow */}
            <div className="w-48 h-auto relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg opacity-0 group-hover:opacity-30 blur transition-opacity duration-300" />
              <img 
                src="/logo4.png" 
                alt="BizNova Logo" 
                className="w-full h-auto object-contain relative z-10 transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            
            {/* Navigation links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#" className="text-gray-300 hover:text-white transition-colors hover:scale-105">Features</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors hover:scale-105">Pricing</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors hover:scale-105">About</a>
              <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all hover:shadow-lg hover:-translate-y-0.5">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 sm:px-8 lg:px-12 py-20 md:py-32 z-20">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl">
            {/* Main heading with animated gradient */}
            <div className="relative mb-8">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold mb-6 relative tracking-tight">
                <span className="bg-gradient-to-r from-purple-500 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                  BizNova AI
                </span>
              </h1>
            </div>
            
            {/* Animated tagline */}
            <div className="inline-flex items-center gap-3 mb-10 px-4 py-2 bg-gray-900/50 rounded-full border border-gray-700/50 backdrop-blur-sm hover:bg-gray-900/70 transition-all duration-300">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-300">✨ Intelligent AI Assistant • Always Online</span>
            </div>
            
            {/* Enhanced subtitle */}
            <p className="text-2xl md:text-3xl text-gray-200 mb-12 max-w-3xl leading-relaxed tracking-wide">
              Transform your customer support with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 font-semibold animate-gradient">
                AI-powered intelligence
              </span>{" "}
              that delivers instant responses, 24/7 availability, and exceptional experiences.
            </p>
            
            {/* CTA Buttons - Add if needed later */}
            {/* <div className="flex gap-4 mb-12">
              <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-xl transition-all">
                Get Started
              </button>
            </div> */}

            {/* Trusted by section */}
            <div className="mt-24">
              <p className="text-gray-500 text-sm mb-6 text-center tracking-wider uppercase">Trusted by forward-thinking companies</p>
              <div className="flex flex-wrap justify-center gap-8 opacity-70">
                {["TechCorp", "StartupX", "InnovateCo", "GlobalSoft", "NextGen"].map((company, index) => (
                  <div 
                    key={index} 
                    className="text-gray-400 font-medium hover:text-gray-300 transition-colors hover:scale-110 cursor-pointer"
                  >
                    {company}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-6 sm:px-8 lg:px-12 py-8 border-t border-gray-800/50 z-20 backdrop-blur-sm bg-gray-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center hover:scale-110 transition-transform">
                <span className="text-white font-bold text-sm">BN</span>
              </div>
              <span className="text-xl font-bold text-white hover:text-gray-300 transition-colors">BizNova AI</span>
            </div>
            
            <div className="text-gray-500 text-sm hover:text-gray-400 transition-colors">
              © 2024 BizNova AI. All rights reserved.
            </div>
            
            <div className="flex gap-6">
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors hover:underline">Terms</a>
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors hover:underline">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors hover:underline">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom animation styles */}
      <style>{`
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}