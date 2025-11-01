import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Mic, Zap, Brain, Link2, BookOpen, ChevronRight, Play, Check, Star, ArrowRight } from 'lucide-react';

// Headline variations for A/B testing
const HEADLINES = {
  A: "Think → Tap → Done",
  B: "Capture thoughts instantly",
  C: "Your ideas, never lost"
};

export default function Landing() {
  const [activeHeadline] = useState<keyof typeof HEADLINES>('A');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  // Simulated user count (would be real API call in production)
  const [userCount] = useState(1247);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                Snap Note
              </span>
            </motion.div>

            {/* Nav Links */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden md:flex items-center gap-8"
            >
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Demo
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                Get Started
              </Link>
            </motion.div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div
              style={{ opacity, scale }}
              className="space-y-8"
            >
              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
                >
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Lightning-fast note capture</span>
                </motion.div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text text-transparent bg-300% animate-gradient">
                    {HEADLINES[activeHeadline]}
                  </span>
                </h1>

                <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                  Brilliant ideas strike suddenly. Snap Note captures them instantly with one tap.
                  <br />
                  <span className="text-foreground font-medium">AI organizes everything for you.</span>
                </p>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                {/* Primary CTA */}
                <Link
                  to="/login"
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-blue-500 text-white font-semibold text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
                >
                  <Mic className="w-5 h-5" />
                  <span>Start Recording Now</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* Secondary CTA */}
                <button
                  onClick={() => setIsVideoPlaying(true)}
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-border hover:border-primary bg-background hover:bg-muted transition-all duration-300"
                >
                  <Play className="w-5 h-5" />
                  <span className="font-semibold">Watch Demo</span>
                </button>
              </motion.div>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-8 pt-4"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-xs text-white font-semibold"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold">{userCount.toLocaleString()}+ users</div>
                    <div className="text-muted-foreground">Already capturing ideas</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-2 text-sm font-semibold">4.9/5</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column - Interactive Demo */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <PhoneMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold">Why Snap Note?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for speed, powered by AI, designed for your workflow
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-bold">See It In Action</h2>
            <p className="text-xl text-muted-foreground">
              Watch how Snap Note transforms voice to organized notes in seconds
            </p>
          </motion.div>

          <InteractiveDemoSection />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-500 to-primary p-12 text-center text-white shadow-2xl">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_70%)]" />

            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl sm:text-5xl font-bold">
                Ready to capture your best ideas?
              </h2>
              <p className="text-xl opacity-90 max-w-2xl mx-auto">
                Join {userCount.toLocaleString()}+ users who never lose a thought
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-semibold text-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-xl"
                >
                  <Mic className="w-5 h-5" />
                  <span>Start Free</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <p className="text-sm opacity-75">
                No credit card required • Free forever plan available
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Snap Note</span>
            </div>

            <p className="text-sm text-muted-foreground">
              © 2025 Snap Note. Built with Claude Code.
            </p>

            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {isVideoPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsVideoPlaying(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="relative max-w-4xl w-full aspect-video bg-muted rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">Demo video would play here</p>
            </div>
            <button
              onClick={() => setIsVideoPlaying(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

// Phone Mockup Component
function PhoneMockup() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative mx-auto w-[300px] h-[600px]">
      {/* Phone Frame */}
      <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-b from-gray-800 to-gray-900 shadow-2xl p-3">
        <div className="w-full h-full rounded-[2.5rem] bg-background overflow-hidden">
          {/* Status Bar */}
          <div className="h-8 bg-muted flex items-center justify-between px-6 text-xs">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 border border-current rounded-sm" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {step === 0 && (
                <>
                  <div className="flex items-center justify-center h-32">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center"
                    >
                      <Mic className="w-8 h-8 text-primary" />
                    </motion.div>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Tap to record your idea...
                  </p>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-primary/20 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 2 }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </div>
                    <div className="flex justify-center gap-1">
                      {[...Array(12)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [4, 24, 4] }}
                          transition={{
                            repeat: Infinity,
                            duration: 1,
                            delay: i * 0.1,
                          }}
                          className="w-1 bg-primary rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-center text-sm">
                    Recording: "Build a mobile app that helps users track daily habits..."
                  </p>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Brain className="w-4 h-4 text-primary" />
                      <span>AI Organized</span>
                    </div>
                    <div className="p-4 rounded-lg bg-muted space-y-2">
                      <h4 className="font-semibold text-sm">Mobile Habit Tracker App</h4>
                      <p className="text-xs text-muted-foreground">
                        App concept for tracking daily habits with gamification
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                          #app-idea
                        </span>
                        <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs">
                          #mobile
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-green-500 text-sm">
                    <Check className="w-4 h-4" />
                    <span>Saved to Notion</span>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Feature Card Component
interface Feature {
  icon: typeof Zap;
  title: string;
  description: string;
  color: string;
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.05 }}
      className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-lg"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
      <p className="text-muted-foreground">{feature.description}</p>
    </motion.div>
  );
}

// Interactive Demo Section
function InteractiveDemoSection() {
  const [demoStep, setDemoStep] = useState(0);

  const demoSteps = [
    { icon: Mic, title: 'Record', description: 'Speak your idea naturally' },
    { icon: Brain, title: 'AI Process', description: 'AI organizes and tags' },
    { icon: Link2, title: 'Sync', description: 'Saved to your workspace' },
  ];

  return (
    <div className="relative">
      <div className="grid md:grid-cols-3 gap-6">
        {demoSteps.map((step, index) => {
          const Icon = step.icon;
          const isActive = demoStep === index;

          return (
            <motion.button
              key={step.title}
              onClick={() => setDemoStep(index)}
              animate={{
                scale: isActive ? 1.05 : 1,
                borderColor: isActive ? 'rgb(var(--primary))' : 'rgb(var(--border))',
              }}
              className="p-8 rounded-2xl border-2 bg-card text-left transition-all relative overflow-hidden group"
            >
              {isActive && (
                <motion.div
                  layoutId="activeDemo"
                  className="absolute inset-0 bg-primary/5"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <div className="relative z-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                  isActive ? 'bg-primary text-white' : 'bg-muted group-hover:bg-primary/10'
                }`}>
                  <Icon className="w-8 h-8" />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold">{index + 1}</span>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                </div>

                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Demo Visualization */}
      <motion.div
        key={demoStep}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12 p-8 rounded-2xl bg-muted/50 border border-border"
      >
        <div className="flex items-center justify-center h-64">
          {demoStep === 0 && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-center space-y-4"
            >
              <Mic className="w-24 h-24 mx-auto text-primary" />
              <p className="text-lg">Tap the microphone and speak naturally</p>
            </motion.div>
          )}

          {demoStep === 1 && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="text-center space-y-4"
            >
              <Brain className="w-24 h-24 mx-auto text-primary" />
              <p className="text-lg">AI is processing and organizing...</p>
            </motion.div>
          )}

          {demoStep === 2 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center space-y-4"
            >
              <Check className="w-24 h-24 mx-auto text-green-500" />
              <p className="text-lg">Synced to Notion & your workspace!</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Features Data
const FEATURES: Feature[] = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'One tap to record. No app switching, no delays. Just instant capture.',
    color: 'from-yellow-400 to-orange-500',
  },
  {
    icon: Brain,
    title: 'AI Powered',
    description: 'Automatically organizes, tags, and summarizes your notes with advanced AI.',
    color: 'from-purple-400 to-pink-500',
  },
  {
    icon: Link2,
    title: 'Seamless Integration',
    description: 'Syncs with Notion, Evernote, Obsidian - your notes, your way.',
    color: 'from-blue-400 to-cyan-500',
  },
  {
    icon: BookOpen,
    title: 'Knowledge Growth',
    description: 'Transform daily notes into articles, books, and structured knowledge.',
    color: 'from-green-400 to-emerald-500',
  },
];
