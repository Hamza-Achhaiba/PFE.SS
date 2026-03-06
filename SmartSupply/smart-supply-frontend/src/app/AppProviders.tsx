import React from 'react';
import { ToastContainer } from 'react-toastify';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <>
            {children}
            <ToastContainer position="top-right" autoClose={3000} />
        </>
    );
};
