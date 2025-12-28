import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Calendar, UtensilsCrossed, ShoppingCart } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout({ children, currentPageName }) {
    const navItems = [
        { name: 'MealPlanner', label: 'Planner', icon: Calendar },
        { name: 'Meals', label: 'Meals', icon: UtensilsCrossed },
        { name: 'Shopping', label: 'Shopping', icon: ShoppingCart }
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-100 flex-col z-50">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                            <UtensilsCrossed className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-800">MealPlan</h1>
                            <p className="text-xs text-slate-400">Eat well, live well</p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={createPageUrl(item.name)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                                currentPageName === item.name
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5",
                                currentPageName === item.name ? "text-emerald-600" : "text-slate-400"
                            )} />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50 px-4 py-2">
                <div className="flex justify-around">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={createPageUrl(item.name)}
                            className={cn(
                                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                                currentPageName === item.name
                                    ? "text-emerald-600"
                                    : "text-slate-400"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    ))}
                </div>
            </nav>

            {/* Main Content */}
            <main className="md:ml-64 pb-20 md:pb-0">
                {children}
            </main>
        </div>
    );
}