import React from 'react';

export const Dialog = ({ children, open }) => open ? <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">{children}</div> : null;
export const DialogContent = ({ children, className }) => <div className={`bg-white p-6 rounded-lg shadow-xl ${className}`}>{children}</div>;
export const DialogHeader = ({ children }) => <div className="mb-4">{children}</div>;
export const DialogTitle = ({ children }) => <h2 className="text-xl font-bold">{children}</h2>;