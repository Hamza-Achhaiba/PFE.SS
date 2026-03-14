import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
    id: string | number;
    nom: string;
}

interface SoftSelectProps {
    label?: string;
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    className?: string;
}

export const SoftSelect: React.FC<SoftSelectProps> = ({
    label,
    value,
    options,
    onChange,
    placeholder = 'Select an option',
    error,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`soft-select-container ${className}`} ref={containerRef}>
            {label && <label className="soft-label">{label}</label>}
            
            <div 
                className={`soft-select-trigger ${isOpen ? 'open' : ''} ${error ? 'error' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={!value ? 'text-muted opacity-50' : 'fw-medium'}>
                    {value || placeholder}
                </span>
                <ChevronDown size={18} className={`transition-all ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="soft-select-menu animate-fade-in">
                    {options.length === 0 ? (
                        <div className="soft-select-item disabled text-muted italic small text-center py-3">
                            No options available
                        </div>
                    ) : (
                        options.map((option) => (
                            <div
                                key={option.id}
                                className={`soft-select-item ${value === option.nom ? 'selected' : ''}`}
                                onClick={() => handleSelect(option.nom)}
                            >
                                {option.nom}
                                {value === option.nom && (
                                    <div className="selected-dot" />
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
            
            {error && <span className="error-text">{error}</span>}
        </div>
    );
};
