import { X, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

export default function MealCard({ meal, onClick, compact = false, onFavoriteToggle }) {
    const categoryColors = {
        breakfast: "bg-amber-50 text-amber-700 border-amber-200",
        lunch: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dinner: "bg-violet-50 text-violet-700 border-violet-200",
        snack: "bg-rose-50 text-rose-700 border-rose-200"
    };

    if (compact) {
        return (
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClick}
                className="cursor-pointer"
            >
                <Card className="p-3 hover:shadow-md transition-all duration-300 border-slate-100 bg-white/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        {meal.image_url && (
                            <img 
                                src={meal.image_url} 
                                alt={meal.name}
                                className="w-10 h-10 rounded-lg object-cover"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 truncate text-sm">{meal.name}</p>
                            {meal.calories && (
                                <p className="text-xs text-slate-400">{meal.calories} cal</p>
                            )}
                        </div>
                    </div>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            onClick={onClick}
            className="cursor-pointer"
        >
            <Card className="overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white">
                {meal.image_url ? (
                    <div className="relative h-40 overflow-hidden">
                        <img 
                            src={meal.image_url} 
                            alt={meal.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        {onFavoriteToggle && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onFavoriteToggle(meal); }}
                                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
                            >
                                <Heart 
                                    className={cn(
                                        "w-4 h-4 transition-colors",
                                        meal.is_favorite ? "fill-rose-500 text-rose-500" : "text-slate-400"
                                    )} 
                                />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                        <div className="text-4xl">🍽️</div>
                        {onFavoriteToggle && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onFavoriteToggle(meal); }}
                                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
                            >
                                <Heart 
                                    className={cn(
                                        "w-4 h-4 transition-colors",
                                        meal.is_favorite ? "fill-rose-500 text-rose-500" : "text-slate-400"
                                    )} 
                                />
                            </button>
                        )}
                    </div>
                )}
                <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-slate-800 leading-tight">{meal.name}</h3>
                        <Badge variant="outline" className={cn("shrink-0 text-xs", categoryColors[meal.category])}>
                            {meal.category}
                        </Badge>
                    </div>
                    {meal.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{meal.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                        {meal.calories && (
                            <span className="flex items-center gap-1">
                                <Flame className="w-3.5 h-3.5" />
                                {meal.calories} cal
                            </span>
                        )}
                        {meal.prep_time && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {meal.prep_time} min
                            </span>
                        )}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}