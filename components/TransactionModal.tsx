import React, { useState, useEffect, useMemo } from 'react';
import type { Settings, Transaction, Owner, Vehicle } from '../types.ts';
import { FuelType, PaymentMode, TransactionType, VehicleType } from '../types.ts';
import CloseIcon from './icons/CloseIcon.tsx';
import RegisterOwnerModal from './RegisterOwnerModal.tsx';
import CustomSelect from './CustomSelect.tsx';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction, isEditing: boolean) => void;
  settings: Settings;
  owners: Owner[];
  onUpdateOwner: (owner: Owner) => Promise<void>;
  transactionToEdit?: Transaction | null;
}

const RadioButtonGroup: React.FC<{
    options: { value: string; label: string }[];
    selectedValue: string | null;
    onChange: (value: string) => void;
    name: string;
}> = ({ options, selectedValue, onChange, name }) => (
    <div className="grid grid-cols-2 gap-2">
        {options.map(({ value, label }) => (
            <button
                key={value}
                type="button"
                name={name}
                onClick={() => onChange(value)}
                className={`p-3 rounded-md text-center font-semibold transition-all duration-200 border-2 ${
                    selectedValue === value
                        ? 'bg-cyan-500 border-cyan-500 text-white'
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
            >
                {label}
            </button>
        ))}
    </div>
);

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSave, settings, owners, onUpdateOwner, transactionToEdit }) => {
    const [fuelType, setFuelType] = useState<FuelType | null>(null);
    const [fuelForm, setFuelForm] = useState<'amount' | 'volume' | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [paymentMode, setPaymentMode] = useState<PaymentMode | null>(null);
    const [amountPaid, setAmountPaid] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleOwner, setVehicleOwner] = useState<string | null>(null);
    const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
    const [isGallonSale, setIsGallonSale] = useState(false);
    const [selectedGallonOwner, setSelectedGallonOwner] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    
    const isEditing = !!transactionToEdit;

    const resetForm = () => {
        setFuelType(null);
        setFuelForm(null);
        setInputValue('');
        setPaymentMode(null);
        setAmountPaid('');
        setVehicleNumber('');
        setVehicleOwner(null);
        setVehicleType(null);
        setIsGallonSale(false);
        setSelectedGallonOwner('');
        setError(null);
    };

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                setFuelType(transactionToEdit.fuelType!);
                setPaymentMode(transactionToEdit.paymentMode!);
                setFuelForm('amount');
                setInputValue(String(transactionToEdit.fuelAmount.toFixed(2)));
                setAmountPaid(transactionToEdit.amountPaid ? String(transactionToEdit.amountPaid) : '');
                setVehicleNumber(transactionToEdit.vehicleNumber || '');
            } else {
                resetForm();
            }
        }
    }, [isOpen, isEditing, transactionToEdit]);


    const handleClose = () => {
        onClose();
    };

    const rate = useMemo(() => {
        if (fuelType === FuelType.Petrol) return settings.petrolRate;
        if (fuelType === FuelType.Diesel) return settings.dieselRate;
        return 0;
    }, [fuelType, settings]);

    const { fuelAmount, fuelVolume } = useMemo(() => {
        const numValue = parseFloat(inputValue);
        if (!fuelForm || !rate || isNaN(numValue) || numValue <= 0) {
            return { fuelAmount: 0, fuelVolume: 0 };
        }
        if (fuelForm === 'amount') {
            return { fuelAmount: numValue, fuelVolume: numValue / rate };
        }
        if (fuelForm === 'volume') {
            return { fuelAmount: numValue * rate, fuelVolume: numValue };
        }
        return { fuelAmount: 0, fuelVolume: 0 };
    }, [inputValue, fuelForm, rate]);

    const changeReturned = useMemo(() => {
        const paid = parseFloat(amountPaid);
        if (!paymentMode || paymentMode === PaymentMode.Bill || isNaN(paid) || !fuelAmount) return null;
        return paid - fuelAmount;
    }, [amountPaid, fuelAmount, paymentMode]);

    useEffect(() => {
        if (paymentMode === PaymentMode.Bill && vehicleNumber.trim() && !isGallonSale) {
            const searchVehicleNumber = vehicleNumber.trim().toLowerCase();
            let foundOwnerName: string | null = null;
            let foundVehicleType: VehicleType | null = null;
            
            for (const owner of owners) {
                const foundVehicle = owner.vehicles?.find(v => v?.number?.toLowerCase() === searchVehicleNumber);
                if (foundVehicle) {
                    foundOwnerName = owner.name;
                    foundVehicleType = foundVehicle.type;
                    break;
                }
            }
            setVehicleOwner(foundOwnerName || 'Unknown');
            setVehicleType(foundVehicleType);
        } else if (!isGallonSale) {
            setVehicleOwner(null);
            setVehicleType(null);
        }
    }, [vehicleNumber, paymentMode, owners, isGallonSale]);

    const handleVehicleNumberChange = (value: string) => {
        setVehicleNumber(value);
        if (value.trim().toLowerCase() === 'gallon') {
            setIsGallonSale(true);
            setVehicleOwner(null);
        } else {
            setIsGallonSale(false);
            setSelectedGallonOwner('');
        }
    };
    
    const handleGallonOwnerSelect = (ownerId: string) => {
        const owner = owners.find(o => o.id === ownerId);
        if (owner) {
            setSelectedGallonOwner(owner.id);
            setVehicleOwner(owner.name);
            setVehicleNumber('GALLON');
        }
    };
    
    const handleRegisterVehicle = (ownerId: string, vehicle: Vehicle) => {
        const ownerToUpdate = owners.find(o => o.id === ownerId);
        if (ownerToUpdate && !ownerToUpdate.vehicles.some(v => v.number === vehicle.number)) {
            const updatedOwner = {
                ...ownerToUpdate,
                vehicles: [...ownerToUpdate.vehicles, vehicle]
            };
            onUpdateOwner(updatedOwner);
        }
        setIsRegisterModalOpen(false);
    };

    const handleCommit = () => {
        setError(null);
        if (!fuelType) { setError('Please select a fuel type.'); return; }
        if (!fuelForm) { setError('Please select amount or volume.'); return; }
        if (fuelAmount <= 0) { setError('Please enter a valid amount or volume.'); return; }
        if (!paymentMode) { setError('Please select a payment mode.'); return; }

        if (paymentMode !== PaymentMode.Bill && !amountPaid) {
            setError('Please enter amount paid by customer.');
            return;
        }

        if (paymentMode === PaymentMode.Bill) {
            if (!vehicleNumber.trim()) {
                setError('Please enter a vehicle number or "Gallon" for bill payments.');
                return;
            }
            if (isGallonSale && !selectedGallonOwner) {
                setError('Please select a partner for the Gallon sale.');
                return;
            }
        }

        const finalTransaction: Transaction = {
            id: isEditing ? transactionToEdit.id : '',
            timestamp: isEditing ? transactionToEdit.timestamp : new Date().toISOString(),
            type: TransactionType.Sale,
            fuelType: fuelType!,
            fuelAmount,
            fuelVolume,
            paymentMode: paymentMode!,
        };

        if (paymentMode !== PaymentMode.Bill) {
            finalTransaction.amountPaid = parseFloat(amountPaid) || 0;
            if (changeReturned !== null) {
                finalTransaction.changeReturned = changeReturned;
            }
        } else {
            finalTransaction.vehicleNumber = vehicleNumber.trim().toUpperCase();
            if (vehicleOwner) {
                finalTransaction.vehicleOwner = vehicleOwner;
            }
            if (vehicleType) {
                finalTransaction.vehicleType = vehicleType;
            }
        }
        
        onSave(finalTransaction, isEditing);
    };

    if (!isOpen) return null;

    const ownerOptionsForSelect = owners.map(o => ({ value: o.id, label: o.name }));

    return (
        <>
            <div 
                className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
                onClick={handleClose}
            >
                <div
                    className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg m-4 relative transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <style>{`
                        @keyframes fade-in-scale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                        .animate-fade-in-scale { animation: fade-in-scale 0.2s forwards ease-out; }
                    `}</style>
                    <div className="flex justify-between items-center border-b border-gray-700 p-4 flex-shrink-0">
                        <h2 className="text-xl font-bold text-white">{isEditing ? 'Edit Transaction' : 'Record Transaction'}</h2>
                        <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-700" aria-label="Close">
                            <CloseIcon />
                        </button>
                    </div>

                    <div className="p-6 space-y-5 overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Fuel Type</label>
                            <RadioButtonGroup name="fuelType" options={[{value: FuelType.Petrol, label: 'Petrol'}, {value: FuelType.Diesel, label: 'Diesel'}]} selectedValue={fuelType} onChange={(v) => setFuelType(v as FuelType)} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Fuel Form</label>
                            <RadioButtonGroup name="fuelForm" options={[{value: 'amount', label: 'Amount (₹)'}, {value: 'volume', label: 'Volume (ltr)'}]} selectedValue={fuelForm} onChange={(v) => setFuelForm(v as 'amount' | 'volume')} />
                        </div>

                        {fuelForm && (
                            <div>
                                <label htmlFor="inputValue" className="block text-sm font-medium text-gray-400 mb-2 capitalize">{fuelForm}</label>
                                <input type="number" id="inputValue" value={inputValue} onChange={e => setInputValue(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500"
                                    placeholder={`Enter ${fuelForm}`}
                                />
                            </div>
                        )}

                        {fuelAmount > 0 && (
                             <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 text-center space-y-2">
                                <div className="flex justify-between items-center text-lg">
                                    <span className="text-gray-300">Total:</span>
                                    <span className="font-bold text-white">₹{fuelAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Volume:</span>
                                    <span className="font-semibold text-gray-200">{fuelVolume.toFixed(2)} ltr</span>
                                </div>
                        
                                {paymentMode && paymentMode !== 'bill' && parseFloat(amountPaid) > 0 && changeReturned !== null && (
                                    <div className="pt-2 border-t border-gray-600 space-y-1">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400">Paid:</span>
                                            <span className="font-semibold text-gray-200">₹{parseFloat(amountPaid).toFixed(2)}</span>
                                        </div>
                                         <div className={`flex justify-between items-center text-md font-bold ${changeReturned >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            <span>{changeReturned >= 0 ? `Change:` : `Due:`}</span>
                                            <span>₹{Math.abs(changeReturned).toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Mode of Payment</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {(Object.values(PaymentMode)).map(mode => (
                                    <button key={mode} type="button" onClick={() => setPaymentMode(mode)}
                                        className={`p-3 rounded-md text-center font-semibold transition-all duration-200 border-2 capitalize ${
                                            paymentMode === mode ? 'bg-cyan-500 border-cyan-500 text-white' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                                        }`}>
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {paymentMode && paymentMode !== PaymentMode.Bill && (
                            <div>
                                <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-400 mb-2">Amount Paid (₹)</label>
                                <input type="number" id="amountPaid" value={amountPaid} onChange={e => setAmountPaid(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-white" placeholder="Amount from customer" />
                            </div>
                        )}
                        
                        {paymentMode === PaymentMode.Bill && (
                            <div>
                                <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-400 mb-2">Vehicle Number or "Gallon"</label>
                                {!isGallonSale ? (
                                    <input type="text" id="vehicleNumber" value={vehicleNumber} onChange={e => handleVehicleNumberChange(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-white uppercase" placeholder="e.g., MH12AB1234 or GALLON" />
                                ) : (
                                    <div className="mt-2">
                                        <CustomSelect
                                            placeholder="Select Partner for Gallon Sale"
                                            options={ownerOptionsForSelect}
                                            value={selectedGallonOwner}
                                            onChange={handleGallonOwnerSelect}
                                        />
                                    </div>
                                )}
                                
                                {vehicleOwner && (
                                    <p className={`mt-2 text-sm text-center font-semibold ${vehicleOwner === 'Unknown' ? 'text-yellow-400' : 'text-green-400'}`}>
                                        {isGallonSale 
                                            ? `Gallon Sale To: ${vehicleOwner}` 
                                            : `Owner: ${vehicleOwner} ${vehicleType ? `(${vehicleType})` : ''}`
                                        }
                                        {vehicleOwner === 'Unknown' && 
                                        <button onClick={() => setIsRegisterModalOpen(true)} className="ml-2 text-xs bg-cyan-600 text-white px-2 py-1 rounded-md hover:bg-cyan-700">Register</button>}
                                    </p>
                                )}
                            </div>
                        )}

                    </div>
                    
                    <div className="p-4 border-t border-gray-700 flex-shrink-0">
                        {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}
                        <button
                            onClick={handleCommit}
                            className="w-full bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-colors duration-200"
                        >
                            {isEditing ? 'Update Transaction' : 'Commit Transaction'}
                        </button>
                    </div>
                </div>
            </div>
            <RegisterOwnerModal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
                onRegister={handleRegisterVehicle}
                owners={owners}
                vehicleNumber={vehicleNumber.trim().toUpperCase()}
            />
        </>
    );
};

export default TransactionModal;