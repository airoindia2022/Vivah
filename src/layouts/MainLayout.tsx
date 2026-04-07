import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Heart } from 'lucide-react';
import { ChatbotWidget } from '../components/ChatbotWidget';

const Footer = () => (
    <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-1">
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                            <Heart className="text-white w-5 h-5 fill-current" />
                        </div>
                        <span className="text-xl font-extrabold font-display text-white">
                            Shubh Vivah
                        </span>
                    </div>
                    <p className="text-sm">
                        Helping millions find their perfect partner. Trusted by families across India.
                    </p>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-4">Quick Links</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#" className="hover:text-brand-500 transition-colors">About Us</a></li>
                        <li><a href="#" className="hover:text-brand-500 transition-colors">Stories</a></li>
                        <li><a href="#" className="hover:text-brand-500 transition-colors">Tips</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-4">Services</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#" className="hover:text-brand-500 transition-colors">Home</a></li>
                        <li><a href="#" className="hover:text-brand-500 transition-colors">Search</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-4">Contact</h4>
                    <ul className="space-y-2 text-sm">
                        <li>Email: info@shubhvivah.org.in</li>
                        <li>Phone: +91 7668392730</li>
                        <li>Noida, Delhi, India</li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
                <p>&copy; {new Date().getFullYear()} HS Online. All rights reserved.</p>
            </div>
        </div>
    </footer>
);

export const MainLayout = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow pt-16">
                <Outlet />
            </main>
            <Footer />
            <ChatbotWidget />
        </div>
    );
};
