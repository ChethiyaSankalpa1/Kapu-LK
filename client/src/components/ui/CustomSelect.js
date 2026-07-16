import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const CustomSelect = ({ value, onChange, options, placeholder = 'Select...' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="relative" ref={dropdownRef}>
            <div 
                className="form-input flex items-center justify-between cursor-pointer select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={!selectedOption ? "text-gray-400 dark:text-gray-500" : ""}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            
            {isOpen && (
                <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <div
                                key={option.value}
                                className={`px-4 py-3 text-sm cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-between ${
                                    value === option.value 
                                        ? 'bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium' 
                                        : 'text-gray-700 dark:text-gray-300'
                                }`}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                            >
                                {option.label}
                                {value === option.value && (
                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
