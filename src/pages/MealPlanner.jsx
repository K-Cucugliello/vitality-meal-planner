import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Plus, X, Trash2, ChevronLeft, ChevronRight, Sparkles, Loader2, Refrigerator, Search, Printer, ListPlus } from 'lucide-react';
import { Button } from "../components/ui/button";
import MealForm from '../components/meal/MealForm';
import { supabase } from '../supabaseclient';

export default function MealPlanner() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showMealForm, setShowMealForm] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewingMeal, setViewingMeal] = useState(null);
    const [showLibrary, setShowLibrary] = useState(false); 
    const [showShoppingList, setShowShoppingList] = useState(false);
    const [shoppingListItems, setShoppingListItems] = useState([]);
    const [adjustServings, setAdjustServings] = useState(1);
    const [showFridgeSearch, setShowFridgeSearch] = useState(false);
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [fridgeResults, setFridgeResults] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [plannedMeals, setPlannedMeals] = useState([]);
    const [recipeLibrary, setRecipeLibrary] = useState([]);
    const [loading, setLoading] = useState(true);

    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = [...Array(7)].map((_, i) => addDays(startDate, i));
    
    function handlePrint() {window.print(); }

    useEffect(() => {
    fetchData();
    }, []);

    const saveRecipeToLibraryIfNew = async (mealData) => {
        const isDuplicate = recipeLibrary.some(
            recipe => recipe.name.toLowerCase().trim() === mealData.name.toLowerCase().trim()
        );

        if (!isDuplicate) {
            const { data, error } = await supabase
                .from('recipes')
                .insert([mealData])
                .select();
            
            if (data) {
                setRecipeLibrary(prev => [...prev, data[0]]);
                return data[0];
            }
        }
        return null;
    };

    const fetchData = async () => { 
        setLoading(true); 
        try {
            const { data: meals, error: mealsError } = await supabase
                .from('meals')
                .select('*');
                    
            const { data: library, error: libError } = await supabase
                .from('recipes')
                .select('*');

            if (meals) setPlannedMeals(meals);
            if (library) setRecipeLibrary(library);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const clearWeek = async () => {
        if (!window.confirm("Are you sure you want to clear all meals for this week?")) 
    return;
        try {
            const mealIds = plannedMeals.map(meal => meal.id);
            if (mealIds.length === 0) {
                alert("No meals to clear!");
                return;
            }
            const { error } = await supabase
                .from('meals')
                .delete()
                .in('id', mealIds);
            if (error) throw error;
            setPlannedMeals([]);
            alert("Week cleared successfully!");
        } catch (err) {
            console.error("Error clearing week:", err);
            alert("Failed to clear week.");
        }
    };

    const handleAddFromLibrary = async (recipe, activeDate) => {
        const dateStr = format(activeDate, 'yyyy-MM-dd');
        const isDuplicate = plannedMeals.some(meal => 
            meal.name.toLowerCase() === recipe.name.toLowerCase() && 
            meal.planned_date === dateStr
        );
        if (isDuplicate) {
            alert(`${recipe.name} is already on your schedule for this day!`);
            return;
        }
        try {
            const { id, created_at, ...cleanRecipeData } = recipe;
            const newMealEntry = {
                ...cleanRecipeData,
                ingredients: Array.isArray(cleanRecipeData.ingredients) ? cleanRecipeData.ingredients.flat() : [],
                planned_date: dateStr 
            };
            const { data, error } = await supabase
                .from('meals')
                .insert([newMealEntry])
                .select();
            if (error) throw error;
            if (data) {
                setPlannedMeals(prev => [...prev, data[0]]);
                setShowLibrary(false);
            }
        } catch (err) {
            console.error("Save Error:", err.message);
            alert("Failed to save meal to schedule.");
        }
    }
    
const deleteMeal = async (mealId) => {
    // Add a confirmation
    if (!window.confirm("Delete this meal?")) return;

    const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId);

    if (error) {
        alert("Could not delete meal: " + error.message);
    } else {
        // Update local state immediately for a "snappy" UI
        setPlannedMeals(prev => prev.filter(meal => meal.id !== mealId));
        
        // Close any open modals
        if (setViewingMeal) setViewingMeal(null);
    }
}

const toFraction = (dec) => {
    console.log("Converting:", dec, "Type:", typeof dec);
    
    // Convert to number if it's a string
    const num = typeof dec === 'string' ? parseFloat(dec) : dec;
    
    if (isNaN(num)) return dec.toString();
    if (num % 1 === 0) return num.toString();
    
    const whole = Math.floor(num);
    const rem = num - whole;
    
    console.log("Whole:", whole, "Remainder:", rem);
    
    let f = "";
    if (Math.abs(rem - 0.125) < 0.08) f = "1/8";
    else if (Math.abs(rem - 0.25) < 0.08) f = "1/4";
    else if (Math.abs(rem - 0.333) < 0.08) f = "1/3";
    else if (Math.abs(rem - 0.375) < 0.08) f = "3/8";
    else if (Math.abs(rem - 0.5) < 0.08) f = "1/2";
    else if (Math.abs(rem - 0.625) < 0.08) f = "5/8";
    else if (Math.abs(rem - 0.667) < 0.08) f = "2/3";
    else if (Math.abs(rem - 0.75) < 0.08) f = "3/4";
    else if (Math.abs(rem - 0.875) < 0.08) f = "7/8";
    else return num.toFixed(2);
    
    return whole > 0 ? `${whole} ${f}` : f;
};

const handleAddFromFridge = async (spoonacularId) => {
    try {
        const res = await fetch(`https://api.spoonacular.com/recipes/${spoonacularId}/information?includeNutrition=true&apiKey=9726d520404c490cb7788202d4cde610`);
        const details = await res.json();
        if (!details || !details.title) {
            throw new Error("Recipe details not found");
        }
        const isDuplicate = recipeLibrary.some(
            r => r.name?.toLowerCase().trim() === details.title.toLowerCase().trim()
        );
        if (isDuplicate) {
            alert("This recipe is already in your library!");
            return;
        }
        const nutrients = details.nutrition?.nutrients || [];
        const findNutrient = (name) => nutrients.find(n => n.name === name)?.amount || 0;
        
        // Get instructions from analyzedInstructions
        let formattedInstructions = "";
        console.log("analyzedInstructions:", details.analyzedInstructions);
        console.log("instructions:", details.instructions);

        if (details.analyzedInstructions && details.analyzedInstructions.length > 0) {
            const steps = details.analyzedInstructions[0].steps;
            console.log("Using analyzedInstructions, steps:", steps);
            formattedInstructions = steps
                .map(step => `${step.number}. ${step.step}`)
                .join('\n\n');
        } else if (details.instructions) {
            console.log("Using fallback instructions");
            // Fallback: manually number the instructions
            const lines = details.instructions
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            
            console.log("Split lines:", lines);
            
            formattedInstructions = lines
                .map((line, index) => `${index + 1}. ${line}`)
                .join('\n\n');
            
            console.log("Final formatted instructions:", formattedInstructions);
        } else {
            console.log("No instructions available");
            formattedInstructions = "";
        }
        
        const mealData = {
            name: details.title,
            category: 'dinner',
            instructions: formattedInstructions,
            ingredients: details.extendedIngredients?.map(ing => {
                const amountNum = parseFloat(ing.measures?.us?.amount) || 0;
                const unit = ing.measures?.us?.unitShort || '';
                const fractionAmount = toFraction(amountNum);
                
                return {
                    name: ing.name,
                    amount: `${fractionAmount} ${unit}`.trim()
                };
            }) || [],
            calories: Math.round(findNutrient('Calories')),
            protein: Math.round(findNutrient('Protein')),
            carbs: Math.round(findNutrient('Carbohydrates')),
            fat: Math.round(findNutrient('Fat')),
            image_url: details.image,
            servings: details.servings || 1
        };
        const { data: libData } = await supabase.from('recipes').insert([mealData]).select();
        const { data: mealDataSaved } = await supabase.from('meals').insert([{ 
            ...mealData, 
            planned_date: selectedDate.toISOString().split('T')[0] 
        }]).select();
        if (libData) setRecipeLibrary(prev => [...prev, libData[0]]);
        if (mealDataSaved) setPlannedMeals(prev => [...prev, mealDataSaved[0]]);
        setShowFridgeSearch(false);
        alert("Added successfully!");
    } catch (err) {
        console.error("DETAILED ERROR:", err);
        alert("Error: " + err.message);
    }
}

    const printRecipe = () => {
        document.body.classList.add('is-printing-recipe');
        window.print();
        document.body.classList.remove('is-printing-recipe');
    };

const addAllToShoppingList = async (ingredients) => {
    try {
        if (!ingredients || ingredients.length === 0) {
            alert("No ingredients selected!");
            return;
        }

        const ingredientsToInsert = ingredients.map(ing => ({
            name: typeof ing === 'string' ? ing : (ing.name || 'Ingredient'),
            amount: typeof ing === 'string' ? '' : (ing.amount || ''),
            purchased: false,
        }));

        const { data, error } = await supabase
            .from('shopping_list')
            .insert(ingredientsToInsert);
        
        if (error) {
            console.error("Supabase error:", error);
            throw error;
        }
        
        alert("Added to list!");
        setSelectedIngredients([]);
        await fetchShoppingList(); // Refresh the shopping list
    } catch (err) {
        console.error("Error adding ingredients:", err.message, err);
        alert("Failed to add to list. Error: " + err.message);
    }
};

    const generateShoppingList = () => {
        const list = {};
        selectedIngredients.forEach(ing => {
            if (!ing || !ing.name) return;
        const name = ing.name.toLowerCase().trim();
            if (list[name]) {
                list[name].amount += `, ${ing.amount}`;
            } else {
                list[name] = { 
                    name: ing.name, 
                    amount: ing.amount 
                };
            }
        });
        return Object.values(list);
    }

const toggleAllIngredients = (ingredients) => {
    const flatIngredients = ingredients.flat().map(item => {
        if (typeof item === 'string') {
            return { name: item, amount: '' };
        }
        return { name: item?.name || 'Ingredient', amount: item?.amount || '' };
    })
    
    if (selectedIngredients.length === flatIngredients.length) {
        setSelectedIngredients([]);
    } else {
        setSelectedIngredients(flatIngredients);
    }
}

    const toggleIngredient = (ingredient) => {
        setSelectedIngredients(prev => 
            prev.includes(ingredient) 
                ? prev.filter(i => i !== ingredient) 
                : [...prev, ingredient]
        )
    }

const fetchShoppingList = async () => {
    try {
        const { data, error } = await supabase
            .from('shopping_list')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (data) setShoppingListItems(data);
    } catch (err) {
        console.error("Error fetching shopping list:", err);
    }
}

const convertExistingRecipesToFractions = async () => {
    try {
        // Get all recipes
        const { data: recipes } = await supabase.from('recipes').select('*');
        const { data: meals } = await supabase.from('meals').select('*');
        
        // Convert recipes
        for (const recipe of recipes) {
            if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
                const updatedIngredients = recipe.ingredients.map(ing => {
                    if (typeof ing === 'object' && ing.amount) {
                        // Extract number from amount string like "0.33333334 cups"
                        const match = ing.amount.match(/^([\d.]+)\s*(.*)$/);
                        if (match) {
                            const num = parseFloat(match[1]);
                            const unit = match[2];
                            const fraction = toFraction(num);
                            return { ...ing, amount: `${fraction} ${unit}`.trim() };
                        }
                    }
                    return ing;
                })
                
                await supabase.from('recipes').update({ ingredients: updatedIngredients }).eq('id', recipe.id);
            }
        }
        
        // Convert meals
        for (const meal of meals) {
            if (meal.ingredients && Array.isArray(meal.ingredients)) {
                const updatedIngredients = meal.ingredients.map(ing => {
                    if (typeof ing === 'object' && ing.amount) {
                        const match = ing.amount.match(/^([\d.]+)\s*(.*)$/);
                        if (match) {
                            const num = parseFloat(match[1]);
                            const unit = match[2];
                            const fraction = toFraction(num);
                            return { ...ing, amount: `${fraction} ${unit}`.trim() };
                        }
                    }
                    return ing;
                });
                
                await supabase.from('meals').update({ ingredients: updatedIngredients }).eq('id', meal.id);
            }
        }
        
        alert("All recipes converted to fractions!");
        await fetchData();
    } catch (err) {
        console.error("Error converting recipes:", err);
        alert("Failed to convert recipes");
    }
};
    
    return (
        <div className="min-h-screen bg-slate-50 px-6 py-10 md:px-12">
            <div className="max-w-[1600px] mx-auto">
                
                {/* Header Area */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Meal Planner</h1>
                        <p className="text-slate-500 mt-1">Plan your weekly nutrition</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-6 md:mt-0">
                        <Button 
                            onClick={() => { 
                                setSelectedDate(new Date()); 
                                setShowMealForm(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Create New Meal
                        </Button>

                        <Button 
                            onClick={() => setShowFridgeSearch(true)}
                            className="bg-sky-600 hover:bg-sky-700 text-white shadow-md"
                        >
                            <Refrigerator className="w-4 h-4 mr-2" /> What's in my Fridge?
                        </Button>

                        <Button 
                            variant="outline"
                            onClick={() => {
                                fetchShoppingList();
                                setShowShoppingList(true);
                            }}
                            className="border-slate-200 text-slate-600 bg-white shadow-sm"
                        >
                            <Sparkles className="w-4 h-4 mr-2 text-emerald-500" /> Shopping List
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => window.print()}
                            className="no-print border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 self-start"
                        >
                            <Printer className="w-4 h-4" />
                            Print Week
                        </Button>

                        <Button
                            variant="outline"
                            onClick={clearWeek}
                            className="no-print border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all flex items-center gap-2 self-start"
                        >
                            <Trash2 className="w-3 h-3" />
                            Clear Week
                        </Button>
                    </div>
                </div>
            </div>

                {/* Weekly Calendar View */}
                <div className="calendar-container grid grid-cols-1 md:grid-cols-7 gap-6 items-start bg-white rounded-3xl p-4">
                    {weekDays.map((day) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const dayMeals = plannedMeals.filter(meal => meal.planned_date === dateStr);

                        const dailyTotals = dayMeals.reduce((acc, meal) => ({
                            calories: acc.calories + (Number(meal.calories) || 0),
                            protein: acc.protein + (Number(meal.protein) || 0),
                            carbs: acc.carbs + (Number(meal.carbs) || 0),
                            fat: acc.fat + (Number(meal.fat) || 0)
                        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

                        return ( 
                            <div key={format(day, 'yyyy-MM-dd')} className="flex flex-col w-full mb-6">
                                <div className="text-center w-full mb-4">
                                    <h3 className="font-bold text-slate-800 text-xl leading-tight">
                                        {format(day, 'EEEE')}
                                    </h3>
                                    <p className="text-sm text-slate-400 font-medium">
                                        {format(day, 'MMM d')}
                                    </p>
                                </div>

                                <div className="bg-slate-50/50 rounded-2xl p-3 shadow-sm items-center">
                                    <div className="flex justify-around w-full">
                                        <div className="flex flex-col items-center">
                                            <span className="leading-none mt-1 font-bold text-s text-orange-400">🔥kcal: {Math.round(dailyTotals.calories)} </span>
                                            <span className="leading-none mt-1 text-xs text-emerald-600">💪 P: {Math.round(dailyTotals.protein)}g</span>
                                            <span className="leading-none mt-1 text-xs text-amber-600">🍞 C: {Math.round(dailyTotals.carbs)}g</span>
                                            <span className="leading-none mt-1 text-xs text-indigo-600">🥑 F: {Math.round(dailyTotals.fat)}g</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-2">
                                    {dayMeals.map((meal, idx) => (
                                        <div
                                            key={meal.id || `meal-${idx}`}
                                            onClick={() => { setViewingMeal(meal); setAdjustServings(meal.servings || 1); setSelectedIngredients([]); }}
                                            className="relative w-full text-left p-3 pl-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-100/50 mb-2 group cursor-pointer"
                                        >
                                            <div className="flex items-start">      
                                                <span className="text-sm font-semibold text-emerald-900 leading-tight break-words whitespace-normal">
                                                    {meal.name}
                                                </span>
                                                <div className="absolute top-3 left-2.5 flex items-center justify-center">
                                                    <span className="text-sm">
                                                        {meal.category === 'breakfast' && '🌅'}
                                                        {meal.category === 'lunch' && '☀️'}
                                                        {meal.category === 'dinner' && '🌙'}
                                                        {meal.category === 'snack' && '🍎'}
                                                    </span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); deleteMeal(meal.id); }} 
                                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-600 transition-opacity"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    window.lastClickedDate = day;
                                                    setSelectedDate(day);
                                                    setShowLibrary(true);
                                                }}
                                                className="w-full mt-2 border-dashed border-2 text-slate-400 hover:border-emerald-600 hover:text-emerald-600 transition-all"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>

            {/* Fridge Search Modal */}
            {showFridgeSearch && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden shadow-2xl">
                        <div className="p-6 border-b flex justify-between items-center bg-sky-600 text-white">
                            <div>
                                <h2 className="text-xl font-bold">Fridge Search</h2>
                                <p className="text-sky-100 text-xs">Enter ingredients you already have</p>
                            </div>
                            <button onClick={() => setShowFridgeSearch(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="flex gap-3 mb-8">
                                <input 
                                    type="text" 
                                    placeholder="e.g. Chicken, Spinach, Garlic"
                                    className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                                    id="fridgeInput"
                                    onKeyDown={(e) => e.key === 'Enter' && document.getElementById('searchBtn').click()}
                                />
                                <button 
                                    id="searchBtn"
                                    onClick={async () => {
                                        const val = document.getElementById('fridgeInput').value;
                                        if(!val) return;
                                        const res = await fetch(`https://api.spoonacular.com/recipes/findByIngredients?ingredients=${val}&number=9&apiKey=9726d520404c490cb7788202d4cde610`);
                                        const data = await res.json();
                                        setFridgeResults(data);
                                    }}
                                    className="bg-sky-600 hover:bg-sky-700 text-white px-8 rounded-2xl font-bold shadow-lg shadow-sky-200 transition-all"
                                >
                                    Search
                                </button>
                            </div>
                            {fridgeResults.length === 0 ? (
                                <div className="text-center py-20">
                                    <Refrigerator className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                    <p className="text-slate-400">Search for ingredients to see recipes</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {fridgeResults.map((recipe) => (
                                        <div key={recipe.id} className="group bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                                            <div className="relative">
                                                <img src={recipe.image} alt={recipe.title} className="w-full h-48 object-cover" />
                                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase text-sky-600 shadow-sm">
                                                    {recipe.usedIngredientCount} items owned
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <h3 className="font-bold text-slate-800 mb-2 leading-tight line-clamp-2 min-h-[2.5rem]">
                                                    {recipe.title}
                                                </h3>
                                                <div className="mb-4 space-y-1">
                                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Missing Items:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {recipe.missedIngredients.slice(0, 3).map((ing, idx) => (
                                                            <span key={idx} className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md font-bold">
                                                                + {ing.name}
                                                            </span>
                                                        ))}
                                                        {recipe.missedIngredientCount > 3 && (
                                                            <span className="text-[10px] text-slate-400 font-bold">
                                                                +{recipe.missedIngredientCount - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleAddFromFridge(recipe.id)}
                                                    className="w-full py-3 bg-sky-50 hover:bg-sky-600 text-sky-600 hover:text-white rounded-xl text-sm font-bold transition-all"
                                                >
                                                    Add to Library
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Shopping List Modal */}
{showShoppingList && (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-emerald-600 text-white">
                <h2 className="text-xl font-bold text-white">Shopping List</h2>
                <button onClick={() => setShowShoppingList(false)} className="hover:rotate-90 transition-transform">
                    <X className="w-6 h-6" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
                {shoppingListItems.length === 0 ? (
                    <p className="text-center text-slate-400">Your shopping list is empty.</p>
                ) : (
                    <ul className="space-y-4">
                        {shoppingListItems.map((item) => (
                            <li key={item.id} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-colors group">
                                <input 
                                    type="checkbox" 
                                    checked={item.purchased}
                                    onChange={async () => {
                                        // Toggle purchased status
                                        const { error } = await supabase
                                            .from('shopping_list')
                                            .update({ purchased: !item.purchased })
                                            .eq('id', item.id);
                                        
                                        if (!error) {
                                            await fetchShoppingList();
                                        }
                                    }}
                                    className="mt-1 h-5 w-5 rounded-full border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                                />
                                <div className="flex flex-col flex-1">
                                    <span className={`font-bold text-slate-800 capitalize leading-tight ${item.purchased ? 'line-through text-slate-400' : ''}`}>
                                        {item.name}
                                    </span>
                                    {item.amount && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                Qty
                                            </span>
                                            <span className="text-xs text-slate-500 font-medium">
                                                {item.amount}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={async () => {
                                        const { error } = await supabase
                                            .from('shopping_list')
                                            .delete()
                                            .eq('id', item.id);
                                        
                                        if (!error) {
                                            await fetchShoppingList();
                                        }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
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
                                    reader.onloadend = async () => {
                                        const base64Image = reader.result;

    // Update Supabase
        const { error } = await supabase
            .from('meals')
            .update({ image_url: base64Image })
            .eq('id', viewingMeal.id);
    if (!error) {
        const updatedMeal = { ...viewingMeal, image_url: base64Image };
            setPlannedMeals(prev => prev.map(m => m.id === viewingMeal.id ? updatedMeal : m));
            setViewingMeal(updatedMeal);
                }
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
                <button 
                    onClick={() => {
                        setViewingMeal(null);
                        setSelectedIngredients([]); // Clear selections when closing
                    }}
                    className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
                >
                    <X className="w-5 h-5" />
                </button>
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
    <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-slate-800">Ingredients</h3>
        <div className="flex gap-2">
            <button
                onClick={() => {
                    if (viewingMeal?.ingredients && Array.isArray(viewingMeal.ingredients)) {
                        toggleAllIngredients(viewingMeal.ingredients);
                    }
                }}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-3 py-1 bg-emerald-50 rounded-lg"
            >
                {selectedIngredients.length === (viewingMeal?.ingredients?.flat().length || 0) ? 'Deselect All' : 'Select All'}
            </button>
            {selectedIngredients.length > 0 && (
                <button
                    onClick={() => addAllToShoppingList(selectedIngredients)}
                    className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded-lg flex items-center gap-1"
                >
                    <ListPlus className="w-3 h-3" />
                    Add to List ({selectedIngredients.length})
                </button>
            )}
        </div>
    </div>
    <div className="grid grid-cols-1 gap-2">
        {viewingMeal?.ingredients && Array.isArray(viewingMeal.ingredients) ? (
            viewingMeal.ingredients.flat().map((item, i) => {
                // If item is just a string, handle it
                if (typeof item === 'string') {
                    const ingredient = { name: item, amount: '' };
                    const isChecked = selectedIngredients.some(ing => ing.name === item);
                    return (
                        <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50">
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleIngredient(ingredient)}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="text-slate-700 font-medium">{item}</span>
                        </div>
                    );
                }

                // If it's an object, get name and amount safely
                const name = item?.name || "Ingredient";
                const amount = item?.amount || "";
                const ingredient = { name, amount };
                const isChecked = selectedIngredients.some(ing => ing.name === name);

                return (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50">
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleIngredient(ingredient)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-slate-700 font-medium">{name}</span>
                        <span className="ml-auto text-slate-400 text-sm">{amount}</span>
                    </div>
                );
            })
        ) : (
            <p className="text-slate-400 text-sm">No ingredients listed</p>
        )}
    </div>
</div>

            {/* Instructions */}
            {viewingMeal.instructions && (
                <div>
                    <h3 className="font-bold text-slate-800 mb-3">Instructions</h3>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {viewingMeal.instructions}
                    </p>
                </div>
            )}
    </div>
                        <div className="p-4 border-t bg-slate-50 flex justify-end">
                            <button 
                                onClick={() => {
                                    setViewingMeal(null);
                                    setSelectedIngredients([]); // Clear selections when closing
                                }}
                                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            )} 

            {/* Library */}
            {showLibrary && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden shadow-2xl">
                        <div className="p-6 border-b flex justify-between items-center bg-blue-600 text-white">
                        <h2 className="text-xl font-bold">Recipe Library</h2>
                            <button 
                                onClick={() => setShowLibrary(false)} 
                                className="hover:rotate-90 transition-transform"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>                  
                    
                <div className="flex-1 overflow-y-auto p-6">
                    {recipeLibrary.length === 0 ? (
                        <p className="text-center text-slate-400">No recipes in your library yet.</p>
                    ) : (
                        <ul className="space-y-3">
                            {recipeLibrary.map((recipe) => (
                                <li 
                                    key={recipe.id} 
                                    className="p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 transition-all flex justify-between items-center group" 
                                    onClick={() => handleAddFromLibrary(recipe, window.lastClickedDate || selectedDate)}
                                >
                                    <div>
                                        <p className="font-bold text-slate-800">{recipe.name}</p>
                                        <p className="text-xs text-slate-500 capitalize">{recipe.category}</p>
                                    </div>
      
                                    {/* Visual indicator that this adds the item */}
                                    <div className="bg-emerald-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    )}

            {/* Meal Form */}
              {showMealForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
                  <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                    <MealForm 
                      onSubmit={async (formData) => {
                          const mealData = {
                              name: formData.name.trim(),
                              category: formData.category || 'lunch',
                              instructions: formData.description || formData.instructions || "", 
                              ingredients: formData.ingredients || [],
                              calories: Number(formData.calories) || 0,
                              protein: Number(formData.protein) || 0,
                              carbs: Number(formData.carbs) || 0,
                              fat: Number(formData.fat) || 0,
                              servings: Number(formData.servings) || 1,
                              image_url: formData.image_url || formData.image || ""
                          };

                          await saveRecipeToLibraryIfNew(mealData);

                          const { data: mealResult } = await supabase
                              .from('meals')
                              .insert([{ 
                                  ...mealData, 
                                  planned_date: selectedDate.toISOString().split('T')[0] 
                              }])
                              .select();

                          if (mealResult) {
                              setPlannedMeals(prev => [...prev, mealResult[0]]);
                              setShowMealForm(false);
                          }
                      }}
                      onCancel={() => setShowMealForm(false)}
                    />
                    </div> 
                </div>
              )}

        </div>
    )
}

