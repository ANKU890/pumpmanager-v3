import React from 'react';
import type { Transaction } from '../types.ts';
import { FuelType, PaymentMode, TransactionType } from '../types.ts';
import PetrolIcon from './icons/PetrolIcon.tsx';
import DieselIcon from './icons/DieselIcon.tsx';
import CashIcon from './icons/CashIcon.tsx';
import CardIcon from './icons/CardIcon.tsx';
import PaytmIcon from './icons/PaytmIcon.tsx';
import BillIcon from './icons/BillIcon.tsx';
import EditIcon from './icons/EditIcon.tsx';
import DepositIcon from './icons/DepositIcon.tsx';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
}

const PaymentIcon: React.FC<{ mode?: PaymentMode }> = ({ mode }) => {
    switch (mode) {
        case PaymentMode.Cash: return <CashIcon />;
        case PaymentMode.Card: return <CardIcon />;
        case PaymentMode.Paytm: return <PaytmIcon />;
        case PaymentMode.Bill: return <BillIcon />;
        default: return null;
    }
};

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onEdit }) => {
    const { timestamp, type, fuelAmount, fuelType, fuelVolume, paymentMode, vehicleNumber, vehicleOwner, vehicleType, userName, userAvatarUrl } = transaction;

    const formattedDate = new Date(timestamp).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
    
    if (type === TransactionType.Deposit) {
        return (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 shadow-lg transition-all hover:bg-gray-800/80">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-500/20 text-blue-400">
                            <DepositIcon />
                        </div>
                        <div>
                            <p className="font-bold text-lg text-white">Cash Deposit</p>
                            <p className="text-sm text-gray-400">To Office</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg text-red-400">- ₹{fuelAmount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{formattedDate}</p>
                    </div>
                </div>
                {userName && userAvatarUrl && (
                    <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center space-x-2">
                        <img src={userAvatarUrl} alt={userName} className="w-6 h-6 rounded-full" />
                        <p className="text-xs text-gray-400">Deposited by <span className="font-semibold text-gray-300">{userName}</span></p>
                    </div>
                )}
            </div>
        );
    }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 shadow-lg transition-all hover:bg-gray-800/80">
        <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${fuelType === FuelType.Petrol ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {fuelType === FuelType.Petrol ? <PetrolIcon /> : <DieselIcon />}
                </div>
                <div>
                    <p className="font-bold text-lg text-white">₹{fuelAmount.toFixed(2)}</p>
                    <p className="text-sm text-gray-400">{fuelVolume?.toFixed(2)} ltr</p>
                </div>
            </div>
            <div className="flex items-start space-x-2">
                <div className="text-right">
                    <p className="text-sm text-gray-400">{formattedDate}</p>
                     <div className="flex items-center justify-end mt-1 text-cyan-400 space-x-2">
                        <PaymentIcon mode={paymentMode} />
                        <span className="capitalize text-sm font-semibold">{paymentMode}</span>
                    </div>
                </div>
                {onEdit && (
                    <button 
                        onClick={() => onEdit(transaction)} 
                        className="p-1 text-gray-400 hover:text-cyan-400 transition-colors" 
                        aria-label="Edit transaction"
                    >
                        <EditIcon />
                    </button>
                )}
            </div>
        </div>
        {(paymentMode === PaymentMode.Bill && (vehicleNumber || vehicleOwner)) &&
            <div className="mt-3 pt-3 border-t border-gray-700/50 text-xs text-gray-300 space-y-1">
                {vehicleNumber === 'GALLON' ? (
                    <p>Billed to: <span className="font-semibold text-white">{vehicleOwner}</span> (Gallon Sale)</p>
                ) : (
                    <>
                        <p>Vehicle: <span className="font-semibold text-white">{vehicleNumber}</span> {vehicleType && <span className="capitalize text-gray-400">({vehicleType})</span>}</p>
                        {vehicleOwner && <p>Owner: <span className="font-semibold text-white">{vehicleOwner}</span></p>}
                    </>
                )}
            </div>
        }
        
        {userName && userAvatarUrl && (
            <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center space-x-2">
                <img src={userAvatarUrl} alt={userName} className="w-6 h-6 rounded-full" />
                <p className="text-xs text-gray-400">Handled by <span className="font-semibold text-gray-300">{userName}</span></p>
            </div>
        )}
    </div>
  );
};

export default TransactionItem;