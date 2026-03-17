import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Heart, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const { isAuthenticated, user, logout } = useAuthStore();
    const navigate = useNavigate();

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Search', path: '/search' },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center">
                                <Heart className="text-white w-6 h-6 fill-current" />
                            </div>
                            <span className="text-2xl font-extrabold font-display bg-gradient-to-r from-brand-600 to-primary-600 bg-clip-text text-transparent">
                                Shubh Vivah
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className="text-gray-600 hover:text-brand-600 font-medium transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}

                        {isAuthenticated ? (
                            <div className="flex items-center space-x-4">
                                <Link to={user?.isAdmin ? "/admin" : "/dashboard"} className="flex items-center space-x-2 text-gray-600 hover:text-brand-600">
                                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden">
                                        {user?.photos?.[0] ? (
                                            <img src={user.photos[0]} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-4 h-4 text-brand-600" />
                                        )}
                                    </div>
                                    <span className="font-medium">{user?.fullName.split(' ')[0]}</span>
                                </Link>
                                <button
                                    onClick={() => {
                                        logout();
                                        navigate('/');
                                    }}
                                    className="text-gray-600 hover:text-red-600 p-2"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link to="/login" className="text-gray-600 hover:text-brand-600 font-medium font-display">
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn-primary"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center space-x-4">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 text-gray-600 hover:text-brand-600"
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
                    >
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className="block px-3 py-4 text-base font-medium text-gray-600 hover:bg-brand-50 hover:text-brand-600 rounded-lg"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            {!isAuthenticated ? (
                                <div className="grid grid-cols-2 gap-4 pt-4 px-3">
                                    <Link
                                        to="/login"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-700"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setIsOpen(false)}
                                        className="btn-primary flex items-center justify-center rounded-xl"
                                    >
                                        Register
                                    </Link>
                                </div>
                            ) : (
                                <div className="pt-4 px-3 border-t border-gray-100 mt-4">
                                    <Link
                                        to={user?.isAdmin ? "/admin" : "/dashboard"}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl mb-4"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden">
                                            {user?.photos?.[0] ? (
                                                <img src={user.photos[0]} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-5 h-5 text-brand-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{user?.fullName}</p>
                                            <p className="text-sm text-gray-500">View {user?.isAdmin ? 'Admin' : ''} Dashboard</p>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsOpen(false);
                                            navigate('/');
                                        }}
                                        className="w-full flex items-center justify-center space-x-2 p-3 text-red-600 font-medium"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};
