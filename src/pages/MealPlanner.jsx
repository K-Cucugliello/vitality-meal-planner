import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Plus, X, Trash2, ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { Button } from "../components/ui/button";
import MealForm from '../components/meal/MealForm';

export default function MealPlanner() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showMealForm, setShowMealForm] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewingMeal, setViewingMeal] = useState(null);
    const [showLibrary, setShowLibrary] = useState(false); 
    const [showShoppingList, setShowShoppingList] = useState(false);
    const [adjustServings, setAdjustServings] = useState(1); 
    
    const [plannedMeals, setPlannedMeals] = useState(() => {
        const saved = localStorage.getItem('vitality_meals');
        return saved ? JSON.parse(saved) : [];
    });

    const [recipeLibrary, setRecipeLibrary] = useState(() => {
        const saved = localStorage.getItem('vitality_library');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('vitality_meals', JSON.stringify(plannedMeals));
        localStorage.setItem('vitality_library', JSON.stringify(recipeLibrary));
    }, [plannedMeals, recipeLibrary]);

    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = [...Array(7)].map((_, i) => addDays(startDate, i));
    
    const deleteMeal = (mealId) => {
        setPlannedMeals(prev => prev.filter(meal => meal.id !== mealId));
        setViewingMeal(null);
    };

    const toFraction = (dec) => {
        if (dec % 1 === 0) return dec.toString();
        const whole = Math.floor(dec);
        const rem = dec - whole;
        let f = "";
        if (Math.abs(rem - 0.25) < 0.05) f = "1/4";
        else if (Math.abs(rem - 0.33) < 0.05) f = "1/3";
        else if (Math.abs(rem - 0.5) < 0.05) f = "1/2";
        else if (Math.abs(rem - 0.75) < 0.05) f = "3/4";
        else return dec.toFixed(1);
        return whole > 0 ? `${whole} ${f}` : f;
    };

    const generateShoppingList = () => {
        const list = {};
        plannedMeals.forEach(meal => {
            meal.ingredients?.forEach(ing => {
                const name = ing.name.toLowerCase().trim();
                if (list[name]) {
                    list[name].amount += `, ${ing.amount}`;
                } else {
                    list[name] = { name: ing.name, amount: ing.amount };
                }
            });
        });
        return Object.values(list);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
            {/* Header Area */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Meal Planner</h1>
                    <p className="text-slate-500">Plan your weekly nutrition</p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        variant="outline"
                        onClick={() => setShowShoppingList(true)}
                        className="border-slate-200 text-slate-600"
                    >
                        <Sparkles className="w-4 h-4 mr-2 text-emerald-500" /> Shopping List
                    </Button>
                    <Button 
                        onClick={() => { setSelectedDate(new Date()); setShowMealForm(true); }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Create New Meal
                    </Button>
                </div>
            </div>

            {/* Weekly Calendar View */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {weekDays.map((day) => {
                    const dayMeals = plannedMeals.filter(meal => isSameDay(new Date(meal.planned_date), day));
                    const dailyTotals = dayMeals.reduce((acc, meal) => ({
                        calories: acc.calories + (Number(meal.calories) || 0),
                        protein: acc.protein + (Number(meal.protein) || 0),
                        carbs: acc.carbs + (Number(meal.carbs) || 0),
                        fat: acc.fat + (Number(meal.fat) || 0)
                    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

                    return (
                        <div key={day.toString()} className="bg-white p-4 rounded-xl border border-slate-100 min-h-[150px] flex flex-col shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-sm font-semibold text-slate-400 uppercase">{format(day, 'EEE')}</span>
                                    <p className="text-lg font-bold">{format(day, 'd')}</p>
                                </div>
                                {dayMeals.length > 0 && (
                                    <div className="text-right bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                        <p className="text-[10px] font-bold text-emerald-700">{dailyTotals.calories} kcal</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                {dayMeals.map((meal, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => { setViewingMeal(meal); setAdjustServings(meal.servings || 1); }}
                                        className="relative group cursor-pointer p-2 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 font-medium"
                                    >
                                        <div className="flex items-center gap-1 mb-1">
                                            <span>
                                                {meal.category === 'breakfast' && '🌅 '}
                                                {meal.category === 'lunch' && '☀️ '}
                                                {meal.category === 'dinner' && '🌙 '}
                                            </span>
                                            <span className="truncate text-xs">{meal.name}</span>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); deleteMeal(meal.id); }} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-600 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                ))}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedDate(day); setShowLibrary(true); }} className="w-full mt-2 border-dashed border-2 text-slate-400 hover:border-emerald-600 hover:text-emerald-600 transition-all"><Plus className="w-4 h-4" /></Button>
                        </div>
                    );
                })}
            </div>

            {/* Shopping List Modal */}
            {showShoppingList && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden shadow-2xl">
                        <div className="p-6 border-b flex justify-between items-center bg-emerald-600 text-white">
                            <h2 className="text-xl font-bold text-white">Shopping List</h2>
                            <button onClick={() => setShowShoppingList(false)} className="hover:rotate-90 transition-transform"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {generateShoppingList().length === 0 ? (
                                <p className="text-center text-slate-400">Your shopping list is empty.</p>
                            ) : (
                                <ul className="space-y-4">
                                    {generateShoppingList().map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <input type="checkbox" className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600" />
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-800 capitalize">{item.name}</span>
                                                <span className="text-xs text-slate-500">{item.amount}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Detail View Modal */}
            {viewingMeal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="overflow-y-auto">
                {/* Header Image with Upload Option */}
                <div className="relative group h-64 bg-slate-200">
                    {viewingMeal.image_url ? (
                        <img src={viewingMeal.image_url} alt={viewingMeal.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                            <Sparkles className="w-8 h-8 mb-2" />
                            <p>No image added</p>
                        </div>
                    )}
                    <label className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg cursor-pointer shadow-lg hover:bg-white transition-all">
                        <span className="text-xs font-bold text-slate-700">Change Photo</span>
                        <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        const updatedMeal = { ...viewingMeal, image_url: reader.result };
                                        setPlannedMeals(prev => prev.map(m => m.id === viewingMeal.id ? updatedMeal : m));
                                        setViewingMeal(updatedMeal);
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                    </label>
                </div>

                <div className="p-8 space-y-6">

                    {/* Title and Close */}
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold text-slate-900">{viewingMeal.name}</h2>
                        <button onClick={() => setViewingMeal(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X className="w-5 h-5"/></button>
                    </div>
                    {/* Macros & Servings Inline */}
<div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
    <div className="flex flex-wrap gap-2">
        {/* All Macros Restored */}
        <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold shadow-sm">🔥 {Math.round(((viewingMeal.calories || 0) / (viewingMeal.servings || 1)) * adjustServings)} kcal</span>
        <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold shadow-sm text-emerald-600">💪 {Math.round(((viewingMeal.protein || 0) / (viewingMeal.servings || 1)) * adjustServings)}g P</span>
        <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold shadow-sm text-amber-600">🍞 {Math.round(((viewingMeal.carbs || 0) / (viewingMeal.servings || 1)) * adjustServings)}g C</span>
        <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold shadow-sm text-indigo-600">🥑 {Math.round(((viewingMeal.fat || 0) / (viewingMeal.servings || 1)) * adjustServings)}g F</span>
    </div>

    {/* Small, Inline Serving Adjuster on the Right */}
    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border shadow-sm ml-auto">
        <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Servings</span>
        <button onClick={() => setAdjustServings(Math.max(1, adjustServings - 1))} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 font-extrabold text-slate-600">—</button>
        <span className="font-bold text-sm text-emerald-600 w-4 text-center">{adjustServings}</span>
        <button onClick={() => setAdjustServings(adjustServings + 1)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 font-extrabold text-slate-600">+</button>
    </div>
</div>

                    {/* Ingredients */}
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-slate-800 mb-3">Ingredients</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {viewingMeal.ingredients?.map((ing, i) => {
                                const match = (ing.amount || "").match(/^(\d+\/\d+|\d+\.\d+|\d+)?\s*(.*)$/);
                                const rawNumStr = match ? match[1] : null;
                                const unitText = match ? match[2] : (ing.amount || "");
                                let finalAmt = ing.amount;
                                if (rawNumStr) {
                                    const val = rawNumStr.includes('/') ? (rawNumStr.split('/').map(Number)[0] / rawNumStr.split('/').map(Number)[1]) : parseFloat(rawNumStr);
                                    const scaled = (val / Math.max(1, viewingMeal.servings || 1)) * adjustServings;
                                    finalAmt = `${toFraction(scaled)} ${unitText}`;
                                }
                                return (
                                    <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        <span className="text-slate-700 font-medium">{ing.name}</span>
                                        <span className="ml-auto text-slate-400 text-sm">{finalAmt}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Method */}
                    <div className="text-left pb-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Instructions</h3>
                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                            {viewingMeal.instructions || "Follow your intuition for this one!"}
                        </p>
                    </div>

                    <button onClick={() => deleteMeal(viewingMeal.id)} className="w-full py-3 rounded-xl text-red-500 text-xs font-bold hover:bg-red-50 transition-colors border border-transparent hover:border-red-100">
                        Remove from schedule
                    </button>
                </div>
            </div>
        </div>
    </div>
)}

            {showMealForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <MealForm 
                            onSubmit={(data) => {
                                setPlannedMeals(prev => [...prev, { ...data, id: Date.now(), planned_date: selectedDate }]);
                                setShowMealForm(false);
                            }} 
                            onCancel={() => setShowMealForm(false)} 
                        />
                    </div>
                </div>
            )}

            {showLibrary && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70]">
                    <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Recipe Library</h2>
                            <Button variant="ghost" size="icon" onClick={() => setShowLibrary(false)}><X className="w-5 h-5" /></Button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3">
                            {recipeLibrary.map((recipe) => (
                                <div key={recipe.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-emerald-50 cursor-pointer transition-colors" onClick={() => { setPlannedMeals(prev => [...prev, { ...recipe, id: Date.now(), planned_date: selectedDate }]); setShowLibrary(false); }}>
                                    <span className="font-semibold">{recipe.name}</span>
                                    <Plus className="w-5 h-5 text-emerald-600" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}