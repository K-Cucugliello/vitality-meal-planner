import React from 'react';

// The main wrapper that holds the current value
export const Tabs = ({ children, value, onValueChange }) => {
  return (
    <div className="flex flex-col">
      {React.Children.map(children, child => {
        // This passes the current 'value' and 'onValueChange' down to the list and triggers
        return React.cloneElement(child, { value, onValueChange });
      })}
    </div>
  );
};

export const TabsList = ({ children, className, value, onValueChange }) => (
  <div className={`flex gap-2 p-1 rounded-lg ${className}`}>
    {React.Children.map(children, child => {
      return React.cloneElement(child, { activeValue: value, onValueChange });
    })}
  </div>
);

export const TabsTrigger = ({ children, value, activeValue, onValueChange }) => {
  const isActive = activeValue === value;
  return (
    <button
      onClick={() => onValueChange(value)}
      className={`px-4 py-2 text-sm font-medium transition-all rounded-md ${
        isActive 
          ? 'bg-white text-emerald-700 shadow-sm' 
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
};