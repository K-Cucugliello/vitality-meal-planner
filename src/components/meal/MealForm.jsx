import React, { useState } from 'react';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { X, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MealForm({ onSubmit, onCancel }) {
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [recipeUrl, setRecipeUrl] = useState('');
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'lunch',
        servings: '1',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        prep_time: '',
        image_url: '',
        ingredients: [{ name: '', amount: '' }],
        instructions: '',
    });

    const handleAiImport = async () => {
        if (!recipeUrl) return alert("Please paste a URL first!");
        setIsAiLoading(true);
        try {
            const API_KEY = '9726d520404c490cb7788202d4cde610'; // <--- PASTE YOUR KEY HERE
            const response = await fetch(
                `https://api.spoonacular.com/recipes/extract?url=${encodeURIComponent(recipeUrl)}&apiKey=${API_KEY}&forceExtraction=true&analyze=true&includeNutrition=true`
            );
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();

            const getNutrient = (name) => {
                const n = data.nutrition?.nutrients?.find(nut => nut.name.toLowerCase() === name.toLowerCase());
                return n ? Math.round(n.amount).toString() : '';
            };

            const instructions = data.instructions?.replace(/<[^>]*>?/gm, '') || data.summary?.replace(/<[^>]*>?/gm, '');

            setFormData(prev => ({
                ...prev,
                name: data.title || prev.name,
                description: data.instructions || data.summary || prev.description,
                servings: data.servings ? data.servings.toString() : '1',
                calories: getNutrient('Calories'),
                protein: getNutrient('Protein'),
                carbs: getNutrient('Carbohydrates'),
                fat: getNutrient('Fat'),
                prep_time: data.readyInMinutes ? data.readyInMinutes.toString() : prev.prep_time,
    
                image_url: data.image || data.imageURL || data.thumbnail || prev.image_url,

                ingredients: data.extendedIngredients?.map(ing => ({
                    name: ing.nameClean || ing.name,
                    amount: `${ing.measures.us.amount} ${ing.measures.us.unitShort}`
                })) || prev.ingredients
}));
            alert("Imported!");
        } catch (error) {
            console.error(error);
            alert("Error parsing URL.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const updateIngredient = (index, field, value) => {
        const newIngredients = [...formData.ingredients];
        newIngredients[index][field] = value;
        setFormData({ ...formData, ingredients: newIngredients });
    };

const handleSubmit = (e) => {
  // 1. Stop the page from refreshing
  e.preventDefault(); 
  
  // 2. Debug: See if it's working
  console.log("Form submitted!", formData); 
  
  // 3. Send data to MealPlanner.jsx
  if (formData.name.trim()) {
    onSubmit(formData);
  } else {
    alert("Please at least give the meal a name!");
  }
}; 

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            
    {/* AI SECTION */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <Label className="text-emerald-800 font-bold flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4" /> 
                        AI Recipe Import
                </Label>
                <div className="flex gap-2">
                    <Input placeholder="Paste URL..." 
                    value={recipeUrl} 
                    onChange={(e) => 
                        setRecipeUrl(e.target.value)} 
                    className="bg-white" />
                    <Button type="button" 
                    onClick={handleAiImport} 
                    disabled={isAiLoading} 
                    className="bg-emerald-600">
                        {isAiLoading ? <Loader2 className="animate-spin" /> : "Parse"}
                    </Button>
                </div>
            </div>

{/* THE MAIN FORM STARTS HERE */}
    <form 
        onSubmit={handleSubmit} 
        className="space-y-6">

    {/* BASIC INFO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Meal Name</Label>
                    <Input value={formData.name} required
                        onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>

                <div className="space-y-2">
                    <Label>Category</Label>
                    <select value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                        <option value="breakfast">🌅 Breakfast</option>
                        <option value="lunch">☀️ Lunch</option>
                        <option value="dinner">🌙 Dinner</option>
                        <option value="snack">🍎 Snack</option>
                    </select>
                </div>
                
                <div className="space-y-2">
                    <Label>Servings</Label>
                    <Input type="number" value={formData.servings} 
                        onChange={(e) => setFormData({...formData, servings: e.target.value})} />
                </div>
            </div>

    {/* INSTRUCTIONS */}
        <div className="space-y-2">
            <Label>Instructions</Label>
            <Textarea value={formData.instructions} 
                onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                className="h-24" />
        </div>

    {/* NUTRITION */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['calories', 'protein', 'carbs', 'fat'].map((f) => (
                <div key={f} className="space-y-1">
                    <Label className="capitalize">{f}</Label>
                    <Input type="number" value={formData[f]} 
                        onChange={(e) => setFormData({...formData, [f]: e.target.value})} />
                </div>
            ))}
        </div>

    {/* INGREDIENTS */}
        <div className="space-y-3">
            <div className="flex justify-between">
                <Label>Ingredients</Label>
                <Button type="button" variant="ghost" size="sm" 
                    onClick={() => setFormData({...formData, ingredients: [...formData.ingredients, {name: '', amount: ''}]})}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
            </div>
            {formData.ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                    <Input placeholder="Item" value={ing.name} 
                        onChange={(e) => updateIngredient(idx, 'name', e.target.value)} className="flex-1" />
                    <Input placeholder="Amt" value={ing.amount} 
                        onChange={(e) => updateIngredient(idx, 'amount', e.target.value)} className="w-24" />
                </div>
            ))}
        </div>

    {/* FORM BUTTONS */}
      <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 py-3">
                Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-emerald-600 text-white py-3 rounded-xl">
                Create Meal
            </Button>
        </div>
    </form>
        </motion.div>
    );
}