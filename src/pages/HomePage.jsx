/**
 * Home page component
 * Landing page with hero section and features
 */

import { Link } from 'react-router-dom';
import { Brain, Shield, Zap, Users } from 'lucide-react';

function HomePage() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Summarization',
      description: 'Automatically generate concise summaries of your notes using advanced AI technology.',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your notes are encrypted and stored securely with enterprise-grade security.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized performance with instant search and real-time synchronization.',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Share and collaborate on notes with your team members seamlessly.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Smart Notes with
              <span className="text-primary-600 dark:text-primary-400"> AI Power</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Transform your note-taking experience with intelligent AI summarization, 
              advanced search, and seamless organization. Never lose track of important information again.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary px-8 py-3 text-lg">
                Get Started Free
              </Link>
              <Link to="/login" className="btn-secondary px-8 py-3 text-lg">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose AI Notes?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover the features that make our note-taking app the perfect choice for 
              professionals, students, and teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card p-6 text-center hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 dark:bg-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Note-Taking?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have already revolutionized their productivity 
            with AI-powered notes.
          </p>
          <Link to="/register" className="inline-flex items-center px-8 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
            Start Your Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
