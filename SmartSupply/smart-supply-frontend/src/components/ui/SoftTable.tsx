import React from 'react';

interface SoftTableProps {
    headers: string[];
    children: React.ReactNode;
}

export const SoftTable: React.FC<SoftTableProps> = ({ headers, children }) => {
    return (
        <div className="soft-table-wrapper">
            <table className="soft-table">
                <thead>
                    <tr>
                        {headers.map((header, idx) => (
                            <th key={idx}>{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {children}
                </tbody>
            </table>
        </div>
    );
};
