import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string };

export function PrimaryButton({ label, ...rest }: ButtonProps) {
	return (
		<button style={{
			padding: '8px 12px',
			background: '#2563eb',
			color: 'white',
			border: 'none',
			borderRadius: 6,
			cursor: 'pointer'
		}} {...rest}>{label}</button>
	);
}
