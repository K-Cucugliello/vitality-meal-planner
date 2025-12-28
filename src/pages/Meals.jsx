import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, UtensilsCrossed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MealCard from '../components/meals/MealCard';
import MealForm from '../components/meals/MealForm';

export default function Meals() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [editingMeal, setEditingMeal] = useState(null);
    const [selectedMeal, setSelectedMeal] = useState(null);

    const queryClient = useQueryClient();

    // Check if there's a meal ID in the URL params
    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const mealId = urlParams.get('meal');
        if (mealId && meals.length > 0) {
            const meal = meals.find(m => m.id === mealId);
            if (meal) {
                setSelectedMeal(meal);
            }
        }
    }, [window.location.search]);

    const { data: meals = [], isLoading } = useQuery({
        queryKey: ['meals'],
        queryFn: () => base44.entities.Meal.list()
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Meal.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meals'] });
            setShowForm(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Meal.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meals'] });
            setShowForm(false);
            setEditingMeal(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Meal.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meals'] });
            setSelectedMeal(null);
        }
    });

    const toggleFavorite = (meal) => {
        updateMutation.mutate({
            id: meal.id,
            data: { is_favorite: !meal.is_favorite }
        });
    };

    const handleSubmit = (data) => {
        if (editingMeal) {
            updateMutation.mutate({ id: editingMeal.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const filteredMeals = meals.filter(meal => {
        const matchesSearch = meal.name.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || 
                             (filter === 'favorites' && meal.is_favorite) ||
                             meal.category === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">My Meals</h1>
                        <p className="text-slate-500 mt-1">Build your meal library</p>
                    </div>
                    <Button 
                        onClick={() => { setEditingMeal(null); setShowForm(true); }}
                        className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add New Meal
                    </Button>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col md:flex-row gap-4 mb-8"
                >
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search meals..."
                            className="pl-11 h-11 border-slate-200 bg-white shadow-sm"
                        />
                    </div>
                    <Tabs value={filter} onValueChange={setFilter}>
                        <TabsList className="bg-white shadow-sm border border-slate-100">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="favorites">❤️ Favorites</TabsTrigger>
                            <TabsTrigger value="breakfast">🌅 Breakfast</TabsTrigger>
                            <TabsTrigger value="lunch">☀️ Lunch</TabsTrigger>
                            <TabsTrigger value="dinner">🌙 Dinner</TabsTrigger>
                            <TabsTrigger value="snack">🍎 Snack</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </motion.div>

                {/* Meals Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredMeals.map((meal, index) => (
                            <motion.div
                                key={meal.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <MealCard
                                    meal={meal}
                                    onClick={() => setSelectedMeal(meal)}
                                    onFavoriteToggle={toggleFavorite}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Empty State */}
                {!isLoading && filteredMeals.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <UtensilsCrossed className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-700 mb-2">No meals found</h3>
                        <p className="text-slate-500 mb-6">Start building your meal library</p>
                        <Button 
                            onClick={() => { setEditingMeal(null); setShowForm(true); }}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create your first meal
                        </Button>
                    </motion.div>
                )}

                {/* Create/Edit Dialog */}
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingMeal ? 'Edit Meal' : 'Create New Meal'}
                            </DialogTitle>
                        </DialogHeader>
                        <MealForm
                            meal={editingMeal}
                            onSubmit={handleSubmit}
                            onCancel={() => { setShowForm(false); setEditingMeal(null); }}
                        />
                    </DialogContent>
                </Dialog>

                {/* View Meal Dialog */}
                <Dialog open={!!selectedMeal} onOpenChange={() => setSelectedMeal(null)}>
                    <DialogContent className="max-w-lg">
                        {selectedMeal && (
                            <div className="space-y-4">
                                {selectedMeal.image_url && (
                                    <img 
                                        src={selectedMeal.image_url} 
                                        alt={selectedMeal.name}
                                        className="w-full h-48 object-cover rounded-xl"
                                    />
                                )}
                                <DialogHeader>
                                    <DialogTitle className="text-xl">{selectedMeal.name}</DialogTitle>
                                </DialogHeader>
                                {selectedMeal.description && (
                                    <p className="text-slate-600">{selectedMeal.description}</p>
                                )}
                                
                                {/* Nutrition */}
                                <div className="grid grid-cols-4 gap-3">
                                    {selectedMeal.calories && (
                                        <div className="bg-orange-50 rounded-xl p-3 text-center">
                                            <p className="text-lg font-semibold text-slate-800">{selectedMeal.calories}</p>
                                            <p className="text-xs text-slate-500">calories</p>
                                        </div>
                                    )}
                                    {selectedMeal.protein && (
                                        <div className="bg-rose-50 rounded-xl p-3 text-center">
                                            <p className="text-lg font-semibold text-slate-800">{selectedMeal.protein}g</p>
                                            <p className="text-xs text-slate-500">protein</p>
                                        </div>
                                    )}
                                    {selectedMeal.carbs && (
                                        <div className="bg-amber-50 rounded-xl p-3 text-center">
                                            <p className="text-lg font-semibold text-slate-800">{selectedMeal.carbs}g</p>
                                            <p className="text-xs text-slate-500">carbs</p>
                                        </div>
                                    )}
                                    {selectedMeal.fat && (
                                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                                            <p className="text-lg font-semibold text-slate-800">{selectedMeal.fat}g</p>
                                            <p className="text-xs text-slate-500">fat</p>
                                        </div>
                                    )}
                                </div>

                                {/* Ingredients */}
                                {selectedMeal.ingredients?.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-slate-700 mb-2">Ingredients</h4>
                                        <div className="space-y-1">
                                            {selectedMeal.ingredients.map((ing, i) => (
                                                <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                                                    <span className="text-slate-600">{ing.name}</span>
                                                    <span className="text-slate-400">{ing.amount}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            setSelectedMeal(null);
                                            setEditingMeal(selectedMeal);
                                            setShowForm(true);
                                        }}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => deleteMutation.mutate(selectedMeal.id)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}